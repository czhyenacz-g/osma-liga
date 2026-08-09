import type { PlayerVisualComponentProps } from '../playerVisualTypes';
import { getFootballerVariantV3, type FaceExpressionV3, type HairStyleV3 } from './footballerVariantsV3';

// "svg-footballers-v3" — the directional sibling of v1/v2: same family (big
// head, compact rounded body, plain SVG shapes, no filters), but now draws
// three poses — front / back / side — and PlayerVisualContainer switches
// between them each frame by toggling an `orientation-*` class on the same
// ancestor <g> it already uses for is-moving/is-charging/etc (see
// playerVisualAnimations.css ".footballer-orientation-view" rules). No
// re-render, no new imperative plumbing beyond that one extra class.
//
// All three views reuse the same "footballer-*" leg/hop/body-group class
// names as v1/v2, so the shared step/hop/charge-vibrate/kick CSS keeps
// working without any per-view duplication of animation rules. The side
// view's legs are drawn already offset into a short stride (front leg
// forward, back leg behind) — since that pose only ever shows up while the
// player is actually moving sideways, it reads as motion for free, with no
// extra animation-phase state.
//
// No label/number is drawn inside this template: the whole returned tree
// sits inside PlayerVisualContainer's mirrored "direction" group, so text
// here would flip backwards for left-facing players — the existing
// templates already have this quirk. Rather than touch that shared
// mirroring for a cosmetic detail, v3 simply doesn't draw text on the body.
export default function SvgFootballerPlayerV3({ label, primaryColor, secondaryColor }: PlayerVisualComponentProps) {
  const { hairStyle, faceExpression, skinTone, hairColor } = getFootballerVariantV3(label);

  return (
    <g>
      {/* Shadow — shared across all three poses, doesn't change with orientation */}
      <ellipse cx={0} cy={14} rx={8.6} ry={2.7} fill="rgba(0,0,0,0.32)" />

      <g className="footballer-body-group">
        {/* ── FRONT — moving down the pitch, towards the viewer ─────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-front">
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            <rect x={-4.8} y={6} width={3.8} height={6.2} rx={1.9} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-5.3} y={11.4} width={4.8} height={2.6} rx={1.3} fill="#111827" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            <rect x={1} y={6} width={3.8} height={6.2} rx={1.9} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={0.5} y={11.4} width={4.8} height={2.6} rx={1.3} fill="#111827" />
          </g>
          <g className="footballer-hop">
            <rect x={-6.6} y={0.4} width={13.2} height={5.8} rx={2.9} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />
            <rect x={-10.6} y={-8.2} width={3.6} height={7} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={7} y={-8.2} width={3.6} height={7} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-7.4} y={-9.8} width={14.8} height={10.6} rx={5} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            <rect x={-1.5} y={-9.8} width={3} height={10.6} fill={secondaryColor} opacity={0.85} />
            <rect x={-7.7} y={-9.2} width={2.4} height={3.2} rx={1} fill={secondaryColor} />
            <rect x={5.3} y={-9.2} width={2.4} height={3.2} rx={1} fill={secondaryColor} />
            <path d="M -2.8 -9.8 Q 0 -7.1 2.8 -9.8 Z" fill={secondaryColor} />

            <circle cx={0} cy={-16} r={8.8} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            <FrontHair style={hairStyle} color={hairColor} />
            <circle cx={-3.2} cy={-16.3} r={1.15} fill="#0b1210" />
            <circle cx={3.2} cy={-16.3} r={1.15} fill="#0b1210" />
            <FaceDetail expression={faceExpression} />
          </g>
        </g>

        {/* ── BACK — moving up the pitch, away from the viewer ───────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-back">
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            <rect x={-4.8} y={6} width={3.8} height={6.2} rx={1.9} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-5.3} y={11.4} width={4.8} height={2.6} rx={1.3} fill="#111827" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            <rect x={1} y={6} width={3.8} height={6.2} rx={1.9} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={0.5} y={11.4} width={4.8} height={2.6} rx={1.3} fill="#111827" />
          </g>
          <g className="footballer-hop">
            <rect x={-6.6} y={0.4} width={13.2} height={5.8} rx={2.9} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />
            <rect x={-10.6} y={-8.2} width={3.6} height={7} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={7} y={-8.2} width={3.6} height={7} rx={1.8} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            {/* Plain back panel — no face-side collar/stripe, just a simple center seam */}
            <rect x={-7.4} y={-9.8} width={14.8} height={10.6} rx={5} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            <path d="M 0 -9.4 L 0 0.6" stroke={secondaryColor} strokeWidth={1} opacity={0.6} />
            <rect x={-7.7} y={-9.2} width={2.4} height={3.2} rx={1} fill={secondaryColor} />
            <rect x={5.3} y={-9.2} width={2.4} height={3.2} rx={1} fill={secondaryColor} />
            <path d="M -2.8 -9.8 Q 0 -8.7 2.8 -9.8" stroke={secondaryColor} strokeWidth={1.4} fill="none" strokeLinecap="round" />

            <circle cx={0} cy={-16} r={8.8} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            <BackHair style={hairStyle} color={hairColor} skinTone={skinTone} />
          </g>
        </g>

        {/* ── SIDE — moving left/right (drawn facing right; mirrored for left
             by the shared direction transform, same as every other template) ── */}
        <g className="footballer-orientation-view footballer-orientation-view-side">
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            {/* trailing leg */}
            <rect x={-4.2} y={6.4} width={3.2} height={5.8} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={-4.6} y={11.4} width={4} height={2.4} rx={1.2} fill="#111827" />
          </g>
          <g className="footballer-leg footballer-leg-right">
            {/* leading leg — the stride itself reads as sideways motion */}
            <rect x={1.6} y={6.6} width={3.4} height={6.2} rx={1.7} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <rect x={1.2} y={11.8} width={4.4} height={2.6} rx={1.3} fill="#111827" />
          </g>
          <g className="footballer-hop">
            <rect x={-5.6} y={0.6} width={11.2} height={5.6} rx={2.8} fill={secondaryColor} stroke="#0b1210" strokeWidth={1} />
            <rect x={-7.6} y={-8} width={3.2} height={6.8} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} transform="rotate(20)" />
            <rect x={4.6} y={-8.6} width={3.2} height={6.8} rx={1.6} fill={skinTone} stroke="#0b1210" strokeWidth={0.8} transform="rotate(-16)" />
            <rect x={-6.2} y={-9.6} width={12.4} height={10.4} rx={5} fill={primaryColor} stroke="#0b1210" strokeWidth={1.2} />
            <rect x={-6.4} y={-9} width={2.2} height={3} rx={1} fill={secondaryColor} />
            <path d="M -1.6 -9.6 Q 1 -7.2 3 -9.4 Z" fill={secondaryColor} />

            <ellipse cx={0.4} cy={-16} rx={7} ry={8.6} fill={skinTone} stroke="#0b1210" strokeWidth={1.2} />
            <SideHair style={hairStyle} color={hairColor} />
            <path d="M 6.6 -15.6 Q 8.4 -15 6.8 -14 Z" fill={skinTone} stroke="#0b1210" strokeWidth={0.8} />
            <circle cx={4} cy={-16.4} r={1.05} fill="#0b1210" />
          </g>
        </g>
      </g>
    </g>
  );
}

// ── Hair — front carries the 4 distinct hairstyles (the "personality" view);
// back/side use one shared silhouette each (tinted by hairColor) instead of
// 4x3 combinations, which would add art-asset combinatorics without adding
// legibility at in-game size. ─────────────────────────────────────────────
function FrontHair({ style, color }: { style: HairStyleV3; color: string }) {
  switch (style) {
    case 'messy':
      return (
        <g fill={color} stroke="#0b1210" strokeWidth={0.6}>
          <circle cx={-5.6} cy={-21.6} r={2.6} />
          <circle cx={-1.8} cy={-24.4} r={3} />
          <circle cx={2.6} cy={-23.6} r={2.8} />
          <circle cx={6.2} cy={-20.4} r={2.3} />
          <circle cx={-7.6} cy={-18.2} r={2} />
        </g>
      );
    case 'sidePart':
      return (
        <g stroke="#0b1210" strokeWidth={0.6}>
          <path
            d="M -8.6 -16.4 Q -9.4 -26.2 -0.4 -26.6 Q 8.6 -27 8.4 -17.2 Q 6.4 -22.6 -1 -22.6 Q -7 -22.4 -8.6 -16.4 Z"
            fill={color}
          />
          <path d="M -2.6 -26 L 2 -21.8" stroke="rgba(11,18,16,0.5)" strokeWidth={0.7} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'buzz':
      return (
        <path
          d="M -8.4 -17 Q -8.8 -25 0 -25.2 Q 8.8 -25 8.4 -17 Q 3.4 -21 0 -21 Q -3.4 -21 -8.4 -17 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
    case 'short':
    default:
      return (
        <path
          d="M -8.6 -16.2 Q -9.4 -26.4 0 -26.6 Q 9.4 -26.4 8.6 -16.2 Q 7.6 -22.6 0 -22.8 Q -7.6 -22.6 -8.6 -16.2 Z"
          fill={color}
          stroke="#0b1210"
          strokeWidth={0.6}
        />
      );
  }
}

function BackHair({ style, color, skinTone }: { style: HairStyleV3; color: string; skinTone: string }) {
  if (style === 'buzz') {
    return (
      <>
        <circle cx={0} cy={-16} r={8.8} fill={skinTone} />
        <circle cx={0} cy={-16.8} r={8.2} fill={color} opacity={0.85} />
      </>
    );
  }
  return <circle cx={0} cy={-16.6} r={8.9} fill={color} stroke="#0b1210" strokeWidth={1} />;
}

function SideHair({ style, color }: { style: HairStyleV3; color: string }) {
  if (style === 'buzz') {
    return (
      <path
        d="M -6.6 -16.4 Q -7.4 -25 0.4 -25.2 Q 6 -25 6.4 -19.6 Q 2 -22.6 -2.6 -21.8 Q -5.6 -20.8 -6.6 -16.4 Z"
        fill={color}
        stroke="#0b1210"
        strokeWidth={0.6}
      />
    );
  }
  return (
    <path
      d="M -7 -16.2 Q -8 -26 1 -26.4 Q 8.4 -26.2 7.4 -18 Q 5.4 -19.8 3 -20.4 Q -1.5 -19.5 -7 -16.2 Z"
      fill={color}
      stroke="#0b1210"
      strokeWidth={0.6}
    />
  );
}

// Three simple expression variants — nose is a fixed tiny detail, the
// eyebrows/mouth are what actually vary.
function FaceDetail({ expression }: { expression: FaceExpressionV3 }) {
  return (
    <g>
      <circle cx={0} cy={-14.4} r={0.55} fill="rgba(11,18,16,0.35)" />
      {expression === 'happy' && (
        <path d="M -2.6 -12.6 Q 0 -10.6 2.6 -12.6" stroke="#0b1210" strokeWidth={0.9} fill="none" strokeLinecap="round" />
      )}
      {expression === 'focused' && (
        <>
          <path d="M -4.6 -18.6 L -1.9 -18" stroke="#0b1210" strokeWidth={0.8} strokeLinecap="round" />
          <path d="M 4.6 -18.6 L 1.9 -18" stroke="#0b1210" strokeWidth={0.8} strokeLinecap="round" />
          <path d="M -1.7 -12.8 L 1.7 -12.8" stroke="#0b1210" strokeWidth={0.8} strokeLinecap="round" />
        </>
      )}
      {expression === 'neutral' && (
        <path d="M -1.7 -12.8 L 1.7 -12.8" stroke="#0b1210" strokeWidth={0.8} strokeLinecap="round" />
      )}
    </g>
  );
}
