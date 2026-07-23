'use client';
import { useEffect, useRef, useState } from 'react';
import type { OnlineSnapshot, OnlinePlayer } from './useOnlineGame';
import { concededGoalMessages, pickRandomMessage } from '@/lib/game/matchCommentaryMessages';
import PlayerRenderer, { type PlayerRendererHandle } from '@/game/rendering/players/PlayerRenderer';
import { resolveOnlinePlayerRenderStates, createFacingDirectionTracker } from '@/game/rendering/players/resolvePlayerRenderState';
import { getPlayerVisualTemplate, onPlayerVisualTemplateChange } from '@/game/presentation/playerVisualSettings';

// Constants mirroring server
const CANVAS_W = 960;
const CANVAS_H = 540;
const FIELD_L = 60;
const FIELD_R = 900;
const FIELD_T = 50;
const FIELD_B = 510;
const FIELD_CX = 480;
const FIELD_CY = 280;
const GOAL_T = 215;
const GOAL_B = 345;
const GOAL_DEPTH = 18;
const PLAYER_RADIUS = 18;
const BALL_RADIUS = 10;

// Lerp factor per RAF frame — at 60fps gives smooth catch-up within ~3 frames
const LERP = 0.3;

interface RenderPlayer extends OnlinePlayer {
  rx: number; // rendered (interpolated) x
  ry: number; // rendered (interpolated) y
  pvx: number; // previous-frame velocity x (for arrow direction)
  pvy: number; // previous-frame velocity y
}

interface RenderState {
  ball: { rx: number; ry: number };
  players: RenderPlayer[];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function formatTime(s: number): string {
  const clamped = Math.max(0, s);
  const m = Math.floor(clamped / 60);
  const sec = Math.floor(clamped % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Visual-only kick charge feedback — how much the active player's ring
// grows while the local player holds the shoot button. Purely client-side
// (own input, own screen); doesn't touch the server-authoritative kick force.
// Still used below to compute kickChargeProgress, now fed into
// resolveOnlinePlayerRenderStates() for the shared player renderer instead
// of a canvas-drawn ring.
const CHARGE_RING_MAX_MS = 1500; // mirrors KICK_MAX_CHARGE_MS server-side

function drawFrame(
  ctx: CanvasRenderingContext2D,
  render: RenderState,
  snap: OnlineSnapshot,
  concededMessage: string,
) {
  // Clear
  ctx.fillStyle = '#030e08';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Field stripes
  const stripes = 8;
  const sw = (FIELD_R - FIELD_L) / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1c4d10' : '#1f5513';
    ctx.fillRect(FIELD_L + i * sw, FIELD_T, sw, FIELD_B - FIELD_T);
  }

  // Dark borders outside field
  ctx.fillStyle = '#163d0c';
  ctx.fillRect(0, FIELD_T, FIELD_L, FIELD_B - FIELD_T);
  ctx.fillRect(FIELD_R, FIELD_T, CANVAS_W - FIELD_R, FIELD_B - FIELD_T);
  ctx.fillRect(0, 0, CANVAS_W, FIELD_T);
  ctx.fillRect(0, FIELD_B, CANVAS_W, CANVAS_H - FIELD_B);

  // Field lines
  ctx.strokeStyle = 'rgba(255,255,255,0.82)';
  ctx.lineWidth = 2;
  ctx.strokeRect(FIELD_L, FIELD_T, FIELD_R - FIELD_L, FIELD_B - FIELD_T);
  ctx.beginPath();
  ctx.moveTo(FIELD_CX, FIELD_T);
  ctx.lineTo(FIELD_CX, FIELD_B);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(FIELD_CX, FIELD_CY, 64, 0, Math.PI * 2);
  ctx.stroke();

  // Goals
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(FIELD_L, GOAL_T);
  ctx.lineTo(FIELD_L - GOAL_DEPTH, GOAL_T);
  ctx.lineTo(FIELD_L - GOAL_DEPTH, GOAL_B);
  ctx.lineTo(FIELD_L, GOAL_B);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(FIELD_R, GOAL_T);
  ctx.lineTo(FIELD_R + GOAL_DEPTH, GOAL_T);
  ctx.lineTo(FIELD_R + GOAL_DEPTH, GOAL_B);
  ctx.lineTo(FIELD_R, GOAL_B);
  ctx.stroke();

  // Players — rendered by the shared DOM/SVG overlay (game/rendering/players/)
  // on top of this canvas, see the component below (playerRendererRef.update()
  // right after this drawFrame() call each frame). Not drawn here any more.

  // Ball (from interpolated render state)
  ctx.beginPath();
  ctx.arc(render.ball.rx, render.ball.ry, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // HUD — always from latest snapshot (no lerp needed for UI)
  const hm = FIELD_T / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px monospace';
  const homeName = snap.homeClubName ?? 'Domácí';
  const awayName = snap.awayClubName ?? 'Hosté';
  ctx.fillText(
    `${homeName}  ${snap.score.home}  :  ${snap.score.away}  ${awayName}`,
    CANVAS_W / 2,
    hm - 7,
  );
  ctx.font = '11px monospace';
  ctx.fillStyle = snap.timeLeftSeconds < 15 ? '#f87171' : 'rgba(255,255,255,0.5)';
  ctx.fillText(formatTime(snap.timeLeftSeconds), CANVAS_W / 2, hm + 9);

  // Goal message overlay
  if (snap.goalMessage) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 68px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GÓL!', CANVAS_W / 2, CANVAS_H / 2 - 30);
    ctx.fillStyle = 'white';
    ctx.font = '22px sans-serif';
    ctx.fillText(snap.goalMessage, CANVAS_W / 2, CANVAS_H / 2 + 20);
    if (concededMessage) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = 'italic 14px sans-serif';
      ctx.fillText(concededMessage, CANVAS_W / 2, CANVAS_H / 2 + 44);
    }
  }
}

export default function OnlineGameCanvas({
  snapshot,
  role,
  keysRef,
  touchRef,
}: {
  snapshot: OnlineSnapshot;
  role: 'home' | 'guest' | null;
  // Existing local input refs (see OnlineGameClient.tsx) — reused here only
  // to drive the charge-ring visual; never sent anywhere new, never used to
  // decide gameplay (the server remains authoritative for the actual kick).
  keysRef?: { current: { kick: boolean } };
  touchRef?: { current: { kick: boolean } };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRendererRef = useRef<PlayerRendererHandle>(null);
  const facingTrackerRef = useRef(createFacingDirectionTracker());
  const targetRef = useRef<OnlineSnapshot>(snapshot);
  const renderRef = useRef<RenderState | null>(null);
  const rafRef = useRef<number>(0);
  const concededMessageRef = useRef<string>('');
  const prevGoalMessageRef = useRef<string>('');
  // Purely local, cosmetic preference (game/presentation/playerVisualSettings.ts)
  // — never read by the socket/game logic below, switching it can't affect
  // the server-authoritative match in any way.
  const [visualTemplate, setVisualTemplate] = useState(getPlayerVisualTemplate);
  useEffect(() => onPlayerVisualTemplateChange(setVisualTemplate), []);
  const kickHeldSinceRef = useRef<number | null>(null);

  // Update target whenever a new snapshot arrives
  useEffect(() => {
    targetRef.current = snapshot;
    // Initialise render state from first snapshot so lerp has a start position
    if (!renderRef.current) {
      renderRef.current = {
        ball: { rx: snapshot.ball.x, ry: snapshot.ball.y },
        players: snapshot.players.map((p) => ({ ...p, rx: p.x, ry: p.y, pvx: 0, pvy: 0 })),
      };
    }

    // Conceded-goal sub-message is perspective-dependent (same goal is a
    // "scored" for one player and "conceded" for the other), so it's picked
    // client-side from the server-authoritative lastScorer, once per goal.
    const msg = snapshot.goalMessage ?? '';
    if (msg && msg !== prevGoalMessageRef.current) {
      const concededByMe =
        (role === 'home' && snapshot.lastScorer === 'away') ||
        (role === 'guest' && snapshot.lastScorer === 'home');
      concededMessageRef.current = concededByMe ? pickRandomMessage(concededGoalMessages) : '';
    } else if (!msg) {
      concededMessageRef.current = '';
    }
    prevGoalMessageRef.current = msg;
  }, [snapshot, role]);

  // RAF loop — starts once, reads target via ref, no snapshot dependency
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function frame() {
      const target = targetRef.current;
      let render = renderRef.current;

      // Lazy-init if snapshot arrived before RAF started
      if (!render) {
        render = {
          ball: { rx: target.ball.x, ry: target.ball.y },
          players: target.players.map((p) => ({ ...p, rx: p.x, ry: p.y, pvx: 0, pvy: 0 })),
        };
        renderRef.current = render;
      }

      const r = render;

      // Interpolate ball toward target
      r.ball.rx = lerp(r.ball.rx, target.ball.x, LERP);
      r.ball.ry = lerp(r.ball.ry, target.ball.y, LERP);

      // Interpolate players toward target; sync non-positional state directly
      for (let i = 0; i < target.players.length; i++) {
        const tp = target.players[i];
        const rp = r.players[i];
        if (!tp) continue;
        if (!rp) {
          r.players[i] = { ...tp, rx: tp.x, ry: tp.y, pvx: 0, pvy: 0 };
          continue;
        }
        const prevRx = rp.rx;
        const prevRy = rp.ry;
        rp.rx = lerp(rp.rx, tp.x, LERP);
        rp.ry = lerp(rp.ry, tp.y, LERP);
        // Smooth velocity from position delta for arrow direction
        rp.pvx = lerp(rp.pvx, (rp.rx - prevRx) * 30, 0.25);
        rp.pvy = lerp(rp.pvy, (rp.ry - prevRy) * 30, 0.25);
        rp.active = tp.active;
        rp.team = tp.team;
        rp.label = tp.label;
        rp.removed = tp.removed;
      }

      // Charge-ring progress from the local kick button hold — purely visual,
      // tracked client-side via the existing input refs (no new input system,
      // no server round-trip).
      const kickHeld = !!(keysRef?.current.kick || touchRef?.current.kick);
      if (kickHeld && kickHeldSinceRef.current === null) {
        kickHeldSinceRef.current = performance.now();
      } else if (!kickHeld) {
        kickHeldSinceRef.current = null;
      }
      const kickChargeProgress = kickHeldSinceRef.current === null
        ? 0
        : Math.min(1, (performance.now() - kickHeldSinceRef.current) / CHARGE_RING_MAX_MS);

      drawFrame(ctx!, r, target, concededMessageRef.current);

      const myTeam: 'home' | 'away' | null = role === 'home' ? 'home' : role === 'guest' ? 'away' : null;
      playerRendererRef.current?.update(
        resolveOnlinePlayerRenderStates(
          r.players,
          { x: r.ball.rx, y: r.ball.ry },
          myTeam,
          kickChargeProgress,
          facingTrackerRef.current,
        ),
      );

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [role, keysRef, touchRef]); // role is stable after joining; RAF restarts only if role changes

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
