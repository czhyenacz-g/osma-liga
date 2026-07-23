import type { GameState, Ball } from './types';
import {
  CANVAS_W, CANVAS_H,
  FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CX, FIELD_CY,
  GOAL_T, GOAL_B, GOAL_DEPTH,
  BALL_RADIUS,
  CORNER_WARNING_DELAY, CORNER_CLEAR_DELAY,
} from './constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function matchResultLabel(home: number, away: number, homeTeamName: string): string {
  if (home > away) return `Vítěz: ${homeTeamName}`;
  if (away > home) return 'Vítěz: FK Pařezov';
  return 'Remíza';
}

function matchComment(home: number, away: number): string {
  if (home > away) return 'Postupujeme. Nikdo neví proč.';
  if (away > home) return 'Dneska nás zařízl trávník.';
  return 'Bod je bod. Hlavně že se nikdo neptá.';
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
  }
}

// ── Ball ──────────────────────────────────────────────────────────────────────

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball): void {
  const speed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);

  // Motion trail: 3 fading circles behind ball when moving fast
  if (speed > 110) {
    const nx = ball.vel.x / speed;
    const ny = ball.vel.y / speed;
    const step = BALL_RADIUS * 1.25;
    const alphas = [0.08, 0.14, 0.2] as const;
    for (let i = 3; i >= 1; i--) {
      ctx.beginPath();
      ctx.arc(
        ball.pos.x - nx * i * step,
        ball.pos.y - ny * i * step,
        BALL_RADIUS * (1 - i * 0.15),
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(255,255,255,${alphas[i - 1]})`;
      ctx.fill();
    }
  }

  // Drop shadow
  ctx.beginPath();
  ctx.arc(ball.pos.x + 2, ball.pos.y + 3, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fill();

  // Ball fill
  ctx.beginPath();
  ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Outline — dark for contrast on grass
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Small specular highlight
  ctx.beginPath();
  ctx.arc(ball.pos.x - 3, ball.pos.y - 3, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fill();
}

// ── End overlay ───────────────────────────────────────────────────────────────

function drawEndOverlay(
  ctx: CanvasRenderingContext2D,
  score: { home: number; away: number },
  homeTeamName: string,
): void {
  // Full dim backdrop
  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const pw = 500;
  const ph = 296;
  const px = CANVAS_W / 2 - pw / 2;
  const py = CANVAS_H / 2 - ph / 2;
  const cx = CANVAS_W / 2;

  // Panel background
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.fillStyle = 'rgba(3,14,8,0.97)';
  ctx.fill();

  // Gold border
  roundRect(ctx, px, py, pw, ph, 12);
  ctx.strokeStyle = 'rgba(214,169,74,0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // ── Title ──
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#d6a94a';
  ctx.letterSpacing = '0.12em';
  ctx.fillText('KONEC ZÁPASU', cx, py + 34);
  ctx.letterSpacing = '0';

  // Divider
  const sep = (y: number) => {
    ctx.beginPath();
    ctx.moveTo(px + 28, y);
    ctx.lineTo(px + pw - 28, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  sep(py + 54);

  // ── Score row ──
  // Team names flanking the score (aligned to panel edges)
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'left';
  ctx.fillText(homeTeamName, px + 22, py + 124);
  ctx.textAlign = 'right';
  ctx.fillText('FK Pařezov', px + pw - 22, py + 124);

  // Score
  ctx.textAlign = 'center';
  ctx.font = 'bold 60px monospace';
  ctx.fillStyle = 'white';
  ctx.fillText(`${score.home} : ${score.away}`, cx, py + 130);

  sep(py + 170);

  // ── Result ──
  const isDraw = score.home === score.away;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = isDraw ? 'rgba(255,255,255,0.6)' : '#d6a94a';
  ctx.fillText(matchResultLabel(score.home, score.away, homeTeamName), cx, py + 198);

  // Comment
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillText(matchComment(score.home, score.away), cx, py + 222);

  sep(py + 248);

  // ── Controls ──
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillText('R — odveta  ·  Esc — šatna', cx, py + 272);
}

// ── Main render function ──────────────────────────────────────────────────────

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, homeTeamName = 'Náhoda FC'): void {
  // ── Background ────────────────────────────────────────────────────────────

  ctx.fillStyle = 'rgba(3,18,10,0.92)';
  ctx.fillRect(0, 0, CANVAS_W, FIELD_T);

  const stripes = 8;
  const stripeW = (FIELD_R - FIELD_L) / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1c4d10' : '#1f5513';
    ctx.fillRect(FIELD_L + i * stripeW, FIELD_T, stripeW, FIELD_B - FIELD_T);
  }

  ctx.fillStyle = '#163d0c';
  ctx.fillRect(0, FIELD_T, FIELD_L, FIELD_B - FIELD_T);
  ctx.fillRect(FIELD_R, FIELD_T, CANVAS_W - FIELD_R, FIELD_B - FIELD_T);
  ctx.fillRect(0, FIELD_B, CANVAS_W, CANVAS_H - FIELD_B);

  // ── Field lines ───────────────────────────────────────────────────────────

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

  ctx.beginPath();
  ctx.arc(FIELD_CX, FIELD_CY, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fill();

  // ── Goals ─────────────────────────────────────────────────────────────────

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

  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(FIELD_L - GOAL_DEPTH, GOAL_T, GOAL_DEPTH, GOAL_B - GOAL_T);
  ctx.fillRect(FIELD_R, GOAL_T, GOAL_DEPTH, GOAL_B - GOAL_T);

  // ── Players ───────────────────────────────────────────────────────────────
  // Rendered by the shared DOM/SVG overlay (game/rendering/players/) on top
  // of this canvas — see GameCanvas.tsx, which calls PlayerRenderer.update()
  // right after this function each frame. Not drawn here any more.

  // ── Ball ──────────────────────────────────────────────────────────────────

  drawBall(ctx, state.ball);

  // ── HUD ───────────────────────────────────────────────────────────────────

  const hudMid = FIELD_T / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(
    `${homeTeamName}  ${state.score.home}  :  ${state.score.away}  FK Pařezov`,
    CANVAS_W / 2,
    hudMid - 7,
  );

  ctx.font = '11px monospace';
  ctx.fillStyle = state.timeLeft < 15 ? '#f87171' : 'rgba(255,255,255,0.5)';
  ctx.fillText(formatTime(state.timeLeft), CANVAS_W / 2, hudMid + 9);

  // ── Corner countdown warning ──────────────────────────────────────────────

  if (state.phase === 'playing' && state.cornerTimer > CORNER_WARNING_DELAY) {
    const countdown = Math.ceil(CORNER_CLEAR_DELAY - state.cornerTimer);
    const blink = 0.7 + 0.3 * Math.sin(performance.now() / 200);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = `rgba(214,169,74,${blink})`;
    ctx.fillText(
      `Hrozí rohový kop: ${Math.max(1, countdown)}`,
      CANVAS_W / 2,
      FIELD_B + 14,
    );
  }

  // ── Goal overlay ──────────────────────────────────────────────────────────

  if (state.phase === 'goal') {
    ctx.fillStyle = 'rgba(0,0,0,0.56)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 68px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(state.isOwnGoal ? 'VLASTNÍ GÓL!' : 'GÓL!', CANVAS_W / 2, CANVAS_H / 2 - 38);

    ctx.font = '22px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(state.goalMessage, CANVAS_W / 2, CANVAS_H / 2 + 18);

    if (state.concededMessage) {
      ctx.font = 'italic 14px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(state.concededMessage, CANVAS_W / 2, CANVAS_H / 2 + 42);
    }

    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(
      `${state.score.home}  :  ${state.score.away}`,
      CANVAS_W / 2,
      CANVAS_H / 2 + (state.concededMessage ? 72 : 62),
    );
  }

  // ── End overlay ───────────────────────────────────────────────────────────

  if (state.phase === 'ended') {
    drawEndOverlay(ctx, state.score, homeTeamName);
  }
}
