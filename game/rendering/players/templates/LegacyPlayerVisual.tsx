import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { PlayerRenderState, PlayerVisualComponentProps } from '../playerVisualTypes';

export interface LegacyPlayerVisualHandle {
  update(state: PlayerRenderState): void;
}

const CHARGE_RING_MAX_GROWTH = 14;
const ARROW_SPEED_THRESHOLD = 20;

// Reproduces today's canvas-drawn player look (game/renderGame.ts
// drawActivePlayerIndicator + the players loop, and the equivalent in
// components/online/OnlineGameCanvas.tsx) as closely as possible: a plain
// filled circle, brighter shade + gold outline + pulsing ring + velocity
// arrow when active, flat colour otherwise. Deliberately NOT using the
// shared ActivePlayerRing/animation-wrapper charge-scale that
// pixel-characters/minimal-circles use — legacy's own charge feedback is
// the RING growing, not the body, so it manages all of this itself via an
// imperative per-frame update() (see PlayerVisualContainer.tsx, which calls
// this directly and skips its own shared UI/charge-scale wrappers for the
// 'legacy' template).
const LegacyPlayerVisual = forwardRef<LegacyPlayerVisualHandle, PlayerVisualComponentProps>(
  function LegacyPlayerVisual({ team, label, hitboxRadiusPx }, ref) {
    const groupRef = useRef<SVGGElement>(null);
    const bodyRef = useRef<SVGCircleElement>(null);
    const ringRef = useRef<SVGCircleElement>(null);
    const arrowRef = useRef<SVGPathElement>(null);

    useImperativeHandle(ref, () => ({
      update(state: PlayerRenderState) {
        const body = bodyRef.current;
        const ring = ringRef.current;
        const arrow = arrowRef.current;
        if (!body || !ring || !arrow) return;

        // Matches OnlineGameCanvas.tsx's existing globalAlpha dimming for a
        // temporarily-removed (random substitution) player.
        groupRef.current?.setAttribute('opacity', state.isRemoved ? '0.45' : '1');

        const isHome = team === 'home';
        body.setAttribute(
          'fill',
          isHome ? (state.isActive ? '#22c55e' : '#15803d') : (state.isActive ? '#3b82f6' : '#1d4ed8'),
        );
        body.setAttribute('stroke', state.isActive ? '#fbbf24' : 'rgba(255,255,255,0.65)');
        body.setAttribute('stroke-width', state.isActive ? '2.5' : '1.5');

        // The ring/arrow only ever indicate the LOCAL player's own active
        // player (matches today's online canvas: `isMyTeam && rp.active`).
        // In single-player isMine is always true for the home team (the only
        // team isActive can ever be true for there), so this is a no-op
        // change for that mode.
        if (!state.isActive || !state.isMine) {
          ring.setAttribute('opacity', '0');
          arrow.setAttribute('opacity', '0');
          return;
        }

        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
        const ringRadius = hitboxRadiusPx + 5 + pulse * 3 + state.chargeProgress * CHARGE_RING_MAX_GROWTH;
        ring.setAttribute('r', String(ringRadius));
        ring.setAttribute('opacity', '1');
        ring.setAttribute('stroke', `rgba(251,191,36,${0.5 + pulse * 0.45})`);

        const speed = Math.hypot(state.vx, state.vy);
        if (speed > ARROW_SPEED_THRESHOLD) {
          const nx = state.vx / speed;
          const ny = state.vy / speed;
          const dist = hitboxRadiusPx + 10;
          const tipX = nx * dist;
          const tipY = ny * dist;
          const baseX = nx * (dist - 8);
          const baseY = ny * (dist - 8);
          const px = -ny;
          const py = nx;
          arrow.setAttribute(
            'd',
            `M ${tipX} ${tipY} L ${baseX + px * 5} ${baseY + py * 5} L ${baseX - px * 5} ${baseY - py * 5} Z`,
          );
          arrow.setAttribute('fill', `rgba(251,191,36,${0.65 + pulse * 0.35})`);
          arrow.setAttribute('opacity', '1');
        } else {
          arrow.setAttribute('opacity', '0');
        }
      },
    }));

    return (
      <g ref={groupRef}>
        <circle ref={ringRef} cx={0} cy={0} r={hitboxRadiusPx + 5} fill="none" strokeWidth={2.5} opacity={0} />
        <path ref={arrowRef} opacity={0} />
        <circle ref={bodyRef} cx={0} cy={0} r={hitboxRadiusPx} fill="#15803d" stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fontFamily="monospace"
          fontWeight="bold"
          fill="white"
        >
          {label}
        </text>
      </g>
    );
  },
);

export default LegacyPlayerVisual;
