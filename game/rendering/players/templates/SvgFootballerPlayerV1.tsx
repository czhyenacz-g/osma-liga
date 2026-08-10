import type { PlayerVisualComponentProps } from '../playerVisualTypes';
import { getFootballerVariantV1, type HairStyle } from './footballerVariantsV1';

// "svg-footballers-v1" — a small stylized/chibi footballer: big readable
// head, compact jersey body, short arms/legs, simple face. Drawn as a
// handful of plain shapes, not detailed paths, so it stays cheap to render
// and legible at in-game size.
//
// Now draws three poses — front / back / side — same mechanism as v3/v4:
// PlayerVisualContainer writes an `orientation-*` class onto the shared
// ancestor <g> each frame, and playerVisualAnimations.css toggles which
// ".footballer-orientation-view-*" sub-group is visible. The FRONT pose
// below is unchanged from the original single-pose v1 markup — existing
// players moving down/standing still look exactly as before; back/side are
// new. Left/right within "side" is still the existing mirror (facingDirection),
// unchanged.
//
// Back/side reuse ONE shared hair silhouette instead of per-hairstyle art
// (unlike v4, which differentiates all 6 styles across all 3 poses) — v1 is
// the simplest tier of this family, and the front pose (where the 3
// hairstyles actually read) is untouched, so this keeps the "small, cheap,
// simple" spirit intact instead of quietly turning v1 into v4.
//
// Mounted once per player and never re-rendered for per-frame data — exactly
// like PixelCharacterPlayer, the stepping/hop/charge-vibrate/kick animations
// are pure CSS (playerVisualAnimations.css ".footballer-player" rules,
// shared with v2/v3/v4) reacting to boolean classes toggled on the ancestor
// <g> by PlayerVisualContainer every frame.
export default function SvgFootballerPlayerV1({ label, primaryColor, secondaryColor }: PlayerVisualComponentProps) {
  const { hairStyle, skinTone, hairColor } = getFootballerVariantV1(label);

  return (
    <g>
      {/* Shadow — separates the character from the pitch, matches other templates' grounding cue */}
      <ellipse cx={0} cy={15} rx={8} ry={2.4} fill="rgba(0,0,0,0.28)" />

      <g className="footballer-body-group">
        {/* ── FRONT — original v1 pose, unchanged ──────────────────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-front">
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            <rect x={-4.5} y={7} width={3.4} height={7} rx={1.4} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-5} y={12.5} width={4.4} height={2.4} rx={1} fill="#1f2937" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            <rect x={1.1} y={7} width={3.4} height={7} rx={1.4} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={0.6} y={12.5} width={4.4} height={2.4} rx={1} fill="#1f2937" />
          </g>

          <g className="footballer-hop">
            {/* Shorts */}
            <rect x={-6.5} y={1.5} width={13} height={6} rx={2.5} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />

            {/* Arms — short stubs at the sides of the jersey */}
            <rect x={-10.5} y={-8} width={3.2} height={7} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={7.3} y={-8} width={3.2} height={7} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />

            {/* Jersey */}
            <rect x={-7.5} y={-10} width={15} height={12.5} rx={4} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            {/* Sleeve cuffs */}
            <rect x={-7.8} y={-9.5} width={2.6} height={3.4} rx={1} fill={secondaryColor} />
            <rect x={5.2} y={-9.5} width={2.6} height={3.4} rx={1} fill={secondaryColor} />
            {/* Collar */}
            <path d="M -3 -10 Q 0 -7.2 3 -10 Z" fill={secondaryColor} />

            {/* Head */}
            <circle cx={0} cy={-17} r={7.4} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            <FootballerHair style={hairStyle} color={hairColor} />

            {/* Face — simple, readable at small render size regardless of jersey colour */}
            <circle cx={-2.6} cy={-17.5} r={0.95} fill="#0b1210" />
            <circle cx={2.6} cy={-17.5} r={0.95} fill="#0b1210" />
          </g>
        </g>

        {/* ── BACK — moving up the pitch, away from the viewer ───────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-back">
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            <rect x={-4.5} y={7} width={3.4} height={7} rx={1.4} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-5} y={12.5} width={4.4} height={2.4} rx={1} fill="#1f2937" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            <rect x={1.1} y={7} width={3.4} height={7} rx={1.4} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={0.6} y={12.5} width={4.4} height={2.4} rx={1} fill="#1f2937" />
          </g>
          <g className="footballer-hop">
            <rect x={-6.5} y={1.5} width={13} height={6} rx={2.5} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />
            <rect x={-10.5} y={-8} width={3.2} height={7} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={7.3} y={-8} width={3.2} height={7} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            {/* Plain back panel — no collar/face-side detail, just a simple center seam */}
            <rect x={-7.5} y={-10} width={15} height={12.5} rx={4} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            <path d="M 0 -9.6 L 0 3.5" stroke={secondaryColor} strokeWidth={1} opacity={0.6} />
            <rect x={-7.8} y={-9.5} width={2.6} height={3.4} rx={1} fill={secondaryColor} />
            <rect x={5.2} y={-9.5} width={2.6} height={3.4} rx={1} fill={secondaryColor} />

            <circle cx={0} cy={-17} r={7.4} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            {/* Back hair — covers only the upper head, leaving the lower head/neck visible */}
            <path
              d="M -7.2 -14.4 Q -7.8 -24.6 0 -24.9 Q 7.8 -24.6 7.2 -14.4 Q 7 -18.8 0 -19.1 Q -7 -18.8 -7.2 -14.4 Z"
              fill={hairColor}
              stroke="#0b1210"
              strokeWidth={0.6}
            />
          </g>
        </g>

        {/* ── SIDE — drawn facing right; mirrored for left by the shared
             direction transform, same as every other template ──────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-side">
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            <rect x={-4.2} y={7} width={3.2} height={6.8} rx={1.4} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-4.6} y={12.5} width={4} height={2.4} rx={1} fill="#1f2937" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            <rect x={1.6} y={7.2} width={3.4} height={7} rx={1.5} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={1.2} y={12.9} width={4.4} height={2.6} rx={1.2} fill="#1f2937" />
          </g>
          <g className="footballer-hop">
            <rect x={-5.6} y={1.5} width={11.2} height={6} rx={2.4} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />
            <rect x={-7.8} y={-7.6} width={3} height={6.4} rx={1.5} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} transform="rotate(20)" />
            <rect x={4.8} y={-8.2} width={3} height={6.4} rx={1.5} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} transform="rotate(-16)" />
            <rect x={-6.4} y={-10} width={12.8} height={12.5} rx={4} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            <rect x={-6.6} y={-9.5} width={2.4} height={3.4} rx={1} fill={secondaryColor} />
            <path d="M -1.6 -10 Q 1 -7.4 2.8 -9.8 Z" fill={secondaryColor} />

            <ellipse cx={0.5} cy={-17} rx={6.4} ry={7.4} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            <path
              d="M -6 -15.6 Q -6.8 -24 0.4 -24.4 Q 6.4 -24 6.2 -18.4 Q 4.4 -19.8 1.2 -20.2 Q -1.8 -19.6 -6 -15.6 Z"
              fill={hairColor}
              stroke="#0b1210"
              strokeWidth={0.6}
            />
            <path d="M 6 -16.2 Q 7.4 -15.6 6.1 -14.6 Z" fill={skinTone} stroke="#0b1210" strokeWidth={0.7} />
            <circle cx={3.6} cy={-17.4} r={0.9} fill="#0b1210" />
          </g>
        </g>
      </g>

      <text
        x={0}
        y={-27}
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

// Three cheap, purely-shape hair variants — enough to break up an
// otherwise-identical team without turning this into a customization system.
// Only used by the FRONT pose — see file header for why back/side share one
// silhouette instead of being differentiated per style like v4.
function FootballerHair({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case 'curly':
      return (
        <g fill={color} stroke="#0b1210" strokeWidth={0.6}>
          <circle cx={-4.6} cy={-22.6} r={2.3} />
          <circle cx={-1.4} cy={-24.2} r={2.5} />
          <circle cx={2} cy={-24.3} r={2.5} />
          <circle cx={4.8} cy={-22.6} r={2.3} />
        </g>
      );
    case 'buzz':
      return <path d="M -7.2 -18 Q -7.6 -24.4 0 -24.6 Q 7.6 -24.4 7.2 -18 Q 3 -21.6 0 -21.6 Q -3 -21.6 -7.2 -18 Z" fill={color} stroke="#0b1210" strokeWidth={0.6} />;
    case 'short':
    default:
      return (
        <path
          d="M -7.4 -17.2 Q -8.2 -25.6 0 -25.8 Q 8.2 -25.6 7.4 -17.2 Q 6.6 -22.6 0 -22.8 Q -6.6 -22.6 -7.4 -17.2 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
  }
}
