import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PLAYER_VISUAL_TEMPLATE,
  normalizePlayerVisualTemplate,
} from './playerVisualTemplate';

describe('playerVisualTemplate', () => {
  it('defaults to pixel-characters', () => {
    expect(DEFAULT_PLAYER_VISUAL_TEMPLATE).toBe('pixel-characters');
  });

  it('accepts all six valid templates unchanged', () => {
    expect(normalizePlayerVisualTemplate('pixel-characters')).toBe('pixel-characters');
    expect(normalizePlayerVisualTemplate('minimal-circles')).toBe('minimal-circles');
    expect(normalizePlayerVisualTemplate('legacy')).toBe('legacy');
    expect(normalizePlayerVisualTemplate('svg-footballers-v1')).toBe('svg-footballers-v1');
    expect(normalizePlayerVisualTemplate('svg-footballers-v2')).toBe('svg-footballers-v2');
    expect(normalizePlayerVisualTemplate('svg-footballers-v3')).toBe('svg-footballers-v3');
  });

  it('maps the short-lived pre-v1/v2-split stored value to svg-footballers-v1', () => {
    expect(normalizePlayerVisualTemplate('svg-footballers')).toBe('svg-footballers-v1');
  });

  it('falls back to pixel-characters for an unknown string', () => {
    expect(normalizePlayerVisualTemplate('some-old-value')).toBe('pixel-characters');
  });

  it('falls back to pixel-characters for null/undefined/non-string input', () => {
    expect(normalizePlayerVisualTemplate(null)).toBe('pixel-characters');
    expect(normalizePlayerVisualTemplate(undefined)).toBe('pixel-characters');
    expect(normalizePlayerVisualTemplate(42)).toBe('pixel-characters');
    expect(normalizePlayerVisualTemplate({})).toBe('pixel-characters');
  });
});
