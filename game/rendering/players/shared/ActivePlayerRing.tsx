import { forwardRef } from 'react';
import { ACTIVE_RING_COLOR } from '../playerVisualConfig';

// Gold, flattened ellipse drawn under the active player — a ground-mark
// style indicator (like a shadow/decal on the pitch), not a ring around the
// body. Used by pixel-characters and minimal-circles. Legacy keeps its own,
// different, pulsing ring-around-the-body look unchanged (see
// LegacyPlayerVisual.tsx) — this component is NOT used there.
//
// Sizing (rx/ry) is set imperatively per frame by the caller via the ref
// (chargeProgress grows it slightly) — never re-rendered through React
// state, same reasoning as the rest of the animation wrapper.
// `emphasized` (svg-footballers-v5): a stronger, near-opaque outline that
// stays readable on the grass and over the centre-circle line; `cy` moves it
// down to the boots. Static — no blinking.
const ActivePlayerRing = forwardRef<SVGEllipseElement, { rx: number; ry: number; cy?: number; emphasized?: boolean }>(
  function ActivePlayerRing({ rx, ry, cy = 0, emphasized = false }, ref) {
    return (
      <ellipse
        ref={ref}
        cx={0}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={ACTIVE_RING_COLOR}
        fillOpacity={emphasized ? 0.2 : 0.28}
        stroke={ACTIVE_RING_COLOR}
        strokeOpacity={emphasized ? 0.95 : 0.75}
        strokeWidth={emphasized ? 2.6 : 1.5}
      />
    );
  },
);

export default ActivePlayerRing;
