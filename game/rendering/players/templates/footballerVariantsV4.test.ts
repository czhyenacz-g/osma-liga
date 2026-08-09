import { describe, it, expect } from 'vitest';
import { getFootballerVariantV4, type HairStyleV4 } from './footballerVariantsV4';

const ALL_HAIR_STYLES: HairStyleV4[] = ['short', 'messy', 'sidePart', 'buzz', 'longTop', 'receding'];
const ALL_FACE_EXPRESSIONS = ['neutral', 'smile', 'serious'];

describe('getFootballerVariantV4', () => {
  it('is deterministic — the same label always yields the same variant', () => {
    expect(getFootballerVariantV4('N7')).toEqual(getFootballerVariantV4('N7'));
    expect(getFootballerVariantV4('A1')).toEqual(getFootballerVariantV4('A1'));
  });

  it('never changes on repeated calls for the same player — no rerender-time randomness', () => {
    const first = getFootballerVariantV4('N3');
    for (let i = 0; i < 10; i++) {
      expect(getFootballerVariantV4('N3')).toEqual(first);
    }
  });

  it('returns a valid hair style, face expression, skin tone, and hair color for a range of labels', () => {
    const labels = ['N1', 'N2', 'N3', 'H1', 'H2', 'A1', 'A2', 'A3', 'A4', 'A5'];
    for (const label of labels) {
      const variant = getFootballerVariantV4(label);
      expect(ALL_HAIR_STYLES).toContain(variant.hairStyle);
      expect(ALL_FACE_EXPRESSIONS).toContain(variant.faceExpression);
      expect(variant.skinTone).toMatch(/^#[0-9a-f]{6}$/);
      expect(variant.hairColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('is able to produce all 6 hair styles across a large-enough squad', () => {
    const labels = Array.from({ length: 40 }, (_, i) => `P${i}`);
    const seenStyles = new Set(labels.map((label) => getFootballerVariantV4(label).hairStyle));
    for (const style of ALL_HAIR_STYLES) {
      expect(seenStyles.has(style)).toBe(true);
    }
  });

  it('produces more than one distinct look across a small squad (not all clones)', () => {
    const labels = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'];
    const looks = new Set(labels.map((label) => JSON.stringify(getFootballerVariantV4(label))));
    expect(looks.size).toBeGreaterThan(1);
  });

  it('falls back to a valid variant for an empty label', () => {
    const variant = getFootballerVariantV4('');
    expect(ALL_HAIR_STYLES).toContain(variant.hairStyle);
  });
});
