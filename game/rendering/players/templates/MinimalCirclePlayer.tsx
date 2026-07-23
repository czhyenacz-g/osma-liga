import type { PlayerVisualComponentProps } from '../playerVisualTypes';

// New minimalist template — a plain filled circle with a contrast outline.
// The active-player indicator is the shared gold ellipse UNDER the player
// (PlayerVisualContainer's UI wrapper + ActivePlayerRing), not anything
// drawn here — this component is intentionally as simple as possible.
export default function MinimalCirclePlayer({ label, primaryColor, hitboxRadiusPx }: PlayerVisualComponentProps) {
  return (
    <g className="minimal-circle-player">
      <circle cx={0} cy={0} r={hitboxRadiusPx} fill={primaryColor} stroke="rgba(0,0,0,0.45)" strokeWidth={1.5} />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9}
        fontFamily="monospace"
        fontWeight="bold"
        fill="white"
      >
        {label}
      </text>
    </g>
  );
}
