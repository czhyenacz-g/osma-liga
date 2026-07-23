'use client';

import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { CANVAS_W, CANVAS_H, FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CY, BALL_RADIUS, KICK_MAX_CHARGE_MS, PLAYER_RADIUS } from '@/game/constants';
import { createInitialState } from '@/game/createInitialState';
import { createInputState, attachInputListeners } from '@/game/input';
import { updateGame } from '@/game/updateGame';
import { renderGame } from '@/game/renderGame';
import { resumeAudio } from '@/game/audio';
import PlayerRenderer, { type PlayerRendererHandle } from '@/game/rendering/players/PlayerRenderer';
import { resolveBotPlayerRenderStates, createFacingDirectionTracker } from '@/game/rendering/players/resolvePlayerRenderState';
import { getPlayerVisualTemplate, onPlayerVisualTemplateChange } from '@/game/presentation/playerVisualSettings';
import { playKickoffWhistle, playGoalSound, playRestartSound } from '@/lib/audio/whistleEngine';
import { inMatchAudio } from '@/game/audio/inMatchAudio';
import {
  PRESSURE_DISTANCE, CROWD_PRESSURE_MAX_VOLUME,
  NEAR_GOAL_OOH_PRESSURE_THRESHOLD, NEAR_GOAL_OOH_MIN_BALL_SPEED,
  NEAR_GOAL_PRESSURE_THRESHOLD, NEAR_GOAL_PRESSURE_BED_STOP_THRESHOLD,
  NEAR_GOAL_PRESSURE_FADE_IN_MS, NEAR_GOAL_PRESSURE_FADE_OUT_MS,
  NEAR_GOAL_PRESSURE_BED_VOLUME_BASE, NEAR_GOAL_PRESSURE_BED_VOLUME_MAX, NEAR_GOAL_PRESSURE_BED_VOLUME_RANGE,
} from '@/game/audio/inMatchSoundConfig';
import type { GameState, InputState, TouchInput } from '@/game/types';
import type { GameplayProfile } from '@/game/gameplayProfiles';
import { BOUNCE_TIME_DURATION_SECONDS } from '@/game/gameplayProfiles';

interface Props {
  onMatchEnd?: (score: { home: number; away: number }) => void;
  onRestart?: () => void;
  onFirstGoal?: () => void;
  onSubstitution?: () => void;
  onBounceTimeChange?: (active: boolean) => void;
  touchInputRef?: MutableRefObject<TouchInput>;
  homeTeamName?: string;
  // bot-dis training variant: away team AI disabled, longer match duration.
  disableOpponentAI?: boolean;
  matchDurationSeconds?: number;
  // Gameplay profile for this match (see gameplayProfiles.ts) — only ever
  // set by /hra/bot-dis today.
  gameplayProfile?: GameplayProfile;
  // Debug-only: lets the 'B' key trigger "Bounce Time!" — only wired up by
  // /hra/bot-dis, never by the regular /hra/bot page.
  enableBounceTimeDebug?: boolean;
}

export default function GameCanvas({
  onMatchEnd, onRestart, onFirstGoal, onSubstitution, onBounceTimeChange, touchInputRef, homeTeamName,
  disableOpponentAI, matchDurationSeconds, gameplayProfile, enableBounceTimeDebug,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRendererRef = useRef<PlayerRendererHandle>(null);

  // These refs allow the RAF loop to read the latest prop values each tick
  // without the effect restarting (and resetting the match) on every change.
  const gameModeConfigRef = useRef({ disableOpponentAI, matchDurationSeconds, gameplayProfile });
  gameModeConfigRef.current = { disableOpponentAI, matchDurationSeconds, gameplayProfile };
  const enableBounceTimeDebugRef = useRef(enableBounceTimeDebug);
  enableBounceTimeDebugRef.current = enableBounceTimeDebug;

  // Player visual template — a purely local, cosmetic preference (see
  // game/presentation/playerVisualSettings.ts). Re-rendering PlayerRenderer
  // when the user switches it is the ONLY thing this state is for; it is
  // never read by updateGame()/the RAF loop below and switching it never
  // touches gameState.
  const [visualTemplate, setVisualTemplate] = useState(getPlayerVisualTemplate);
  useEffect(() => onPlayerVisualTemplateChange(setVisualTemplate), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mutable refs — not React state to avoid stale closures in RAF
    let gameState: GameState = createInitialState(
      undefined,
      gameModeConfigRef.current.matchDurationSeconds,
      gameModeConfigRef.current.gameplayProfile,
    );
    const input: InputState = createInputState();
    const facingTracker = createFacingDirectionTracker();

    const removeInput = attachInputListeners(input);

    // Unlock AudioContext on first keypress (required by browser autoplay policy)
    const onFirstKey = () => { resumeAudio(); };
    window.addEventListener('keydown', onFirstKey, { once: true });

    // Esc navigates to šatna when match is ended
    const onEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && gameState.phase === 'ended') {
        window.location.href = '/satna';
      }
    };
    window.addEventListener('keydown', onEsc);

    // Debug: 'B' starts "Bounce Time!" — guard via ref so this works even
    // when enableBounceTimeDebug changes at runtime (e.g. mode switch).
    const onBounceTimeKey = (e: KeyboardEvent) => {
      if (!enableBounceTimeDebugRef.current) return;
      if (e.key.toLowerCase() !== 'b') return;
      gameState.activeGameplayModifier = 'bounceTime';
      gameState.gameplayModifierRemainingSeconds = BOUNCE_TIME_DURATION_SECONDS;
    };
    window.addEventListener('keydown', onBounceTimeKey);

    let rafId: number;
    let lastTime = performance.now();
    let prevPhase = gameState.phase;
    let firstGoalFired = false;
    let prevBounceTimeActive = gameState.activeGameplayModifier !== 'none';
    let prevRemovalIds = new Set(gameState.temporaryRemovals.map((r) => r.playerId));

    // ── In-match audio tracking (game/audio/inMatchAudio.ts) ──────────────────
    // Read-only diffing of gameState between ticks — no changes to updateGame/
    // physics/passAndSwitch.
    let prevSwitchKeyDown = false;
    let prevKickWasDown = gameState.kickWasDown;
    let prevKickHeldSeconds = gameState.kickHeldSeconds;
    // Near-goal crowd pressure bed — smoothed 0..1, fades in/out over ~2s
    // (see NEAR_GOAL_PRESSURE_FADE_IN_MS/OUT_MS) so it never snaps abruptly.
    // Symmetric: fires near either goal, regardless of which team is attacking.
    let smoothedNearGoalPressure = 0;
    // Tracks whether the long pressure-bed audio is currently started, so we
    // only call startRandomBedFromPool/stopBed once per transition instead of
    // every frame (stopBed restarts its own fade-out animation on each call).
    let nearGoalBedActive = false;

    const loop = (now: number) => {
      // Cap dt to 50ms to prevent large jumps after tab switch
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const touch = touchInputRef?.current;
      const merged: InputState = touch
        ? {
            up: input.up || touch.up,
            down: input.down || touch.down,
            left: input.left || touch.left,
            right: input.right || touch.right,
            kick: input.kick || touch.kick,
            restart: input.restart,
            switchPlayer: input.switchPlayer || touch.switchPlayer,
          }
        : input;

      // Same edge condition updateGame() uses internally for Q/PŘEP. (manual
      // switch) — computed here too so we can tell a manual switch apart from
      // the constant automatic (distance-based) active-player reassignment,
      // which must NOT play a sound on every change.
      const manualSwitchEdge = merged.switchPlayer && !prevSwitchKeyDown;
      const activePlayerIdBeforeTick = gameState.activePlayerId;

      const wasRestart = merged.restart;
      gameState = updateGame(gameState, merged, dt, undefined, undefined, gameModeConfigRef.current);

      // Kickoff on manual restart; goal sound on goal entry; pum on restart
      if (wasRestart) {
        playKickoffWhistle();
        smoothedNearGoalPressure = 0;
        inMatchAudio.stopBed('nearGoalPressureBed');
        nearGoalBedActive = false;
      } else if (prevPhase !== 'goal' && gameState.phase === 'goal') {
        playGoalSound();
        // Crowd reaction after any goal (either team) — doesn't overpower the
        // whistle, edge-triggered exactly once per goal via the phase change.
        inMatchAudio.playRandomFromPool('afterGoalCrowd');
      } else if (prevPhase === 'goal' && gameState.phase === 'playing') {
        playRestartSound();
      }

      // ── In-match SFX: kick / player switch / wall bounce ──────────────────
      const bounceProfileActive =
        gameModeConfigRef.current.gameplayProfile === 'bounce' ||
        gameState.activeGameplayModifier === 'bounceTime';

      // Kick fires on release of the (charged) kick button — see comment in
      // updateGame.ts "Space kick". A release only actually produced a kick if
      // the kicker's cooldown was just reset to KICK_COOLDOWN this tick.
      if (prevKickWasDown && !gameState.kickWasDown) {
        const kicker = gameState.players.find((p) => p.id === activePlayerIdBeforeTick);
        if (kicker && kicker.kickCooldown > 0.2) {
          const chargedLongEnough = prevKickHeldSeconds * 1000 > KICK_MAX_CHARGE_MS * 0.3;
          inMatchAudio.play(chargedLongEnough ? 'kickHard' : 'kickSoft');
        }
      }

      // Manual (Q / PŘEP.) active-player switch only — not the automatic
      // distance-based reassignment, which changes far too often for a sound.
      if (manualSwitchEdge && gameState.activePlayerId !== activePlayerIdBeforeTick) {
        inMatchAudio.play('playerSwitch');
      }

      // Wall bounce: physics.ts snaps ball.pos to exactly this clamp value the
      // tick a bounce happens, with velocity now pointing away from the wall —
      // a read-only replica of that condition, no engine changes.
      const { ball } = gameState;
      const bounceEps = 0.5;
      const wallBounced =
        (Math.abs(ball.pos.y - (FIELD_T + BALL_RADIUS)) < bounceEps && ball.vel.y > 0) ||
        (Math.abs(ball.pos.y - (FIELD_B - BALL_RADIUS)) < bounceEps && ball.vel.y < 0) ||
        (Math.abs(ball.pos.x - (FIELD_L + BALL_RADIUS)) < bounceEps && ball.vel.x > 0) ||
        (Math.abs(ball.pos.x - (FIELD_R - BALL_RADIUS)) < bounceEps && ball.vel.x < 0);
      if (wallBounced) {
        inMatchAudio.play(bounceProfileActive ? 'pongBounce' : 'ballBounce');
      }

      // ── Crowd pressure loop + near-goal "ooh" ──────────────────────────────
      // pressure = how close the ball is to whichever goal it's nearest to.
      if (gameState.phase === 'playing') {
        const distToGoal = Math.min(
          Math.hypot(ball.pos.x - FIELD_L, ball.pos.y - FIELD_CY),
          Math.hypot(ball.pos.x - FIELD_R, ball.pos.y - FIELD_CY),
        );
        const pressure = 1 - Math.max(0, Math.min(1, distToGoal / PRESSURE_DISTANCE));
        inMatchAudio.setLoopVolume('crowdPressure', pressure * CROWD_PRESSURE_MAX_VOLUME);

        const ballSpeed = Math.hypot(ball.vel.x, ball.vel.y);
        if (pressure > NEAR_GOAL_OOH_PRESSURE_THRESHOLD && ballSpeed > NEAR_GOAL_OOH_MIN_BALL_SPEED) {
          inMatchAudio.play('nearGoalOoh'); // internally cooldown-gated (NEAR_GOAL_OOH_COOLDOWN_MS)
        }

        // ── Near-goal crowd pressure bed (symmetric, long dynamic bed) ───────
        // Reuses the same "pressure" as the ambient crowdPressure loop above
        // (closeness to whichever goal the ball is nearest) — fires for
        // pressure near EITHER goal, whether the human or the bot is
        // attacking/defending. Instead of repeated long one-shots, a single
        // long file plays continuously while pressure is elevated, with its
        // volume tracking smoothedNearGoalPressure (which already ramps over
        // ~2s), so it fades in/out smoothly instead of cutting abruptly.
        const targetNearGoalPressure = pressure;

        // Linear ramp toward the target over NEAR_GOAL_PRESSURE_FADE_IN/OUT_MS —
        // same rate both ways since both constants are currently equal.
        const fadeMs = targetNearGoalPressure > smoothedNearGoalPressure
          ? NEAR_GOAL_PRESSURE_FADE_IN_MS
          : NEAR_GOAL_PRESSURE_FADE_OUT_MS;
        const maxDelta = (dt * 1000) / fadeMs;
        const diff = targetNearGoalPressure - smoothedNearGoalPressure;
        smoothedNearGoalPressure += Math.max(-maxDelta, Math.min(maxDelta, diff));

        const bedVolume = Math.max(
          0,
          Math.min(NEAR_GOAL_PRESSURE_BED_VOLUME_MAX, NEAR_GOAL_PRESSURE_BED_VOLUME_BASE + smoothedNearGoalPressure * NEAR_GOAL_PRESSURE_BED_VOLUME_RANGE),
        );

        if (smoothedNearGoalPressure > NEAR_GOAL_PRESSURE_THRESHOLD) {
          if (!nearGoalBedActive) {
            // Picks a random file from the pool (avoiding an immediate repeat)
            // — a no-op if a bed is somehow already playing, so this can never
            // start a second long file in parallel.
            inMatchAudio.startRandomBedFromPool('nearGoalPressureBed', { volume: bedVolume, loop: true });
            nearGoalBedActive = true;
          } else {
            inMatchAudio.setBedVolume('nearGoalPressureBed', bedVolume);
          }
        } else if (nearGoalBedActive) {
          if (smoothedNearGoalPressure < NEAR_GOAL_PRESSURE_BED_STOP_THRESHOLD) {
            // Pressure faded almost to zero — stop for good (own short fade-out).
            inMatchAudio.stopBed('nearGoalPressureBed', { fadeMs: NEAR_GOAL_PRESSURE_FADE_OUT_MS });
            nearGoalBedActive = false;
          } else {
            // Between the stop and start thresholds: still winding down, keep
            // tracking the (already-decreasing) smoothed pressure.
            inMatchAudio.setBedVolume('nearGoalPressureBed', bedVolume);
          }
        }
      } else if (prevPhase !== 'goal' && gameState.phase === 'goal') {
        // Ball just went in — hush the crowd pressure loop during the reset.
        inMatchAudio.setLoopVolume('crowdPressure', 0);
        smoothedNearGoalPressure = 0;
        inMatchAudio.stopBed('nearGoalPressureBed');
        nearGoalBedActive = false;
      }

      prevSwitchKeyDown = merged.switchPlayer;
      prevKickWasDown = gameState.kickWasDown;
      prevKickHeldSeconds = gameState.kickHeldSeconds;

      // Notify parent when match ends for the first time
      if (prevPhase !== 'ended' && gameState.phase === 'ended') {
        onMatchEnd?.({ home: gameState.score.home, away: gameState.score.away });
      }

      // Notify parent once after the first goal of the match
      if (!firstGoalFired && prevPhase !== 'goal' && gameState.phase === 'goal') {
        firstGoalFired = true;
        onFirstGoal?.();
      }

      // Notify parent on restart so save UI can reset
      if (wasRestart) {
        onRestart?.();
      }

      // Notify parent when a new temporary removal (e.g. random substitution) starts
      const removalIds = new Set(gameState.temporaryRemovals.map((r) => r.playerId));
      if (!wasRestart) {
        for (const id of removalIds) {
          if (!prevRemovalIds.has(id)) {
            onSubstitution?.();
            break;
          }
        }
      }
      prevRemovalIds = removalIds;

      // Notify parent when "Bounce Time!" starts/ends so it can show/hide
      // the overlay. A restart always resets to a fresh state with the
      // modifier off, so this naturally flips back to false too.
      const bounceTimeActive = gameState.activeGameplayModifier !== 'none';
      if (bounceTimeActive !== prevBounceTimeActive) {
        prevBounceTimeActive = bounceTimeActive;
        onBounceTimeChange?.(bounceTimeActive);
      }

      prevPhase = gameState.phase;

      renderGame(ctx, gameState, homeTeamName);
      playerRendererRef.current?.update(resolveBotPlayerRenderStates(gameState, facingTracker));

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      removeInput();
      window.removeEventListener('keydown', onFirstKey);
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('keydown', onBounceTimeKey);
      // Safety net alongside MatchPageClient's own stopAll() on restart/unmount.
      inMatchAudio.stopAll();
    };
  // gameModeConfigRef and enableBounceTimeDebugRef are intentionally excluded —
  // they update synchronously each render via ref assignment above, so the
  // RAF loop always reads the latest values without triggering a game restart.
  }, [onMatchEnd, onRestart, onFirstGoal, onSubstitution, onBounceTimeChange, touchInputRef, homeTeamName]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: CANVAS_W }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          maxWidth: CANVAS_W,
          borderRadius: '6px',
          outline: '1px solid rgba(255,255,255,0.1)',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />
      <PlayerRenderer
        ref={playerRendererRef}
        template={visualTemplate}
        viewBoxWidth={CANVAS_W}
        viewBoxHeight={CANVAS_H}
        hitboxRadiusPx={PLAYER_RADIUS}
        initialPlayers={[]}
      />
    </div>
  );
}
