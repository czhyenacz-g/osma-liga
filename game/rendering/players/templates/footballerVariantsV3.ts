import { hashString } from './footballerHash';

// Deterministic look-variety helper for SvgFootballerPlayerV3 — same
// principle as v1/v2 (each version's variant helper is independent so a
// shared change can never ripple into an older version's look; see
// footballerVariantsV1.ts / footballerVariantsV2.ts). Purely derived from
// the player's existing `label`, no new player data, no server concept of
// "appearance".
export type HairStyleV3 = 'short' | 'messy' | 'sidePart' | 'buzz';
export type FaceExpressionV3 = 'neutral' | 'happy' | 'focused';

export interface FootballerVariantV3 {
  hairStyle: HairStyleV3;
  faceExpression: FaceExpressionV3;
  skinTone: string;
  hairColor: string;
}

const HAIR_STYLES: readonly HairStyleV3[] = ['short', 'messy', 'sidePart', 'buzz'];
const FACE_EXPRESSIONS: readonly FaceExpressionV3[] = ['neutral', 'happy', 'focused'];

// dark brown, brown, light brown/blond, black — as specced.
const HAIR_COLORS: readonly string[] = ['#2b1a10', '#5a3820', '#caa46a', '#1a1a1a'];

// Same light-skewed weighting approach as v2: light European tones dominate
// (Czech amateur-football setting), one medium tone stays supplementary.
const SKIN_TONE_POOL: readonly string[] = [
  '#ffe0bd',
  '#f5d3ac',
  '#f2c9a0',
  '#e8b98c',
  '#f5d3ac',
  '#c98a55', // supplementary medium tone
];

export function getFootballerVariantV3(label: string): FootballerVariantV3 {
  const hash = hashString(label || 'player');
  return {
    hairStyle: HAIR_STYLES[hash % HAIR_STYLES.length],
    faceExpression: FACE_EXPRESSIONS[Math.floor(hash / HAIR_STYLES.length) % FACE_EXPRESSIONS.length],
    skinTone:
      SKIN_TONE_POOL[Math.floor(hash / (HAIR_STYLES.length * FACE_EXPRESSIONS.length)) % SKIN_TONE_POOL.length],
    hairColor:
      HAIR_COLORS[
        Math.floor(hash / (HAIR_STYLES.length * FACE_EXPRESSIONS.length * SKIN_TONE_POOL.length)) %
          HAIR_COLORS.length
      ],
  };
}
