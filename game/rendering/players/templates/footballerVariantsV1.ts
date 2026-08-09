import { hashString } from './footballerHash';

// Small deterministic look-variety helper for SvgFootballerPlayerV1 — so a
// full team doesn't render as identical clones of the same head. No new
// player data is introduced: the variant is derived purely from the
// player's existing `label` (e.g. "N1", "H3") via a cheap string hash, so
// the same player always gets the same look across every frame/remount,
// without any extra prop or server-side concept of "appearance".
export type HairStyle = 'short' | 'curly' | 'buzz';

export interface FootballerVariant {
  hairStyle: HairStyle;
  skinTone: string;
  hairColor: string;
}

const HAIR_STYLES: readonly HairStyle[] = ['short', 'curly', 'buzz'];
const SKIN_TONES: readonly string[] = ['#f2c9a0', '#d9a066', '#8d5a3a'];
const HAIR_COLORS: readonly string[] = ['#2b1a10', '#5a3820', '#1a1a1a', '#7a4a24'];

export function getFootballerVariantV1(label: string): FootballerVariant {
  const hash = hashString(label || 'player');
  return {
    hairStyle: HAIR_STYLES[hash % HAIR_STYLES.length],
    skinTone: SKIN_TONES[Math.floor(hash / HAIR_STYLES.length) % SKIN_TONES.length],
    hairColor: HAIR_COLORS[Math.floor(hash / (HAIR_STYLES.length * SKIN_TONES.length)) % HAIR_COLORS.length],
  };
}
