import type { PlayerVisualComponentProps } from '../playerVisualTypes';
import { getFootballerVariant, type HairStyle } from './footballerVariants';

// New "living" template — a small stylized/chibi footballer: big readable
// head, compact jersey body, short arms/legs, simple face. Front-facing (not
// a direction-aware sprite set — see PlayerVisualContainer, which mirrors
// this whole group via scaleX for left-facing movement, same as every other
// template) and drawn as a handful of plain shapes, not detailed paths, so
// it stays cheap to render and legible at in-game size.
//
// Mounted once per player and never re-rendered for per-frame data — exactly
// like PixelCharacterPlayer, the stepping/hop/charge-vibrate/kick animations
// are pure CSS (playerVisualAnimations.css ".footballer-player" rules)
// reacting to boolean classes toggled on the ancestor <g> by
// PlayerVisualContainer every frame.
export default function SvgFootballerPlayer({ label, primaryColor, secondaryColor }: PlayerVisualComponentProps) {
  const { hairStyle, skinTone, hairColor } = getFootballerVariant(label);

  return (
    <g>
      {/* Shadow — separates the character from the pitch, matches other templates' grounding cue */}
      <ellipse cx={0} cy={15} rx={8} ry={2.4} fill="rgba(0,0,0,0.28)" />

      <g className="footballer-body-group">
        {/* Legs — separate wrappers so CSS can animate them out of phase, same pattern as pixel-characters */}
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
