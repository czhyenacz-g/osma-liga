// Shared presentation-only football-ball drawing routine — used by both the
// bot engine's canvas (game/renderGame.ts) and the online multiplayer canvas
// (components/online/OnlineGameCanvas.tsx), which previously each drew their
// own plain white circle independently. Vector shapes only (no PNG/sprite
// asset, no gradients/filters) — a classic ⚽ silhouette: base circle,
// centered pentagon, 5 seams running out to small corner patches near the
// rim. Cheap: a handful of path/arc calls per frame, same order of cost as
// the plain circle it replaces.
//
// This module only ever draws — it never reads or defines the ball's real
// collision radius (game/constants.ts BALL_RADIUS is the single source of
// truth for that, completely untouched by anything here). Callers may pass
// a slightly smaller `radius` than BALL_RADIUS for a tighter, more legible
// icon (see BALL_VISUAL_RADIUS_SCALE) — that only ever changes how big the
// ball is drawn, never how big it collides.
export const BALL_VISUAL_RADIUS_SCALE = 0.92;

const PANEL_COLOR = '#16201a';

export function drawFootball(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Base
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f4f4f0';
  ctx.fill();
  ctx.lineWidth = Math.max(1, radius * 0.14);
  ctx.strokeStyle = 'rgba(15,23,18,0.55)';
  ctx.stroke();

  // Central pentagon
  const pentRadius = radius * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const px = Math.cos(angle) * pentRadius;
    const py = Math.sin(angle) * pentRadius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = PANEL_COLOR;
  ctx.fill();

  // 5 seams + small corner patches, radiating from the pentagon to the rim —
  // reads instantly as "football" at any size without a full panel mesh.
  ctx.strokeStyle = PANEL_COLOR;
  ctx.lineWidth = Math.max(0.8, radius * 0.1);
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const startX = Math.cos(angle) * pentRadius;
    const startY = Math.sin(angle) * pentRadius;
    const endX = Math.cos(angle) * radius * 0.92;
    const endY = Math.sin(angle) * radius * 0.92;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(endX, endY, radius * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = PANEL_COLOR;
    ctx.fill();
  }

  // Small specular highlight — subtle, no filter/blur.
  ctx.beginPath();
  ctx.arc(-radius * 0.32, -radius * 0.32, radius * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();

  ctx.restore();
}
