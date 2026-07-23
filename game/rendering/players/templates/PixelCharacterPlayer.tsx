import type { PlayerVisualComponentProps } from '../playerVisualTypes';

// New default template — a simple, near-pixelart humanoid. Drawn facing
// right in local coordinates centered on the player's position (0,0); the
// container mirrors this whole group for left-facing movement.
//
// Mounted once per player and never re-rendered for per-frame data — the
// stepping/hop/charge-vibrate/kick animations are pure CSS
// (playerVisualAnimations.css) reacting to boolean classes toggled on the
// ancestor <g> by PlayerVisualContainer every frame. This component itself
// never reads position, velocity, or charge progress.
export default function PixelCharacterPlayer({ label, primaryColor, secondaryColor }: PlayerVisualComponentProps) {
  return (
    <g shapeRendering="crispEdges">
      <g className="pixel-body-group">
        {/* Legs — separate wrappers so CSS can animate them out of phase */}
        <g className="pixel-leg pixel-leg-left pixel-kick-leg">
          <rect x={-7} y={4} width={5} height={11} fill="#1f2937" stroke="#0b1210" strokeWidth={1} />
        </g>
        <g className="pixel-leg pixel-leg-right">
          <rect x={2} y={4} width={5} height={11} fill="#1f2937" stroke="#0b1210" strokeWidth={1} />
        </g>

        <g className="pixel-hop">
          {/* Jersey / body — primary team colour, secondary trim stripe */}
          <rect x={-9} y={-11} width={18} height={16} rx={2} fill={primaryColor} stroke="#0b1210" strokeWidth={1.5} />
          <rect x={-9} y={-1} width={18} height={4} fill={secondaryColor} />

          {/* Head */}
          <rect x={-7} y={-23} width={14} height={13} rx={2} fill="#f2c9a0" stroke="#0b1210" strokeWidth={1.5} />
          {/* Simple face — two eye dots, readable at in-game size regardless of jersey colour */}
          <rect x={-4} y={-18} width={2} height={2} fill="#0b1210" />
          <rect x={2} y={-18} width={2} height={2} fill="#0b1210" />
        </g>
      </g>

      <text
        x={0}
        y={-6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={7}
        fontFamily="monospace"
        fontWeight="bold"
        fill="white"
        stroke="#0b1210"
        strokeWidth={0.6}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  );
}
