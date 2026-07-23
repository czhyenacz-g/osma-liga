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
const ActivePlayerRing = forwardRef<SVGEllipseElement, { rx: number; ry: number }>(
  function ActivePlayerRing({ rx, ry }, ref) {
    return (
      <ellipse
        ref={ref}
        cx={0}
        cy={0}
        rx={rx}
        ry={ry}
        fill={ACTIVE_RING_COLOR}
        fillOpacity={0.28}
        stroke={ACTIVE_RING_COLOR}
        strokeOpacity={0.75}
        strokeWidth={1.5}
      />
    );
  },
);

export default ActivePlayerRing;
