import { hashString } from './footballerHash';

// Deterministic look-variety helper for SvgFootballerPlayerV4 — same
// principle as v1/v2/v3 (each version's variant helper is fully independent
// so a change here can never ripple into an older version's look; see
// footballerVariantsV1/V2/V3.ts). Purely derived from the player's existing
// `label`, no new player data, no server concept of "appearance" — the same
// player always resolves to the same hair/face/skin combination, every
// frame, every remount.
export type HairStyleV4 = 'short' | 'messy' | 'sidePart' | 'buzz' | 'longTop' | 'receding';
export type FaceExpressionV4 = 'neutral' | 'smile' | 'serious';

export interface FootballerVariantV4 {
  hairStyle: HairStyleV4;
  faceExpression: FaceExpressionV4;
  skinTone: string;
  hairColor: string;
}

const HAIR_STYLES: readonly HairStyleV4[] = ['short', 'messy', 'sidePart', 'buzz', 'longTop', 'receding'];
const FACE_EXPRESSIONS: readonly FaceExpressionV4[] = ['neutral', 'smile', 'serious'];

// dark brown, medium brown, light brown, blond, black.
const HAIR_COLORS: readonly string[] = ['#2b1a10', '#5a3820', '#8a5a30', '#caa46a', '#1a1a1a'];

// Same light-skewed weighting as v2/v3: light European tones dominate (Czech
// amateur-football setting), a couple of medium tones stay supplementary —
// visual variety without an extreme contrast between players.
const SKIN_TONE_POOL: readonly string[] = [
  '#ffe0bd',
  '#f5d3ac',
  '#f2c9a0',
  '#e8b98c',
  '#f5d3ac',
  '#c98a55',
  '#b97b4d',
];

export function getFootballerVariantV4(label: string): FootballerVariantV4 {
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
