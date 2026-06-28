'use client';

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { CANVAS_W, CANVAS_H } from '@/game/constants';
import { createInitialState } from '@/game/createInitialState';
import { createInputState, attachInputListeners } from '@/game/input';
import { updateGame } from '@/game/updateGame';
import { renderGame } from '@/game/renderGame';
import { resumeAudio } from '@/game/audio';
import { playKickoffWhistle, playGoalSound, playRestartSound } from '@/lib/audio/whistleEngine';
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameModeConfig = { disableOpponentAI, matchDurationSeconds, gameplayProfile };

    // Mutable refs — not React state to avoid stale closures in RAF
    let gameState: GameState = createInitialState(undefined, matchDurationSeconds, gameplayProfile);
    const input: InputState = createInputState();

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

    // Debug: 'B' starts "Bounce Time!" — only wired up by /hra/bot-dis.
    // Mutates the running gameState directly (same object the RAF loop
    // already reads/writes each tick) rather than routing through input.ts,
    // since this is a debug trigger, not a real gameplay input.
    const onBounceTimeKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'b') return;
      gameState.activeGameplayModifier = 'bounceTime';
      gameState.gameplayModifierRemainingSeconds = BOUNCE_TIME_DURATION_SECONDS;
    };
    if (enableBounceTimeDebug) {
      window.addEventListener('keydown', onBounceTimeKey);
    }

    let rafId: number;
    let lastTime = performance.now();
    let prevPhase = gameState.phase;
    let firstGoalFired = false;
    let prevBounceTimeActive = gameState.activeGameplayModifier !== 'none';
    let prevRemovalIds = new Set(gameState.temporaryRemovals.map((r) => r.playerId));

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

      const wasRestart = merged.restart;
      gameState = updateGame(gameState, merged, dt, undefined, undefined, gameModeConfig);

      // Kickoff on manual restart; goal sound on goal entry; pum on restart
      if (wasRestart) {
        playKickoffWhistle();
      } else if (prevPhase !== 'goal' && gameState.phase === 'goal') {
        playGoalSound();
      } else if (prevPhase === 'goal' && gameState.phase === 'playing') {
        playRestartSound();
      }
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

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      removeInput();
      window.removeEventListener('keydown', onFirstKey);
      window.removeEventListener('keydown', onEsc);
      if (enableBounceTimeDebug) {
        window.removeEventListener('keydown', onBounceTimeKey);
      }
    };
  }, [
    onMatchEnd, onRestart, onFirstGoal, onSubstitution, onBounceTimeChange, touchInputRef, homeTeamName,
    disableOpponentAI, matchDurationSeconds, gameplayProfile, enableBounceTimeDebug,
  ]);

  return (
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
  );
}
