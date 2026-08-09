import { describe, it, expect } from 'vitest';
import { getFootballerVariantV2 } from './footballerVariantsV2';

const LIGHT_SKIN_TONES = ['#ffe0bd', '#f5d3ac', '#f2c9a0', '#e8b98c'];
const MEDIUM_SKIN_TONES = ['#c98a55'];

describe('getFootballerVariantV2', () => {
  it('is deterministic — the same label always yields the same variant', () => {
    expect(getFootballerVariantV2('N7')).toEqual(getFootballerVariantV2('N7'));
    expect(getFootballerVariantV2('A1')).toEqual(getFootballerVariantV2('A1'));
  });

  it('returns a valid hair style, face variant, skin tone, and hair color for a range of labels', () => {
    const labels = ['N1', 'N2', 'N3', 'H1', 'H2', 'A1', 'A2', 'A3', 'A4', 'A5'];
    for (const label of labels) {
      const variant = getFootballerVariantV2(label);
      expect(['short', 'curly', 'buzz', 'quiff']).toContain(variant.hairStyle);
      expect(['neutral', 'happy', 'focused']).toContain(variant.faceVariant);
      expect(variant.skinTone).toMatch(/^#[0-9a-f]{6}$/);
      expect(variant.hairColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('produces more than one distinct look across a small squad (not all clones)', () => {
    const labels = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'];
    const looks = new Set(labels.map((label) => JSON.stringify(getFootballerVariantV2(label))));
    expect(looks.size).toBeGreaterThan(1);
  });

  it('falls back to a valid variant for an empty label', () => {
    const variant = getFootballerVariantV2('');
    expect(['short', 'curly', 'buzz', 'quiff']).toContain(variant.hairStyle);
  });

  it('skews the skin tone pool towards light tones — most of a large squad lands on a light tone', () => {
    const labels = Array.from({ length: 60 }, (_, i) => `P${i}`);
    const tones = labels.map((label) => getFootballerVariantV2(label).skinTone);
    const lightCount = tones.filter((tone) => LIGHT_SKIN_TONES.includes(tone)).length;
    const mediumCount = tones.filter((tone) => MEDIUM_SKIN_TONES.includes(tone)).length;

    expect(lightCount + mediumCount).toBe(tones.length); // every tone is accounted for
    expect(lightCount).toBeGreaterThan(mediumCount); // light tones dominate, medium stays supplementary
  });
});
