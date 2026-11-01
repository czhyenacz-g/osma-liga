import type { PlayerVisualComponentProps } from '../playerVisualTypes';
import { getFootballerVariantV5, lightenHex, type ArchetypeV5 } from './footballerVariantsV5';

// "svg-footballers-v5" — the next step after v4, built on exactly the same
// mechanics: plain SVG shapes, front/back/side poses switched by the shared
// "orientation-*" ancestor class, legs/hop/kick animated by the existing
// .footballer-* CSS (playerVisualAnimations.css, no new CSS), mirrored for
// left by PlayerVisualContainer's direction group, sized by
// PLAYER_VISUAL_CONFIG['svg-footballers-v5'].visualRadiusScale (never the
// real hitbox). Local origin = the player's physical centre, boots end at
// y ≈ 15.6 like v4.
//
// What changes against v4: a bigger head with ears and a clearer face, one
// outline weight for every part, socks and boots, and five archetypes
// (footballerVariantsV5.ts) that only swap hair and a few face details —
// body, kit and proportions are shared. Kit colours always come from the
// team: jersey = primaryColor, shorts = secondaryColor, socks white with a
// primaryColor band; the goalkeeper wears a lighter shade of the team
// colour with a chest band, dark shorts and big white gloves.
const INK = '#0b1210';
const OUTLINE = 1.3;
const OUTLINE_THIN = 0.9;
const BOOT = '#151a18';
const SOCK = '#f4f6f5';
const GLOVE = '#f8fafc';

// The two bigger hairstyles (curly, messy spikes) are squashed a little
// around the head centre so every archetype ends at a similar height and
// width — the label above the head then sits at one shared offset.
const HAIR_BALANCE: Partial<Record<ArchetypeV5, string>> = {
  messy: 'translate(0 -17.6) scale(1 0.9) translate(0 17.6)',
  curly: 'translate(0 -17.6) scale(0.95 0.9) translate(0 17.6)',
};

interface Kit {
  jersey: string;
  trim: string;
  shorts: string;
  sockBand: string;
  // Goalkeeper only: a horizontal chest band in the team's second colour.
  band?: string;
}

function kitFor(primary: string, secondary: string, isGoalkeeper: boolean): Kit {
  if (isGoalkeeper) {
    return { jersey: lightenHex(primary, 0.45), trim: secondary, shorts: '#1f2933', sockBand: secondary, band: secondary };
  }
  return { jersey: primary, trim: secondary, shorts: secondary, sockBand: primary };
}

export default function SvgFootballerPlayerV5({ team, label, primaryColor, secondaryColor, isGoalkeeper }: PlayerVisualComponentProps) {
  // Both goalkeepers are labelled "GK" — the team keeps their looks apart.
  const { archetype, skinTone, hairColor } = getFootballerVariantV5(isGoalkeeper ? `${team}-${label}` : label, isGoalkeeper);
  const kit = kitFor(primaryColor, secondaryColor, isGoalkeeper);

  return (
    <g data-archetype={archetype}>
      <ellipse cx={0} cy={15.2} rx={9.6} ry={2.8} fill="rgba(0,0,0,0.34)" />

      <g className="footballer-body-group">
        {/* ── FRONT ─────────────────────────────────────────────────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-front">
          <FrontLegs skinTone={skinTone} kit={kit} />
          <g className="footballer-hop">
            <Shorts kit={kit} />
            <FrontArms skinTone={skinTone} kit={kit} gloves={isGoalkeeper} />
            <rect x={-2.4} y={-9.4} width={4.8} height={2.6} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />
            <Torso kit={kit} />
            <path d="M -3.2 -8 L 0 -4.4 L 3.2 -8" fill="none" stroke={kit.trim} strokeWidth={1.6} strokeLinejoin="round" />
            <Ears skinTone={skinTone} />
            <FrontHead archetype={archetype} skinTone={skinTone} />
            <g transform={HAIR_BALANCE[archetype]}>
              <FrontHair archetype={archetype} color={hairColor} />
            </g>
            <Face archetype={archetype} />
          </g>
        </g>

        {/* ── BACK ──────────────────────────────────────────────────────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-back">
          <FrontLegs skinTone={skinTone} kit={kit} />
          <g className="footballer-hop">
            <Shorts kit={kit} />
            <FrontArms skinTone={skinTone} kit={kit} gloves={isGoalkeeper} />
            <rect x={-2.4} y={-9.4} width={4.8} height={2.6} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />
            <Torso kit={kit} />
            <path d="M -3.2 -7.8 Q 0 -6.6 3.2 -7.8" fill="none" stroke={kit.trim} strokeWidth={1.6} strokeLinecap="round" />
            <Ears skinTone={skinTone} />
            <FrontHead archetype={archetype} skinTone={skinTone} />
            <g transform={HAIR_BALANCE[archetype]}>
              <BackHair archetype={archetype} color={hairColor} />
            </g>
          </g>
        </g>

        {/* ── SIDE — facing right; mirrored for left by the shared direction
             transform. Back leg first, front (kicking) leg on top. ─────────── */}
        <g className="footballer-orientation-view footballer-orientation-view-side">
          <g className="footballer-leg footballer-leg-right">
            <Leg x={-3.6} skinTone={skinTone} kit={kit} toe={1} />
          </g>
          <g className="footballer-leg footballer-leg-left footballer-kick-leg">
            <Leg x={0.6} skinTone={skinTone} kit={kit} toe={1} />
          </g>
          <g className="footballer-hop">
            <rect x={-5.8} y={-0.2} width={11.2} height={6.8} rx={2.6} fill={kit.shorts} stroke={INK} strokeWidth={OUTLINE} />
            {/* back arm */}
            <g transform="rotate(24 -1 -6)">
              <rect x={-2.6} y={-7.6} width={3.4} height={4.4} rx={1.5} fill={kit.jersey} stroke={INK} strokeWidth={OUTLINE_THIN} />
              <rect x={-2.5} y={-3.6} width={3.2} height={4.2} rx={1.5} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />
              <Hand cx={-0.9} cy={1} skinTone={skinTone} gloves={isGoalkeeper} />
            </g>
            <rect x={-1.8} y={-9.4} width={3.6} height={2.6} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />
            <rect x={-6.4} y={-8.6} width={12.4} height={10.6} rx={4.4} fill={kit.jersey} stroke={INK} strokeWidth={OUTLINE} />
            {kit.band && <rect x={-5.7} y={-4.6} width={11} height={2} fill={kit.band} />}
            <path d="M 1.2 -8.4 Q 3.6 -6.4 5.2 -8" fill="none" stroke={kit.trim} strokeWidth={1.5} strokeLinecap="round" />
            {/* front arm, swinging forward */}
            <g transform="rotate(-26 1 -6)">
              <rect x={-0.4} y={-7.6} width={3.4} height={4.4} rx={1.5} fill={kit.jersey} stroke={INK} strokeWidth={OUTLINE_THIN} />
              <rect x={-0.3} y={-3.6} width={3.2} height={4.2} rx={1.5} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />
              <Hand cx={1.3} cy={1} skinTone={skinTone} gloves={isGoalkeeper} />
            </g>
            <SideHead archetype={archetype} skinTone={skinTone} hairColor={hairColor} />
          </g>
        </g>
      </g>
    </g>
  );
}

// ── Shared body parts ─────────────────────────────────────────────────────

// One leg: thigh (skin), sock with a team band, boot. `toe` points the boot
// (+1 right) — front/back views turn each boot outward.
function Leg({ x, skinTone, kit, toe }: { x: number; skinTone: string; kit: Kit; toe: 1 | -1 }) {
  const bootX = toe > 0 ? x - 0.4 : x - 1.6;
  return (
    <>
      <rect x={x} y={5} width={4} height={4.6} rx={1.6} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />
      <rect x={x} y={8.6} width={4} height={4.8} rx={1.2} fill={SOCK} stroke={INK} strokeWidth={OUTLINE_THIN} />
      <rect x={x + 0.45} y={9.3} width={3.1} height={1.3} fill={kit.sockBand} />
      <rect x={bootX} y={12.6} width={6} height={3} rx={1.5} fill={BOOT} stroke={INK} strokeWidth={OUTLINE_THIN} />
    </>
  );
}

function FrontLegs({ skinTone, kit }: { skinTone: string; kit: Kit }) {
  return (
    <>
      <g className="footballer-leg footballer-leg-left footballer-kick-leg">
        <Leg x={-5.2} skinTone={skinTone} kit={kit} toe={-1} />
      </g>
      <g className="footballer-leg footballer-leg-right">
        <Leg x={1.2} skinTone={skinTone} kit={kit} toe={1} />
      </g>
    </>
  );
}

function Shorts({ kit }: { kit: Kit }) {
  return <rect x={-7.2} y={-0.2} width={14.4} height={6.8} rx={2.6} fill={kit.shorts} stroke={INK} strokeWidth={OUTLINE} />;
}

// Field players: a small skin-tone hand. Goalkeeper: a big white glove with
// a cuff over the wrist — the clearest goalkeeper cue at play size.
function Hand({ cx, cy, skinTone, gloves }: { cx: number; cy: number; skinTone: string; gloves: boolean }) {
  if (!gloves) return <circle cx={cx} cy={cy} r={1.7} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />;
  return (
    <>
      <rect x={cx - 1.9} y={cy - 3.4} width={3.8} height={2.6} rx={0.8} fill={GLOVE} stroke={INK} strokeWidth={OUTLINE_THIN} />
      <circle cx={cx} cy={cy} r={2.9} fill={GLOVE} stroke={INK} strokeWidth={OUTLINE} />
    </>
  );
}

function FrontArms({ skinTone, kit, gloves }: { skinTone: string; kit: Kit; gloves: boolean }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <g key={s} transform={`rotate(${s * -12} ${s * 8} -7)`}>
          <rect x={s > 0 ? 7 : -10.4} y={-8} width={3.4} height={4.2} rx={1.5} fill={kit.jersey} stroke={INK} strokeWidth={OUTLINE_THIN} />
          <rect x={s > 0 ? 7.6 : -10.2} y={-6.6} width={2.6} height={1.1} fill={kit.trim} />
          <rect x={s > 0 ? 7.1 : -10.3} y={-4.2} width={3.2} height={4.2} rx={1.5} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />
          <Hand cx={s * 8.7} cy={0.6} skinTone={skinTone} gloves={gloves} />
        </g>
      ))}
    </>
  );
}

function Torso({ kit }: { kit: Kit }) {
  return (
    <>
      <rect x={-7.8} y={-8.6} width={15.6} height={10.6} rx={4.6} fill={kit.jersey} stroke={INK} strokeWidth={OUTLINE} />
      <path d="M -6.6 -1.4 L 6.6 -1.4" stroke="rgba(0,0,0,0.12)" strokeWidth={1.2} />
      {kit.band && <rect x={-7.1} y={-4.6} width={14.2} height={2} fill={kit.band} />}
    </>
  );
}

function Ears({ skinTone }: { skinTone: string }) {
  return (
    <>
      <ellipse cx={-9.3} cy={-17} rx={1.6} ry={2.2} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />
      <ellipse cx={9.3} cy={-17} rx={1.6} ry={2.2} fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} />
    </>
  );
}

// The crop archetype has a slightly wider, squarer face.
function FrontHead({ archetype, skinTone }: { archetype: ArchetypeV5; skinTone: string }) {
  const wide = archetype === 'crop';
  return <ellipse cx={0} cy={-17.6} rx={wide ? 9.8 : 9.3} ry={wide ? 8.9 : 9.3} fill={skinTone} stroke={INK} strokeWidth={OUTLINE} />;
}

// Eyes, brows, nose, mouth — a few details differ per archetype.
function Face({ archetype }: { archetype: ArchetypeV5 }) {
  const brow =
    archetype === 'crop' ? 'M -5.4 -20.4 L -1.8 -19.8 M 5.4 -20.4 L 1.8 -19.8'
    : archetype === 'messy' ? 'M -5.2 -20 Q -3.6 -21.4 -1.8 -20.4 M 5.2 -20.6 Q 3.6 -21.2 1.8 -20.2'
    : 'M -5.2 -20.2 Q -3.5 -21.2 -1.8 -20.4 M 5.2 -20.2 Q 3.5 -21.2 1.8 -20.4';
  const mouth =
    archetype === 'messy' ? <path d="M -2.8 -13.4 Q 0 -10.4 2.8 -13.4 Z" fill="#7a2a20" stroke={INK} strokeWidth={0.7} strokeLinejoin="round" />
    : archetype === 'crop' ? <path d="M -2.4 -13 Q 0 -11.8 2.4 -13" fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
    : <path d="M -3 -13.4 Q 0 -10.8 3 -13.4" fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />;
  const eyeR = archetype === 'curly' ? 1.45 : 1.3;
  return (
    <g>
      <path d={brow} fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
      <circle cx={-3.4} cy={-17.4} r={eyeR} fill={INK} />
      <circle cx={3.4} cy={-17.4} r={eyeR} fill={INK} />
      <circle cx={-3} cy={-17.9} r={0.42} fill="#ffffff" />
      <circle cx={3.8} cy={-17.9} r={0.42} fill="#ffffff" />
      <path d="M -0.6 -15.8 Q 0.6 -14.6 -0.4 -14.2" fill="none" stroke="rgba(11,18,16,0.45)" strokeWidth={0.7} strokeLinecap="round" />
      <ellipse cx={-5.6} cy={-14.6} rx={1.3} ry={0.8} fill="rgba(230,90,80,0.25)" />
      <ellipse cx={5.6} cy={-14.6} rx={1.3} ry={0.8} fill="rgba(230,90,80,0.25)" />
      {mouth}
    </g>
  );
}

// ── Hair: the main difference between archetypes ─────────────────────────

// Curly hair = a ring of small circles over a solid cap (no gaps).
function curls(cx: number, cy: number, r: number, from: number, to: number, n: number, size: number) {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={size} />);
}

function FrontHair({ archetype, color }: { archetype: ArchetypeV5; color: string }) {
  const p = { fill: color, stroke: INK, strokeWidth: OUTLINE_THIN, strokeLinejoin: 'round' as const };
  switch (archetype) {
    case 'messy':
      return (
        <path
          {...p}
          d="M -9.6 -16.4 Q -11.2 -22 -8.4 -25.4 L -9.6 -28.4 L -5.6 -27 L -4.4 -31 L -1.2 -28.2 L 1.4 -31.6 L 3.4 -28 L 7 -30.2 L 7.2 -26.4 L 10.4 -26 Q 10.8 -21.2 9.6 -16.4 Q 8.6 -20.4 6.4 -21.4 L 5 -19.8 L 3.6 -22 L 1 -20.4 L -0.8 -22.4 L -3.4 -20.6 L -5 -22.2 Q -8.2 -21 -9.6 -16.4 Z"
        />
      );
    case 'curly':
      return (
        <g {...p}>
          <path d="M -9.6 -15.6 Q -10.6 -28.6 0 -29 Q 10.6 -28.6 9.6 -15.6 Q 8.4 -21.4 0 -21.8 Q -8.4 -21.4 -9.6 -15.6 Z" />
          {curls(0, -19.6, 9.6, 190, 350, 8, 2.9)}
          <circle cx={-3.4} cy={-27.6} r={2.9} />
          <circle cx={3.2} cy={-27.8} r={2.9} />
          <circle cx={0} cy={-29.4} r={2.7} />
        </g>
      );
    case 'crop':
      return (
        <path
          {...p}
          d="M -9.4 -18.6 Q -9.8 -27.4 0 -27.6 Q 9.8 -27.4 9.4 -18.6 Q 5 -22.6 0 -22.6 Q -5 -22.6 -9.4 -18.6 Z"
        />
      );
    case 'goalkeeper':
      // Side parting, swept to one side.
      return (
        <g {...p}>
          <path d="M -9.6 -16.6 Q -10.6 -27.8 -0.8 -28.4 Q 9.8 -28.6 9.6 -17.4 Q 7.4 -23.4 -1.8 -23.4 Q -7.4 -22.8 -9.6 -16.6 Z" />
          <path d="M -3 -28.2 Q -1 -25.4 1.8 -23.6" fill="none" strokeWidth={0.7} />
        </g>
      );
    case 'classic':
    default:
      // Short, tidy, a small fringe dip in the middle.
      return (
        <path
          {...p}
          d="M -9.6 -16.6 Q -10.6 -28.2 0 -28.6 Q 10.6 -28.2 9.6 -16.6 Q 8.6 -22.6 3 -22.8 Q 1 -21.2 -1.2 -22.6 Q -7.6 -22.8 -9.6 -16.6 Z"
        />
      );
  }
}

// Covers the top/back of the head; the lower head, ears and neck stay visible.
function BackHair({ archetype, color }: { archetype: ArchetypeV5; color: string }) {
  const p = { fill: color, stroke: INK, strokeWidth: OUTLINE_THIN, strokeLinejoin: 'round' as const };
  switch (archetype) {
    case 'messy':
      return (
        <path
          {...p}
          d="M -9.4 -13.8 Q -11 -24 -8 -26 L -8.8 -29 L -4.6 -27.6 L -2.6 -31 L 0.2 -28.4 L 3 -31.2 L 4.6 -27.6 L 8.6 -28.4 L 8.4 -25 Q 10.8 -21 9.4 -13.8 Q 7 -16.2 4.4 -15 L 2.6 -16.8 L 0 -15 L -2.4 -16.8 L -4.6 -15 Q -7.4 -16.4 -9.4 -13.8 Z"
        />
      );
    case 'curly':
      return (
        <g {...p}>
          <path d="M -9.6 -13.4 Q -10.6 -28.6 0 -29 Q 10.6 -28.6 9.6 -13.4 Q 8.4 -17.4 0 -17.6 Q -8.4 -17.4 -9.6 -13.4 Z" />
          {curls(0, -18.6, 9.6, 160, 380, 10, 2.9)}
          <circle cx={0} cy={-29} r={2.8} />
          <circle cx={-3.6} cy={-22} r={2.6} />
          <circle cx={3.6} cy={-22} r={2.6} />
        </g>
      );
    case 'crop':
      return (
        <path
          {...p}
          d="M -9.2 -16 Q -9.8 -27.4 0 -27.6 Q 9.8 -27.4 9.2 -16 Q 6 -18.6 0 -18.8 Q -6 -18.6 -9.2 -16 Z"
        />
      );
    case 'goalkeeper':
    case 'classic':
    default:
      return (
        <path
          {...p}
          d="M -9.6 -14.2 Q -10.6 -28.2 0 -28.6 Q 10.6 -28.2 9.6 -14.2 Q 8.8 -18.6 0 -18.9 Q -8.8 -18.6 -9.6 -14.2 Z"
        />
      );
  }
}

// Profile head facing right: nose bump at the front, ear and eye, hair over
// the top and back.
function SideHead({ archetype, skinTone, hairColor }: { archetype: ArchetypeV5; skinTone: string; hairColor: string }) {
  const p = { fill: hairColor, stroke: INK, strokeWidth: OUTLINE_THIN, strokeLinejoin: 'round' as const };
  let hair;
  switch (archetype) {
    case 'messy':
      hair = (
        <path
          {...p}
          d="M -8.4 -13.8 Q -10.4 -24.4 -5.6 -27.4 L -6.8 -30 L -2.4 -28.6 L 0 -31.4 L 2.2 -28.4 L 5.6 -30 L 5.6 -26.6 L 9.6 -25.4 Q 9.8 -22 8.4 -20 L 6.4 -21.4 L 4.4 -20 L 2 -21.6 L -0.4 -19.6 Q -3.8 -20 -4.4 -15.8 Q -6.6 -16.4 -8.4 -13.8 Z"
        />
      );
      break;
    case 'curly':
      hair = (
        <g {...p}>
          <path d="M -8.4 -13.4 Q -10.4 -28.4 0.6 -28.8 Q 9.8 -28.4 9 -21 Q 5 -22.4 1.6 -21.6 Q -2.6 -20.4 -3.8 -15.2 Q -6.4 -15.6 -8.4 -13.4 Z" />
          {curls(0.4, -19.4, 9.2, 140, 300, 8, 2.9)}
          <circle cx={6.2} cy={-25.4} r={2.6} />
        </g>
      );
      break;
    case 'crop':
      hair = (
        <path
          {...p}
          d="M -8 -15.6 Q -9.4 -27.4 0.6 -27.6 Q 9 -27.2 8.8 -21.4 Q 5 -22.6 1.6 -22.2 Q -2.6 -21.6 -3.6 -17.6 Q -6 -17.8 -8 -15.6 Z"
        />
      );
      break;
    case 'goalkeeper':
    case 'classic':
    default:
      hair = (
        <path
          {...p}
          d="M -8.4 -14 Q -10.4 -28.2 0.6 -28.6 Q 10 -28.2 9.4 -20.6 Q 6.6 -22.6 2.4 -22.4 Q -2.4 -21.6 -3.6 -16.4 Q -6.2 -16.6 -8.4 -14 Z"
        />
      );
  }
  return (
    <g>
      <path
        d="M -7.8 -17.6 Q -8.4 -26.8 0.6 -26.9 Q 8.8 -26.8 9.1 -18.6 L 10.6 -16.4 Q 10.8 -15.4 9.4 -15 Q 8.6 -10.2 2.2 -9 Q -6.6 -8.6 -7.8 -17.6 Z"
        fill={skinTone}
        stroke={INK}
        strokeWidth={OUTLINE}
        strokeLinejoin="round"
      />
      <path d="M -0.4 -18.4 Q -2.6 -17 -0.6 -15" fill={skinTone} stroke={INK} strokeWidth={OUTLINE_THIN} strokeLinecap="round" />
      <g transform={HAIR_BALANCE[archetype]}>{hair}</g>
      <path d="M 3.4 -20.4 Q 5.2 -21.2 6.8 -20.4" fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
      <circle cx={5.4} cy={-17.6} r={1.3} fill={INK} />
      <circle cx={5.8} cy={-18.1} r={0.4} fill="#ffffff" />
      <path d="M 5 -12.8 Q 6.8 -12 8.2 -13" fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
    </g>
  );
}
