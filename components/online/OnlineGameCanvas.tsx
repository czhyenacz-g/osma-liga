'use client';
import { useEffect, useRef } from 'react';
import type { OnlineSnapshot, OnlinePlayer } from './useOnlineGame';

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

function drawFrame(
  ctx: CanvasRenderingContext2D,
  render: RenderState,
  snap: OnlineSnapshot,
  role: 'home' | 'guest' | null,
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

  // Players (from interpolated render state)
  for (const rp of render.players) {
    const isHome = rp.team === 'home';
    const isMyTeam = (role === 'home' && isHome) || (role === 'guest' && !isHome);
    ctx.beginPath();
    ctx.arc(rp.rx, rp.ry, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isHome
      ? rp.active ? '#22c55e' : '#15803d'
      : rp.active ? '#3b82f6' : '#1d4ed8';
    ctx.fill();
    ctx.strokeStyle = isMyTeam && rp.active ? '#fbbf24' : 'rgba(255,255,255,0.65)';
    ctx.lineWidth = isMyTeam && rp.active ? 2.5 : 1.5;
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rp.label, rp.rx, rp.ry);
  }

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
  ctx.fillText(
    `Náhoda FC  ${snap.score.home}  :  ${snap.score.away}  FK Pařezov`,
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
  }
}

export default function OnlineGameCanvas({
  snapshot,
  role,
}: {
  snapshot: OnlineSnapshot;
  role: 'home' | 'guest' | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<OnlineSnapshot>(snapshot);
  const renderRef = useRef<RenderState | null>(null);
  const rafRef = useRef<number>(0);

  // Update target whenever a new snapshot arrives
  useEffect(() => {
    targetRef.current = snapshot;
    // Initialise render state from first snapshot so lerp has a start position
    if (!renderRef.current) {
      renderRef.current = {
        ball: { rx: snapshot.ball.x, ry: snapshot.ball.y },
        players: snapshot.players.map((p) => ({ ...p, rx: p.x, ry: p.y })),
      };
    }
  }, [snapshot]);

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
          players: target.players.map((p) => ({ ...p, rx: p.x, ry: p.y })),
        };
        renderRef.current = render;
      }

      // Interpolate ball toward target
      render.ball.rx = lerp(render.ball.rx, target.ball.x, LERP);
      render.ball.ry = lerp(render.ball.ry, target.ball.y, LERP);

      // Interpolate players toward target; sync non-positional state directly
      for (let i = 0; i < target.players.length; i++) {
        const tp = target.players[i];
        const rp = render.players[i];
        if (!tp) continue;
        if (!rp) {
          render.players[i] = { ...tp, rx: tp.x, ry: tp.y };
          continue;
        }
        rp.rx = lerp(rp.rx, tp.x, LERP);
        rp.ry = lerp(rp.ry, tp.y, LERP);
        rp.active = tp.active;
        rp.team = tp.team;
        rp.label = tp.label;
      }

      drawFrame(ctx!, render, target, role);
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [role]); // role is stable after joining; RAF restarts only if role changes

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
