import { hashString } from './footballerHash';

// Deterministic look for SvgFootballerPlayerV5 — fully independent of the
// v1–v4 helpers (a change here never ripples into an older look). Derived
// only from the player's existing label (+ the goalkeeper flag), so the same
// player keeps the same archetype, hair colour and skin every frame, every
// remount, for the whole match. No new player data, nothing on the network.
//
// Five archetypes: four field-player hairstyles + the goalkeeper. Colours
// are never tied to an archetype — kit colours come from the team (see
// SvgFootballerPlayerV5.tsx), hair/skin from the pools below.
export type ArchetypeV5 = 'classic' | 'messy' | 'curly' | 'crop' | 'goalkeeper';

export const FIELD_ARCHETYPES_V5: readonly ArchetypeV5[] = ['classic', 'messy', 'curly', 'crop'];

export interface FootballerVariantV5 {
  archetype: ArchetypeV5;
  skinTone: string;
  hairColor: string;
}

// dark brown, medium brown, light brown, blond, black — same pool as v4.
const HAIR_COLORS: readonly string[] = ['#2b1a10', '#5a3820', '#8a5a30', '#caa46a', '#1a1a1a'];

// Same light-skewed weighting as v2–v4.
const SKIN_TONE_POOL: readonly string[] = ['#ffe0bd', '#f5d3ac', '#f2c9a0', '#e8b98c', '#f5d3ac', '#c98a55', '#b97b4d'];

// Field archetype: "N1".."N3" / "P1".."P3" spread over the four styles by
// their number (offset by the team letter, so N1 and P1 differ); any other
// label falls back to its hash.
function fieldArchetypeIndex(label: string): number {
  const m = /(\d+)$/.exec(label);
  if (m) return (Number(m[1]) - 1 + label.charCodeAt(0)) % FIELD_ARCHETYPES_V5.length;
  return hashString(label || 'player') % FIELD_ARCHETYPES_V5.length;
}

export function getFootballerVariantV5(label: string, isGoalkeeper: boolean): FootballerVariantV5 {
  const hash = hashString(label || 'player');
  return {
    archetype: isGoalkeeper ? 'goalkeeper' : FIELD_ARCHETYPES_V5[fieldArchetypeIndex(label)],
    skinTone: SKIN_TONE_POOL[hash % SKIN_TONE_POOL.length],
    hairColor: HAIR_COLORS[Math.floor(hash / SKIN_TONE_POOL.length) % HAIR_COLORS.length],
  };
}

// Mixes a #rrggbb colour toward white (t = 0..1) — used for the goalkeeper's
// lighter kit, derived from the team colour instead of a fixed palette.
export function lightenHex(hex: string, t: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (shift: number) => {
    const c = (n >> shift) & 0xff;
    return Math.round(c + (255 - c) * t).toString(16).padStart(2, '0');
  };
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}
