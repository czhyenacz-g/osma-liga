import type { Vec2 } from '../../types';

// Aim arrow for the aimed charged shot (game/shotAim.ts): a thin yellow
// line with a small head, starting just outside the ball along the shot
// direction. Presentation only, drawn on the pitch canvas.
const START = 16;
const LENGTH = 48;
const HEAD = 8;

export function drawShotAimArrow(ctx: CanvasRenderingContext2D, ball: Vec2, dir: Vec2): void {
  const sx = ball.x + dir.x * START, sy = ball.y + dir.y * START;
  const ex = ball.x + dir.x * (START + LENGTH), ey = ball.y + dir.y * (START + LENGTH);
  const a = Math.atan2(dir.y, dir.x);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,224,102,0.95)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.moveTo(ex - Math.cos(a - 0.45) * HEAD, ey - Math.sin(a - 0.45) * HEAD);
  ctx.lineTo(ex, ey);
  ctx.lineTo(ex - Math.cos(a + 0.45) * HEAD, ey - Math.sin(a + 0.45) * HEAD);
  ctx.stroke();
  ctx.restore();
}
