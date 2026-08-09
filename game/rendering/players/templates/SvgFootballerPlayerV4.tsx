import type { PlayerVisualComponentProps } from '../playerVisualTypes';
import { getFootballerVariantV4, type FaceExpressionV4, type HairStyleV4 } from './footballerVariantsV4';

// "svg-footballers-v4" — a more finished sibling of v3: same family (plain
// SVG shapes, no filters, front/back/side poses switched by the same
// "orientation-*" ancestor class — see PlayerVisualContainer.tsx and
// playerVisualAnimations.css, both fully reused with zero new CSS), but
// with 6 genuinely distinct hairstyles (each with its own front/back/side
// silhouette), a less spherical head, visible ears/neck in back+side, and
// clearer arm/leg/boot separation from the torso. Overall on-pitch size is
// controlled purely by PLAYER_VISUAL_CONFIG['svg-footballers-v4']
// .visualRadiusScale (see playerVisualConfig.ts) — this component's local
// coordinates are the same order of magnitude as v1/v2/v3, only the
// proportions changed; the "~10-15% bigger" requirement is a config number,
// never a change to the real hitbox/collision radius.
//
// No label/number is drawn inside this template, same reasoning as v3: the
// whole returned tree sits inside PlayerVisualContainer's mirrored
// "direction" group, so text here would flip backwards for left-facing
// players. Rather than touch that shared mirroring for a cosmetic detail,
// v4 doesn't draw text on the body either.
export default function SvgFootballerPlayerV4({ label, primaryColor, secondaryColor }: PlayerVisualComponentProps) {
  const { hairStyle, faceExpression, skinTone, hairColor } = getFootballerVariantV4(label);

  return (
    <g>
      {/* Shadow — shared across all three poses */}
      <ellipse cx={0} cy={14.6} rx={9.2} ry={2.9} fill="rgba(0,0,0,0.32)" />

      <g className="footballer-body-group">
        {/* ── FRONT ─────────────────────────────────────────────────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-front">
          <Legs skinTone={skinTone} />
          <g className="footballer-hop">
            <Shorts secondaryColor={secondaryColor} />
            <Arms skinTone={skinTone} secondaryColor={secondaryColor} />
            <Neck skinTone={skinTone} />
            <Jersey primaryColor={primaryColor} secondaryColor={secondaryColor} />
            <Head skinTone={skinTone} />
            <FrontHair style={hairStyle} color={hairColor} />
            <circle cx={-3.2} cy={-16.8} r={1.2} fill="#0b1210" />
            <circle cx={3.2} cy={-16.8} r={1.2} fill="#0b1210" />
            <FaceDetail expression={faceExpression} />
          </g>
        </g>

        {/* ── BACK ──────────────────────────────────────────────────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-back">
          <Legs skinTone={skinTone} />
          <g className="footballer-hop">
            <Shorts secondaryColor={secondaryColor} />
            <Arms skinTone={skinTone} secondaryColor={secondaryColor} />
            <Neck skinTone={skinTone} />
            <JerseyBack primaryColor={primaryColor} secondaryColor={secondaryColor} />
            <Head skinTone={skinTone} />
            <Ears skinTone={skinTone} />
            <BackHair style={hairStyle} color={hairColor} />
          </g>
        </g>

        {/* ── SIDE — drawn facing right; mirrored for left by the shared
             direction transform, same as every other template ──────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-side">
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            <rect x={-4.4} y={6.2} width={3.6} height={6.2} rx={1.7} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-4.9} y={11.8} width={4.6} height={2.8} rx={1.3} fill="#0d1512" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            <rect x={1.8} y={6.4} width={3.8} height={6.4} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={1.4} y={12.2} width={5} height={2.9} rx={1.4} fill="#0d1512" />
          </g>
          <g className="footballer-hop">
            <rect x={-5.8} y={0.4} width={11.6} height={6} rx={3} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />
            <rect x={-8} y={-8} width={3} height={5} rx={1.4} fill={secondaryColor} stroke="#0b1210" strokeWidth={0.7} transform="rotate(22)" />
            <rect x={-8.4} y={-4} width={3.2} height={4.6} rx={1.5} fill={skinTone} stroke="#0b1210" strokeWidth={0.7} transform="rotate(22)" />
            <rect x={5} y={-9} width={3} height={5} rx={1.4} fill={secondaryColor} stroke="#0b1210" strokeWidth={0.7} transform="rotate(-18)" />
            <rect x={5.2} y={-5.2} width={3.2} height={4.6} rx={1.5} fill={skinTone} stroke="#0b1210" strokeWidth={0.7} transform="rotate(-18)" />

            <rect x={-1.6} y={-8.2} width={3.2} height={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.6} />
            <rect x={-6.4} y={-9.6} width={13} height={10.6} rx={5} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            <rect x={-6.6} y={-9} width={2.2} height={3} rx={1} fill={secondaryColor} />
            <path d="M -1.4 -9.6 Q 1 -7.2 2.8 -9.4 Z" fill={secondaryColor} />

            <ellipse cx={0.6} cy={-16.4} rx={7} ry={8.6} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            <SideHair style={hairStyle} color={hairColor} />
            <path d="M 6.8 -16 Q 8.6 -15.2 6.9 -14.1 Z" fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <circle cx={4.2} cy={-16.8} r={1.1} fill="#0b1210" />
          </g>
        </g>
      </g>
    </g>
  );
}

// ── Shared body parts (front/back use identical geometry — only the head/
// hair/jersey-face differ) ────────────────────────────────────────────────

function Legs({ skinTone }: { skinTone: string }) {
  return (
    <>
      <g className="footballer-leg footballer-leg-left footballer-kick-leg">
        <rect x={-5.2} y={6.4} width={4.2} height={6.6} rx={2} fill={skinTone} stroke="#0b1210" strokeWidth={0.9} />
        <rect x={-5.8} y={12.4} width={5.4} height={3} rx={1.5} fill="#0d1512" />
      </g>
      <g className="footballer-leg footballer-leg-right">
        <rect x={1} y={6.4} width={4.2} height={6.6} rx={2} fill={skinTone} stroke="#0b1210" strokeWidth={0.9} />
        <rect x={0.4} y={12.4} width={5.4} height={3} rx={1.5} fill="#0d1512" />
      </g>
    </>
  );
}

function Shorts({ secondaryColor }: { secondaryColor: string }) {
  return <rect x={-7} y={0.2} width={14} height={6.2} rx={3} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />;
}

function Arms({ skinTone, secondaryColor }: { skinTone: string; secondaryColor: string }) {
  return (
    <>
      <rect x={-11} y={-8.8} width={3.2} height={3.4} rx={1.4} fill={secondaryColor} stroke="#0b1210" strokeWidth={0.7} />
      <rect x={-11.2} y={-5.6} width={3.4} height={4.8} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
      <rect x={7.8} y={-8.8} width={3.2} height={3.4} rx={1.4} fill={secondaryColor} stroke="#0b1210" strokeWidth={0.7} />
      <rect x={7.8} y={-5.6} width={3.4} height={4.8} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
    </>
  );
}

function Neck({ skinTone }: { skinTone: string }) {
  return <rect x={-2.4} y={-8.4} width={4.8} height={2} fill={skinTone} stroke="#0b1210" strokeWidth={0.6} />;
}

function Jersey({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) {
  return (
    <>
      <rect x={-7.7} y={-6.8} width={15.4} height={9.4} rx={5.2} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
      <rect x={-1.6} y={-6.8} width={3.2} height={9.4} fill={secondaryColor} opacity={0.85} />
      <rect x={-8} y={-6.2} width={2.5} height={3.3} rx={1} fill={secondaryColor} />
      <rect x={5.5} y={-6.2} width={2.5} height={3.3} rx={1} fill={secondaryColor} />
      <path d="M -2.9 -6.8 Q 0 -4.1 2.9 -6.8 Z" fill={secondaryColor} />
    </>
  );
}

function JerseyBack({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) {
  return (
    <>
      <rect x={-7.7} y={-6.8} width={15.4} height={9.4} rx={5.2} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
      <path d="M 0 -6.4 L 0 2.2" stroke={secondaryColor} strokeWidth={1} opacity={0.6} />
      <rect x={-8} y={-6.2} width={2.5} height={3.3} rx={1} fill={secondaryColor} />
      <rect x={5.5} y={-6.2} width={2.5} height={3.3} rx={1} fill={secondaryColor} />
      <path d="M -2.9 -6.8 Q 0 -5.6 2.9 -6.8" stroke={secondaryColor} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </>
  );
}

function Head({ skinTone }: { skinTone: string }) {
  return <ellipse cx={0} cy={-16.6} rx={8.4} ry={8.4} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />;
}

function Ears({ skinTone }: { skinTone: string }) {
  return (
    <>
      <ellipse cx={-8.3} cy={-16.4} rx={1.3} ry={1.9} fill={skinTone} stroke="#0b1210" strokeWidth={0.6} />
      <ellipse cx={8.3} cy={-16.4} rx={1.3} ry={1.9} fill={skinTone} stroke="#0b1210" strokeWidth={0.6} />
    </>
  );
}

// ── Hair — 6 styles, each with a genuinely different front/back/side shape.
// Kept as plain quadratic-curve paths / a couple of triangles / circles —
// no complex masks, no external SVG runtime. ──────────────────────────────

function FrontHair({ style, color }: { style: HairStyleV4; color: string }) {
  switch (style) {
    case 'messy':
      return (
        <g fill={color} stroke="#0b1210" strokeWidth={0.55}>
          <path d="M -8.2 -17.4 Q -8.8 -24.4 0 -24.6 Q 8.8 -24.4 8.2 -17.4 Q 7 -21.6 0 -21.8 Q -7 -21.6 -8.2 -17.4 Z" />
          <path d="M -6.4 -24 L -4.6 -27.4 L -2.8 -24.2 Z" />
          <path d="M -1.6 -24.8 L 0 -28.2 L 1.8 -24.8 Z" />
          <path d="M 3 -24.2 L 5 -27.2 L 6.6 -23.8 Z" />
        </g>
      );
    case 'sidePart':
      return (
        <g stroke="#0b1210" strokeWidth={0.6}>
          <path
            d="M -8.6 -17.2 Q -9.4 -26 -0.6 -26.4 Q 8.6 -26.6 8.4 -17.8 Q 6.2 -22.8 -1.4 -22.6 Q -6.8 -22.4 -8.6 -17.2 Z"
            fill={color}
          />
          <path d="M -2.4 -26.2 L 2 -21.6" stroke="rgba(11,18,16,0.5)" strokeWidth={0.7} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'buzz':
      return (
        <path
          d="M -8.2 -17.8 Q -8.4 -24 0 -24.2 Q 8.4 -24 8.2 -17.8 Q 4.4 -20.4 0 -20.4 Q -4.4 -20.4 -8.2 -17.8 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'longTop':
      return (
        <path
          d="M -8.4 -16.8 Q -10.2 -28.8 0 -29.6 Q 10.2 -28.8 8.4 -16.8 Q 6.8 -23 0 -23.2 Q -6.8 -23 -8.4 -16.8 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'receding':
      return (
        <path
          d="M -8 -17.2 Q -8.4 -22.8 -3.4 -23.8 Q -1.6 -21 0 -21.2 Q 1.6 -21 3.4 -23.8 Q 8.4 -22.8 8 -17.2 Q 6.2 -20.4 0 -20.4 Q -6.2 -20.4 -8 -17.2 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'short':
    default:
      return (
        <path
          d="M -8.6 -16.8 Q -9.4 -25.6 0 -25.9 Q 9.4 -25.6 8.6 -16.8 Q 7.4 -21.8 0 -22 Q -7.4 -21.8 -8.6 -16.8 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
  }
}

// Deliberately covers only the upper part of the head — the whole point of
// the v4 back view is that it must NOT read as one solid dark ball; the
// lower head, ears, and neck stay visible below each style's hair edge.
function BackHair({ style, color }: { style: HairStyleV4; color: string }) {
  switch (style) {
    case 'messy':
      return (
        <g fill={color} stroke="#0b1210" strokeWidth={0.55}>
          <path d="M -8 -15 Q -8.8 -24.4 0 -24.7 Q 8.8 -24.4 8 -15 Q 7.6 -18.6 0 -18.9 Q -7.6 -18.6 -8 -15 Z" />
          <path d="M -5 -18.4 L -3.8 -20.6 L -2.6 -18.2 Z" />
          <path d="M 2.4 -18.3 L 3.6 -20.8 L 4.8 -18.1 Z" />
        </g>
      );
    case 'sidePart':
      return (
        <path
          d="M -8 -16.2 Q -8.8 -25.8 -0.4 -26 Q 8.4 -25.6 8 -15.2 Q 7 -19.6 -0.6 -19.8 Q -6.6 -19.4 -8 -16.2 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'buzz':
      return (
        <path
          d="M -7.4 -19 Q -8 -24.2 0 -24.4 Q 8 -24.2 7.4 -19 Q 5 -21.4 0 -21.5 Q -5 -21.4 -7.4 -19 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'longTop':
      return (
        <path
          d="M -8.6 -11.4 Q -9.8 -27.8 0 -28.4 Q 9.8 -27.8 8.6 -11.4 Q 8.8 -18 0 -18.4 Q -8.8 -18 -8.6 -11.4 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'receding':
      return (
        <path
          d="M -6.6 -15.6 Q -7.2 -23.6 0 -23.9 Q 7.2 -23.6 6.6 -15.6 Q 6 -19 0 -19.2 Q -6 -19 -6.6 -15.6 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'short':
    default:
      return (
        <path
          d="M -8.2 -14.6 Q -9 -25.4 0 -25.7 Q 9 -25.4 8.2 -14.6 Q 8 -19 0 -19.3 Q -8 -19 -8.2 -14.6 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
  }
}

// Profile silhouette, facing right — a forward bump reads as "front of the
// head", a taller/rounder back reads as "back of the head". Each style has
// its own extent so side view is identifiable without needing motion.
function SideHair({ style, color }: { style: HairStyleV4; color: string }) {
  switch (style) {
    case 'messy':
      return (
        <g fill={color} stroke="#0b1210" strokeWidth={0.55}>
          <path d="M -6.6 -16.6 Q -7.4 -24.8 0.6 -25.2 Q 6.8 -24.8 6.6 -18.6 Q 4.6 -20 1.2 -20.4 Q -2 -19.8 -6.6 -16.6 Z" />
          <path d="M -0.6 -25 L 0.6 -28.4 L 2.2 -25.2 Z" />
        </g>
      );
    case 'sidePart':
      return (
        <path
          d="M -7 -16.6 Q -8 -26.4 -0.4 -26.8 Q 6.4 -26.2 5.6 -19.8 Q 3 -21.8 0 -21.2 Q -3 -20.4 -7 -16.6 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'buzz':
      return (
        <path
          d="M -6.2 -18 Q -6.8 -24 0.4 -24.2 Q 6 -23.8 5.8 -19.6 Q 3.6 -20.8 0.8 -21 Q -2 -20.6 -6.2 -18 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'longTop':
      return (
        <path
          d="M -7 -16.4 Q -8.2 -27.6 0.4 -28.4 Q 8.6 -27.6 8.4 -19 Q 5.4 -22 1.6 -23.4 Q -2.4 -22.8 -7 -16.4 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'receding':
      return (
        <path
          d="M -7 -16.6 Q -7.8 -25.4 -0.6 -25.8 Q 4.4 -25.4 3.4 -22.2 Q 1.4 -23.6 -1.4 -23 Q -4.2 -22.2 -7 -16.6 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'short':
    default:
      return (
        <path
          d="M -6.8 -16.4 Q -7.6 -25.6 0.8 -25.8 Q 7.6 -25.4 7.2 -18.2 Q 5 -19.8 1.4 -20.2 Q -2 -19.6 -6.8 -16.4 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
  }
}

// Three simple expressions (nose is a fixed tiny detail; eyebrows/mouth vary).
function FaceDetail({ expression }: { expression: FaceExpressionV4 }) {
  return (
    <g>
      <circle cx={0} cy={-14.8} r={0.6} fill="rgba(11,18,16,0.35)" />
      {expression === 'smile' && (
        <path d="M -2.8 -13 Q 0 -10.8 2.8 -13" stroke="#0b1210" strokeWidth={0.9} fill="none" strokeLinecap="round" />
      )}
      {expression === 'serious' && (
        <>
          <path d="M -4.8 -19 L -2 -18.3" stroke="#0b1210" strokeWidth={0.85} strokeLinecap="round" />
          <path d="M 4.8 -19 L 2 -18.3" stroke="#0b1210" strokeWidth={0.85} strokeLinecap="round" />
          <path d="M -1.8 -13.2 L 1.8 -13.2" stroke="#0b1210" strokeWidth={0.85} strokeLinecap="round" />
        </>
      )}
      {expression === 'neutral' && (
        <path d="M -1.8 -13.2 L 1.8 -13.2" stroke="#0b1210" strokeWidth={0.85} strokeLinecap="round" />
      )}
    </g>
  );
}
