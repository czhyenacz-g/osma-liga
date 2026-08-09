import { hashString } from './footballerHash';

// Deterministic look-variety helper for SvgFootballerPlayerV2 — same
// principle as v1 (footballerVariantsV1.ts): purely derived from the
// player's existing `label` via a cheap string hash, no new player data, no
// server concept of "appearance". v2 additionally varies a `faceVariant`
// (eyebrows/mouth) and uses a skin tone pool weighted towards lighter
// European tones by default, matching the game's Czech amateur-football
// setting, with one medium tone as a supplementary (less frequent) option —
// see SKIN_TONE_POOL below.
export type HairStyleV2 = 'short' | 'curly' | 'buzz' | 'quiff';
export type FaceVariantV2 = 'neutral' | 'happy' | 'focused';

export interface FootballerVariantV2 {
  hairStyle: HairStyleV2;
  faceVariant: FaceVariantV2;
  skinTone: string;
  hairColor: string;
}

const HAIR_STYLES: readonly HairStyleV2[] = ['short', 'curly', 'buzz', 'quiff'];
const FACE_VARIANTS: readonly FaceVariantV2[] = ['neutral', 'happy', 'focused'];
const HAIR_COLORS: readonly string[] = ['#2b1a10', '#5a3820', '#1a1a1a', '#7a4a24', '#caa46a'];

// Weighted pool, not a plain enum-like list: light European skin tones
// appear 5 times, one medium tone appears once — so roughly 5/6 (~83%) of
// deterministically-generated players land on a light tone and about 1/6
// (~17%) on the medium tone, instead of an even split across all tones.
const SKIN_TONE_POOL: readonly string[] = [
  '#ffe0bd',
  '#f5d3ac',
  '#f2c9a0',
  '#e8b98c',
  '#f5d3ac',
  '#c98a55', // supplementary medium tone
];

export function getFootballerVariantV2(label: string): FootballerVariantV2 {
  const hash = hashString(label || 'player');
  return {
    hairStyle: HAIR_STYLES[hash % HAIR_STYLES.length],
    faceVariant: FACE_VARIANTS[Math.floor(hash / HAIR_STYLES.length) % FACE_VARIANTS.length],
    skinTone: SKIN_TONE_POOL[Math.floor(hash / (HAIR_STYLES.length * FACE_VARIANTS.length)) % SKIN_TONE_POOL.length],
    hairColor:
      HAIR_COLORS[
        Math.floor(hash / (HAIR_STYLES.length * FACE_VARIANTS.length * SKIN_TONE_POOL.length)) % HAIR_COLORS.length
      ],
  };
}
