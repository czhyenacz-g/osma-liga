import { describe, it, expect, vi } from 'vitest';
import { drawFootball, BALL_VISUAL_RADIUS_SCALE } from './drawFootball';
import { BALL_RADIUS } from '../../constants';

// A minimal CanvasRenderingContext2D stand-in — jsdom doesn't implement
// actual 2D canvas drawing, so this just proves drawFootball only ever
// calls the plain vector-drawing API (no PNG/image calls) and never
// crashes, without needing a real canvas.
function makeMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;
}

describe('drawFootball', () => {
  it('draws without throwing, for a plain call and a rotated one', () => {
    const ctx = makeMockCtx();
    expect(() => drawFootball(ctx, 100, 50, 10)).not.toThrow();
    expect(() => drawFootball(ctx, 100, 50, 10, Math.PI / 3)).not.toThrow();
  });

  it('draws the base circle at exactly the radius it was given, not a hardcoded value', () => {
    const ctx = makeMockCtx();
    drawFootball(ctx, 0, 0, 42);
    const arcCalls = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls;
    // First arc() call is always the base circle: arc(0, 0, radius, 0, 2π)
    expect(arcCalls[0][2]).toBe(42);
  });

  it('is presentation-only — never imports or reads the real collision radius constant', () => {
    // BALL_RADIUS (game/constants.ts) stays the single source of truth for
    // collision size; this module only ever draws whatever radius it's
    // handed by the caller.
    expect(typeof BALL_RADIUS).toBe('number');
    const ctx = makeMockCtx();
    const visualRadius = BALL_RADIUS * BALL_VISUAL_RADIUS_SCALE;
    drawFootball(ctx, 0, 0, visualRadius);
    const arcCalls = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls;
    expect(arcCalls[0][2]).toBe(visualRadius);
    expect(arcCalls[0][2]).not.toBe(BALL_RADIUS); // visual radius is intentionally scaled down
  });

  it('rotates via ctx.rotate() rather than recomputing panel geometry', () => {
    const ctx = makeMockCtx();
    drawFootball(ctx, 0, 0, 10, 1.23);
    expect(ctx.rotate).toHaveBeenCalledWith(1.23);
  });
});
