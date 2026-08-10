import type { PlayerVisualComponentProps } from '../playerVisualTypes';
import { getFootballerVariantV2, type FaceVariantV2, type HairStyleV2 } from './footballerVariantsV2';

// "svg-footballers-v2" — a more chibi/cute sibling of SvgFootballerPlayerV1:
// bigger head-to-body ratio, rounder shapes, a friendlier face (variant
// eyebrows/mouth), and a slightly nicer jersey (collar + cuffs + a small
// shoulder panel). Still plain SVG shapes (no filters/gradients), still
// mounted once per player and never re-rendered for per-frame data —
// identical rendering contract to every other template (see
// PlayerVisualContainer, which owns position/direction/animation).
//
// Now draws three poses — front / back / side — same mechanism as v3/v4:
// PlayerVisualContainer writes an `orientation-*` class onto the shared
// ancestor <g> each frame, and playerVisualAnimations.css toggles which
// ".footballer-orientation-view-*" sub-group is visible. The FRONT pose
// below is unchanged from the original single-pose v2 markup; back/side are
// new. Left/right within "side" is still the existing mirror
// (facingDirection), unchanged.
//
// Back/side reuse ONE shared hair silhouette instead of per-hairstyle art
// (unlike v4, which differentiates all of its styles across all 3 poses) —
// v2 sits below v4 in this family's complexity tier, and the front pose
// (where the 4 hairstyles/face variants actually read) is untouched.
//
// Reuses the exact same "footballer-*" class names as v1 (footballer-body-
// group / footballer-hop / footballer-leg(-left|-right) / footballer-kick-
// leg / footballer-orientation-view(-front|-back|-side)) so the shared step/
// hop/charge-vibrate/kick/orientation-switch CSS in
// playerVisualAnimations.css works without any duplication.
export default function SvgFootballerPlayerV2({ label, primaryColor, secondaryColor }: PlayerVisualComponentProps) {
  const { hairStyle, faceVariant, skinTone, hairColor } = getFootballerVariantV2(label);

  return (
    <g>
      {/* Shadow — separates the character from the pitch */}
      <ellipse cx={0} cy={14.5} rx={8.4} ry={2.6} fill="rgba(0,0,0,0.3)" />

      <g className="footballer-body-group">
        {/* ── FRONT — original v2 pose, unchanged ──────────────────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-front">
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            <rect x={-4.6} y={6.5} width={3.6} height={6} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-5.1} y={11.6} width={4.6} height={2.6} rx={1.3} fill="#111827" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            <rect x={1} y={6.5} width={3.6} height={6} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={0.5} y={11.6} width={4.6} height={2.6} rx={1.3} fill="#111827" />
          </g>

          <g className="footballer-hop">
            <rect x={-6.2} y={1} width={12.4} height={6} rx={3} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />

            <rect x={-9.8} y={-7.5} width={3.4} height={6.6} rx={1.7} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={6.4} y={-7.5} width={3.4} height={6.6} rx={1.7} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />

            <rect x={-6.8} y={-9.2} width={13.6} height={11} rx={5} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            <path d="M -6.8 -9.2 L -1 -9.2 L -4.6 0.5 L -6.8 0.5 Z" fill={secondaryColor} opacity={0.85} />
            <rect x={-7.1} y={-8.6} width={2.4} height={3.2} rx={1} fill={secondaryColor} />
            <rect x={4.7} y={-8.6} width={2.4} height={3.2} rx={1} fill={secondaryColor} />
            <path d="M -2.6 -9.2 Q 0 -6.6 2.6 -9.2 Z" fill={secondaryColor} />

            <circle cx={0} cy={-16.5} r={8.6} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            <FootballerHairV2 style={hairStyle} color={hairColor} />
            <FootballerFaceV2 variant={faceVariant} />
          </g>
        </g>

        {/* ── BACK — moving up the pitch, away from the viewer ───────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-back">
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            <rect x={-4.6} y={6.5} width={3.6} height={6} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-5.1} y={11.6} width={4.6} height={2.6} rx={1.3} fill="#111827" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            <rect x={1} y={6.5} width={3.6} height={6} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={0.5} y={11.6} width={4.6} height={2.6} rx={1.3} fill="#111827" />
          </g>
          <g className="footballer-hop">
            <rect x={-6.2} y={1} width={12.4} height={6} rx={3} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />
            <rect x={-9.8} y={-7.5} width={3.4} height={6.6} rx={1.7} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={6.4} y={-7.5} width={3.4} height={6.6} rx={1.7} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            {/* Plain back panel — no shoulder-panel/collar face-side detail, just a simple center seam */}
            <rect x={-6.8} y={-9.2} width={13.6} height={11} rx={5} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            <path d="M 0 -8.8 L 0 1.2" stroke={secondaryColor} strokeWidth={1} opacity={0.6} />
            <rect x={-7.1} y={-8.6} width={2.4} height={3.2} rx={1} fill={secondaryColor} />
            <rect x={4.7} y={-8.6} width={2.4} height={3.2} rx={1} fill={secondaryColor} />

            <circle cx={0} cy={-16.5} r={8.6} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            {/* Back hair — covers only the upper head, leaving the lower head/neck visible */}
            <path
              d="M -8.4 -13.8 Q -9 -25 0 -25.3 Q 9 -25 8.4 -13.8 Q 8.2 -18.6 0 -18.9 Q -8.2 -18.6 -8.4 -13.8 Z"
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
            <rect x={-4.2} y={6.5} width={3.4} height={5.8} rx={1.7} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-4.6} y={11.6} width={4.2} height={2.6} rx={1.2} fill="#111827" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            <rect x={1.8} y={6.7} width={3.6} height={6.2} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={1.4} y={12.2} width={4.6} height={2.8} rx={1.3} fill="#111827" />
          </g>
          <g className="footballer-hop">
            <rect x={-5.4} y={1} width={10.8} height={6} rx={2.8} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />
            <rect x={-7.4} y={-7.1} width={3.2} height={6.2} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} transform="rotate(20)" />
            <rect x={5} y={-7.7} width={3.2} height={6.2} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} transform="rotate(-16)" />
            <rect x={-5.9} y={-9.2} width={11.8} height={10.8} rx={5} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            <rect x={-6.1} y={-8.6} width={2.2} height={3} rx={1} fill={secondaryColor} />
            <path d="M -1.4 -9.2 Q 1 -6.8 2.6 -8.8 Z" fill={secondaryColor} />

            <ellipse cx={0.6} cy={-16.5} rx={7.4} ry={8.4} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            <path
              d="M -6.6 -15.2 Q -7.4 -24.4 0.6 -24.8 Q 7 -24.4 6.8 -18.4 Q 4.8 -19.8 1.4 -20.2 Q -2 -19.6 -6.6 -15.2 Z"
              fill={hairColor}
              stroke="#0b1210"
              strokeWidth={0.6}
            />
            <path d="M 6.8 -16.2 Q 8.4 -15.4 6.9 -14.2 Z" fill={skinTone} stroke="#0b1210" strokeWidth={0.7} />
            <circle cx={4} cy={-16.9} r={1} fill="#0b1210" />
          </g>
        </g>
      </g>

      <text
        x={0}
        y={-27.5}
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

// Four cheap, purely-shape hair variants — one more than v1, still just
// plain paths/circles, no extra render cost worth worrying about. Only used
// by the FRONT pose — see file header for why back/side share one
// silhouette instead of being differentiated per style like v4.
function FootballerHairV2({ style, color }: { style: HairStyleV2; color: string }) {
  switch (style) {
    case 'curly':
      return (
        <g fill={color} stroke="#0b1210" strokeWidth={0.6}>
          <circle cx={-5.3} cy={-21.6} r={2.6} />
          <circle cx={-1.7} cy={-23.6} r={2.9} />
          <circle cx={2.1} cy={-23.7} r={2.9} />
          <circle cx={5.5} cy={-21.6} r={2.6} />
        </g>
      );
    case 'buzz':
      return (
        <path
          d="M -8.2 -16.8 Q -8.6 -24.6 0 -24.9 Q 8.6 -24.6 8.2 -16.8 Q 3.4 -20.8 0 -20.8 Q -3.4 -20.8 -8.2 -16.8 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'quiff':
      return (
        <g fill={color} stroke="#0b1210" strokeWidth={0.6}>
          <path d="M -8.4 -16.4 Q -9 -24.8 -1 -25.6 Q 5 -26.4 8 -20.6 Q 3 -23 -2 -22 Q -6 -21 -8.4 -16.4 Z" />
          <path d="M -1.5 -25.4 Q 2 -28.4 6.4 -24.2 Q 3.4 -25.2 -0.5 -23.4 Z" />
        </g>
      );
    case 'short':
    default:
      return (
        <path
          d="M -8.4 -16 Q -9.2 -25.8 0 -26 Q 9.2 -25.8 8.4 -16 Q 7.4 -22 0 -22.2 Q -7.4 -22 -8.4 -16 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
  }
}

// Three simple face variants (eyes always readable; eyebrows/mouth vary) —
// enough for a friendlier, less uniform squad without a real expression system.
function FootballerFaceV2({ variant }: { variant: FaceVariantV2 }) {
  return (
    <g>
      {/* Eyes — always present, always the most readable part at small size */}
      <circle cx={-3} cy={-17} r={1.05} fill="#0b1210" />
      <circle cx={3} cy={-17} r={1.05} fill="#0b1210" />

      {variant === 'happy' && (
        <path d="M -2.4 -13 Q 0 -11.2 2.4 -13" stroke="#0b1210" strokeWidth={0.9} fill="none" strokeLinecap="round" />
      )}
      {variant === 'focused' && (
        <>
          <path d="M -4.4 -19.4 L -1.8 -18.8" stroke="#0b1210" strokeWidth={0.8} strokeLinecap="round" />
          <path d="M 4.4 -19.4 L 1.8 -18.8" stroke="#0b1210" strokeWidth={0.8} strokeLinecap="round" />
        </>
      )}
      {variant === 'neutral' && (
        <path d="M -1.6 -13.2 L 1.6 -13.2" stroke="#0b1210" strokeWidth={0.8} strokeLinecap="round" />
      )}
    </g>
  );
}
