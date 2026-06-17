'use client';
import { useEffect, useRef } from 'react';
import type { OnlineSnapshot } from './useOnlineGame';

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

function formatTime(s: number): string {
  const clamped = Math.max(0, s);
  const m = Math.floor(clamped / 60);
  const sec = Math.floor(clamped % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function OnlineGameCanvas({
  snapshot,
  role,
}: {
  snapshot: OnlineSnapshot;
  role: 'home' | 'guest' | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Players
    for (const p of snapshot.players) {
      const isHome = p.team === 'home';
      const isMyTeam = (role === 'home' && isHome) || (role === 'guest' && !isHome);
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isHome
        ? p.active ? '#22c55e' : '#15803d'
        : p.active ? '#3b82f6' : '#1d4ed8';
      ctx.fill();
      ctx.strokeStyle = isMyTeam && p.active ? '#fbbf24' : 'rgba(255,255,255,0.65)';
      ctx.lineWidth = isMyTeam && p.active ? 2.5 : 1.5;
      ctx.stroke();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.x, p.y);
    }

    // Ball
    ctx.beginPath();
    ctx.arc(snapshot.ball.x, snapshot.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // HUD
    const hm = FIELD_T / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(
      `Náhoda FC  ${snapshot.score.home}  :  ${snapshot.score.away}  FK Pařezov`,
      CANVAS_W / 2,
      hm - 7,
    );
    ctx.font = '11px monospace';
    ctx.fillStyle = snapshot.timeLeftSeconds < 15 ? '#f87171' : 'rgba(255,255,255,0.5)';
    ctx.fillText(formatTime(snapshot.timeLeftSeconds), CANVAS_W / 2, hm + 9);

    // Goal message overlay
    if (snapshot.goalMessage) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 68px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GÓL!', CANVAS_W / 2, CANVAS_H / 2 - 30);
      ctx.fillStyle = 'white';
      ctx.font = '22px sans-serif';
      ctx.fillText(snapshot.goalMessage, CANVAS_W / 2, CANVAS_H / 2 + 20);
    }
  }, [snapshot, role]);

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
      }}
    />
  );
}
