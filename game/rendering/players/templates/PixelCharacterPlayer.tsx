import type { PlayerVisualComponentProps } from '../playerVisualTypes';

// Default template — a simple, near-pixelart humanoid. Drawn facing right
// in local coordinates centered on the player's position (0,0); the
// container mirrors this whole group for left-facing movement.
//
// Now draws three poses — front / back / side — same mechanism as the
// svg-footballers family: PlayerVisualContainer writes an `orientation-*`
// class onto the shared ancestor <g> each frame, and
// playerVisualAnimations.css toggles which ".pixel-orientation-view-*"
// sub-group is visible. The FRONT pose below is byte-for-byte the original
// single-pose markup — players moving down/standing still look exactly as
// before; back/side are new. Left/right within "side" is still the existing
// mirror (facingDirection), unchanged.
//
// Deliberately kept as minimal/blocky as the front pose already was — no
// per-player hair/skin variety here (pixel-characters never had that), just
// the same handful of rects repositioned for each pose, so this stays the
// cheapest template in the family, exactly as intended.
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
        {/* ── FRONT — original pose, unchanged ─────────────────────────────── */}
        <g className="pixel-orientation-view pixel-orientation-view-front">
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

        {/* ── BACK — moving up the pitch, away from the viewer ───────────────── */}
        <g className="pixel-orientation-view pixel-orientation-view-back">
          <g className="pixel-leg pixel-leg-left pixel-kick-leg">
            <rect x={-7} y={4} width={5} height={11} fill="#1f2937" stroke="#0b1210" strokeWidth={1} />
          </g>
          <g className="pixel-leg pixel-leg-right">
            <rect x={2} y={4} width={5} height={11} fill="#1f2937" stroke="#0b1210" strokeWidth={1} />
          </g>

          <g className="pixel-hop">
            {/* Plain jersey back — no face-side stripe placement, just a thin center seam */}
            <rect x={-9} y={-11} width={18} height={16} rx={2} fill={primaryColor} stroke="#0b1210" strokeWidth={1.5} />
            <rect x={-1} y={-11} width={2} height={16} fill={secondaryColor} opacity={0.7} />

            {/* Head — no eyes; a flat dark strip near the top stands in for hair seen from behind */}
            <rect x={-7} y={-23} width={14} height={13} rx={2} fill="#f2c9a0" stroke="#0b1210" strokeWidth={1.5} />
            <rect x={-7} y={-23} width={14} height={4} rx={2} fill="#2b1a10" />
          </g>
        </g>

        {/* ── SIDE — drawn facing right; mirrored for left by the shared
             direction transform, same as every other template ──────────────── */}
        <g className="pixel-orientation-view pixel-orientation-view-side">
          <g className="pixel-leg pixel-leg-left pixel-kick-leg">
            {/* trailing leg */}
            <rect x={-6} y={4} width={4} height={11} fill="#1f2937" stroke="#0b1210" strokeWidth={1} />
          </g>
          <g className="pixel-leg pixel-leg-right">
            {/* leading leg */}
            <rect x={3} y={4} width={5} height={11} fill="#1f2937" stroke="#0b1210" strokeWidth={1} />
          </g>

          <g className="pixel-hop">
            {/* Narrower jersey — profile silhouette */}
            <rect x={-7} y={-11} width={14} height={16} rx={2} fill={primaryColor} stroke="#0b1210" strokeWidth={1.5} />
            <rect x={-7} y={-1} width={14} height={4} fill={secondaryColor} />

            {/* Narrower head, one eye near the leading edge */}
            <rect x={-5} y={-23} width={10} height={13} rx={2} fill="#f2c9a0" stroke="#0b1210" strokeWidth={1.5} />
            <rect x={2} y={-18} width={2} height={2} fill="#0b1210" />
          </g>
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
