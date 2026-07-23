import { describe, it, expect } from 'vitest';
import { playerVisualRegistry, resolvePlayerVisualComponent, usesSharedActiveIndicator } from './playerVisualRegistry';
import PixelCharacterPlayer from './templates/PixelCharacterPlayer';
import MinimalCirclePlayer from './templates/MinimalCirclePlayer';
import LegacyPlayerVisual from './templates/LegacyPlayerVisual';
import type { PlayerVisualTemplate } from '../../presentation/playerVisualTemplate';

describe('playerVisualRegistry', () => {
  it('maps each template to its correct component', () => {
    expect(playerVisualRegistry['pixel-characters']).toBe(PixelCharacterPlayer);
    expect(playerVisualRegistry['minimal-circles']).toBe(MinimalCirclePlayer);
    expect(playerVisualRegistry.legacy).toBe(LegacyPlayerVisual);
  });

  it('resolvePlayerVisualComponent returns the matching component for a valid template', () => {
    expect(resolvePlayerVisualComponent('pixel-characters')).toBe(PixelCharacterPlayer);
    expect(resolvePlayerVisualComponent('minimal-circles')).toBe(MinimalCirclePlayer);
    expect(resolvePlayerVisualComponent('legacy')).toBe(LegacyPlayerVisual);
  });

  it('falls back to pixel-characters for a missing/unknown template key', () => {
    const bogus = 'nonexistent-template' as PlayerVisualTemplate;
    expect(resolvePlayerVisualComponent(bogus)).toBe(PixelCharacterPlayer);
  });

  it('only legacy is excluded from the shared active indicator', () => {
    expect(usesSharedActiveIndicator('pixel-characters')).toBe(true);
    expect(usesSharedActiveIndicator('minimal-circles')).toBe(true);
    expect(usesSharedActiveIndicator('legacy')).toBe(false);
  });
});
