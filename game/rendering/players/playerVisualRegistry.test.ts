import { describe, it, expect } from 'vitest';
import { playerVisualRegistry, resolvePlayerVisualComponent, usesSharedActiveIndicator } from './playerVisualRegistry';
import PixelCharacterPlayer from './templates/PixelCharacterPlayer';
import MinimalCirclePlayer from './templates/MinimalCirclePlayer';
import LegacyPlayerVisual from './templates/LegacyPlayerVisual';
import SvgFootballerPlayerV1 from './templates/SvgFootballerPlayerV1';
import SvgFootballerPlayerV2 from './templates/SvgFootballerPlayerV2';
import type { PlayerVisualTemplate } from '../../presentation/playerVisualTemplate';

describe('playerVisualRegistry', () => {
  it('maps each template to its correct component', () => {
    expect(playerVisualRegistry['pixel-characters']).toBe(PixelCharacterPlayer);
    expect(playerVisualRegistry['minimal-circles']).toBe(MinimalCirclePlayer);
    expect(playerVisualRegistry.legacy).toBe(LegacyPlayerVisual);
    expect(playerVisualRegistry['svg-footballers-v1']).toBe(SvgFootballerPlayerV1);
    expect(playerVisualRegistry['svg-footballers-v2']).toBe(SvgFootballerPlayerV2);
  });

  it('resolvePlayerVisualComponent returns the matching component for a valid template', () => {
    expect(resolvePlayerVisualComponent('pixel-characters')).toBe(PixelCharacterPlayer);
    expect(resolvePlayerVisualComponent('minimal-circles')).toBe(MinimalCirclePlayer);
    expect(resolvePlayerVisualComponent('legacy')).toBe(LegacyPlayerVisual);
    expect(resolvePlayerVisualComponent('svg-footballers-v1')).toBe(SvgFootballerPlayerV1);
    expect(resolvePlayerVisualComponent('svg-footballers-v2')).toBe(SvgFootballerPlayerV2);
  });

  it('falls back to pixel-characters for a missing/unknown template key', () => {
    const bogus = 'nonexistent-template' as PlayerVisualTemplate;
    expect(resolvePlayerVisualComponent(bogus)).toBe(PixelCharacterPlayer);
  });

  it('only legacy is excluded from the shared active indicator', () => {
    expect(usesSharedActiveIndicator('pixel-characters')).toBe(true);
    expect(usesSharedActiveIndicator('minimal-circles')).toBe(true);
    expect(usesSharedActiveIndicator('svg-footballers-v1')).toBe(true);
    expect(usesSharedActiveIndicator('svg-footballers-v2')).toBe(true);
    expect(usesSharedActiveIndicator('legacy')).toBe(false);
  });
});
