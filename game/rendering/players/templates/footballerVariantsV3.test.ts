import { describe, it, expect } from 'vitest';
import { getFootballerVariantV3 } from './footballerVariantsV3';

const LIGHT_SKIN_TONES = ['#ffe0bd', '#f5d3ac', '#f2c9a0', '#e8b98c'];
const MEDIUM_SKIN_TONES = ['#c98a55'];

describe('getFootballerVariantV3', () => {
  it('is deterministic — the same label always yields the same variant', () => {
    expect(getFootballerVariantV3('N7')).toEqual(getFootballerVariantV3('N7'));
    expect(getFootballerVariantV3('A1')).toEqual(getFootballerVariantV3('A1'));
  });

  it('returns a valid hair style, face expression, skin tone, and hair color for a range of labels', () => {
    const labels = ['N1', 'N2', 'N3', 'H1', 'H2', 'A1', 'A2', 'A3', 'A4', 'A5'];
    for (const label of labels) {
      const variant = getFootballerVariantV3(label);
      expect(['short', 'messy', 'sidePart', 'buzz']).toContain(variant.hairStyle);
      expect(['neutral', 'happy', 'focused']).toContain(variant.faceExpression);
      expect(variant.skinTone).toMatch(/^#[0-9a-f]{6}$/);
      expect(variant.hairColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('produces more than one distinct look across a small squad (not all clones)', () => {
    const labels = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'];
    const looks = new Set(labels.map((label) => JSON.stringify(getFootballerVariantV3(label))));
    expect(looks.size).toBeGreaterThan(1);
  });

  it('falls back to a valid variant for an empty label', () => {
    const variant = getFootballerVariantV3('');
    expect(['short', 'messy', 'sidePart', 'buzz']).toContain(variant.hairStyle);
  });

  it('skews the skin tone pool towards light tones — most of a large squad lands on a light tone', () => {
    const labels = Array.from({ length: 60 }, (_, i) => `P${i}`);
    const tones = labels.map((label) => getFootballerVariantV3(label).skinTone);
    const lightCount = tones.filter((tone) => LIGHT_SKIN_TONES.includes(tone)).length;
    const mediumCount = tones.filter((tone) => MEDIUM_SKIN_TONES.includes(tone)).length;

    expect(lightCount + mediumCount).toBe(tones.length);
    expect(lightCount).toBeGreaterThan(mediumCount);
  });
});
