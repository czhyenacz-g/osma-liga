import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PLAYER_VISUAL_TEMPLATE,
  normalizePlayerVisualTemplate,
} from './playerVisualTemplate';

describe('playerVisualTemplate', () => {
  it('defaults to svg-footballers-v5', () => {
    expect(DEFAULT_PLAYER_VISUAL_TEMPLATE).toBe('svg-footballers-v5');
  });

  it('accepts all eight valid templates unchanged', () => {
    expect(normalizePlayerVisualTemplate('pixel-characters')).toBe('pixel-characters');
    expect(normalizePlayerVisualTemplate('minimal-circles')).toBe('minimal-circles');
    expect(normalizePlayerVisualTemplate('legacy')).toBe('legacy');
    expect(normalizePlayerVisualTemplate('svg-footballers-v1')).toBe('svg-footballers-v1');
    expect(normalizePlayerVisualTemplate('svg-footballers-v2')).toBe('svg-footballers-v2');
    expect(normalizePlayerVisualTemplate('svg-footballers-v3')).toBe('svg-footballers-v3');
    expect(normalizePlayerVisualTemplate('svg-footballers-v4')).toBe('svg-footballers-v4');
    expect(normalizePlayerVisualTemplate('svg-footballers-v5')).toBe('svg-footballers-v5');
  });

  it('maps the short-lived pre-v1/v2-split stored value to svg-footballers-v1', () => {
    expect(normalizePlayerVisualTemplate('svg-footballers')).toBe('svg-footballers-v1');
  });

  it('falls back to svg-footballers-v5 for an unknown string', () => {
    expect(normalizePlayerVisualTemplate('some-old-value')).toBe('svg-footballers-v5');
  });

  it('falls back to svg-footballers-v5 for null/undefined/non-string input', () => {
    expect(normalizePlayerVisualTemplate(null)).toBe('svg-footballers-v5');
    expect(normalizePlayerVisualTemplate(undefined)).toBe('svg-footballers-v5');
    expect(normalizePlayerVisualTemplate(42)).toBe('svg-footballers-v5');
    expect(normalizePlayerVisualTemplate({})).toBe('svg-footballers-v5');
  });
});
