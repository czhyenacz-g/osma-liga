import type { GameState } from './types';
import {
  CANVAS_W, CANVAS_H,
  FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CX, FIELD_CY,
  GOAL_T, GOAL_B, GOAL_DEPTH,
  PLAYER_RADIUS, BALL_RADIUS,
} from './constants';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  // ── Background ────────────────────────────────────────────────────────────

  // HUD strip
  ctx.fillStyle = 'rgba(3,18,10,0.92)';
  ctx.fillRect(0, 0, CANVAS_W, FIELD_T);

  // Grass stripes
  const stripes = 8;
  const stripeW = (FIELD_R - FIELD_L) / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1c4d10' : '#1f5513';
    ctx.fillRect(FIELD_L + i * stripeW, FIELD_T, stripeW, FIELD_B - FIELD_T);
  }

  // Field outside grass margin
  ctx.fillStyle = '#163d0c';
  ctx.fillRect(0, FIELD_T, FIELD_L, FIELD_B - FIELD_T);
  ctx.fillRect(FIELD_R, FIELD_T, CANVAS_W - FIELD_R, FIELD_B - FIELD_T);
  ctx.fillRect(0, FIELD_B, CANVAS_W, CANVAS_H - FIELD_B);

  // ── Field lines ───────────────────────────────────────────────────────────

  ctx.strokeStyle = 'rgba(255,255,255,0.82)';
  ctx.lineWidth = 2;

  // Field border
  ctx.strokeRect(FIELD_L, FIELD_T, FIELD_R - FIELD_L, FIELD_B - FIELD_T);

  // Center line
  ctx.beginPath();
  ctx.moveTo(FIELD_CX, FIELD_T);
  ctx.lineTo(FIELD_CX, FIELD_B);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(FIELD_CX, FIELD_CY, 64, 0, Math.PI * 2);
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(FIELD_CX, FIELD_CY, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fill();

  // ── Goals ─────────────────────────────────────────────────────────────────

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2.5;

  // Left goal (home defends)
  ctx.beginPath();
  ctx.moveTo(FIELD_L, GOAL_T);
  ctx.lineTo(FIELD_L - GOAL_DEPTH, GOAL_T);
  ctx.lineTo(FIELD_L - GOAL_DEPTH, GOAL_B);
  ctx.lineTo(FIELD_L, GOAL_B);
  ctx.stroke();

  // Right goal (away defends)
  ctx.beginPath();
  ctx.moveTo(FIELD_R, GOAL_T);
  ctx.lineTo(FIELD_R + GOAL_DEPTH, GOAL_T);
  ctx.lineTo(FIELD_R + GOAL_DEPTH, GOAL_B);
  ctx.lineTo(FIELD_R, GOAL_B);
  ctx.stroke();

  // Goal net fill
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(FIELD_L - GOAL_DEPTH, GOAL_T, GOAL_DEPTH, GOAL_B - GOAL_T);
  ctx.fillRect(FIELD_R, GOAL_T, GOAL_DEPTH, GOAL_B - GOAL_T);

  // ── Players ───────────────────────────────────────────────────────────────

  for (const p of state.players) {
    const isActive = p.id === state.activePlayerId && p.team === 'home';
    const isHome = p.team === 'home';

    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isHome
      ? (isActive ? '#22c55e' : '#15803d')
      : '#2563eb';
    ctx.fill();

    ctx.strokeStyle = isActive ? '#fbbf24' : 'rgba(255,255,255,0.7)';
    ctx.lineWidth = isActive ? 3 : 1.5;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.label, p.pos.x, p.pos.y);
  }

  // ── Ball ──────────────────────────────────────────────────────────────────

  ctx.beginPath();
  ctx.arc(state.ball.pos.x, state.ball.pos.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── HUD ───────────────────────────────────────────────────────────────────

  const hudMid = FIELD_T / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(
    `Náhoda FC  ${state.score.home}  :  ${state.score.away}  FK Pařezov`,
    CANVAS_W / 2,
    hudMid - 7,
  );

  ctx.font = '11px monospace';
  ctx.fillStyle = state.timeLeft < 15 ? '#f87171' : 'rgba(255,255,255,0.5)';
  ctx.fillText(formatTime(state.timeLeft), CANVAS_W / 2, hudMid + 9);

  // ── Goal overlay ──────────────────────────────────────────────────────────

  if (state.phase === 'goal') {
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 68px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('GÓL!', CANVAS_W / 2, CANVAS_H / 2 - 38);

    ctx.font = '22px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(state.goalMessage, CANVAS_W / 2, CANVAS_H / 2 + 18);

    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(
      `${state.score.home}  :  ${state.score.away}`,
      CANVAS_W / 2,
      CANVAS_H / 2 + 62,
    );
  }

  // ── End game overlay ──────────────────────────────────────────────────────

  if (state.phase === 'ended') {
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('Konec zápasu', CANVAS_W / 2, CANVAS_H / 2 - 65);

    ctx.font = 'bold 64px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(
      `${state.score.home}  :  ${state.score.away}`,
      CANVAS_W / 2,
      CANVAS_H / 2,
    );

    const winner =
      state.score.home > state.score.away ? 'Vítěz: Náhoda FC' :
      state.score.away > state.score.home ? 'Vítěz: FK Pařezov' :
      'Remíza!';

    ctx.font = '22px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText(winner, CANVAS_W / 2, CANVAS_H / 2 + 56);

    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('R — restart', CANVAS_W / 2, CANVAS_H / 2 + 96);
  }
}
