import { describe, it, expect } from 'vitest';
import { getFootballerVariant } from './footballerVariants';

describe('getFootballerVariant', () => {
  it('is deterministic — the same label always yields the same variant', () => {
    expect(getFootballerVariant('N7')).toEqual(getFootballerVariant('N7'));
    expect(getFootballerVariant('A1')).toEqual(getFootballerVariant('A1'));
  });

  it('returns a valid hair style, skin tone, and hair color for a range of labels', () => {
    const labels = ['N1', 'N2', 'N3', 'H1', 'H2', 'A1', 'A2', 'A3', 'A4', 'A5'];
    for (const label of labels) {
      const variant = getFootballerVariant(label);
      expect(['short', 'curly', 'buzz']).toContain(variant.hairStyle);
      expect(variant.skinTone).toMatch(/^#[0-9a-f]{6}$/);
      expect(variant.hairColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('produces more than one distinct look across a small squad (not all clones)', () => {
    const labels = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'];
    const looks = new Set(labels.map((label) => JSON.stringify(getFootballerVariant(label))));
    expect(looks.size).toBeGreaterThan(1);
  });

  it('falls back to a valid variant for an empty label', () => {
    const variant = getFootballerVariant('');
    expect(['short', 'curly', 'buzz']).toContain(variant.hairStyle);
  });
});
