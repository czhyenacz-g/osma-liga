import type { PlayerVisualTemplate } from '../../presentation/playerVisualTemplate';
import { DEFAULT_PLAYER_VISUAL_TEMPLATE } from '../../presentation/playerVisualTemplate';
import PixelCharacterPlayer from './templates/PixelCharacterPlayer';
import MinimalCirclePlayer from './templates/MinimalCirclePlayer';
import LegacyPlayerVisual from './templates/LegacyPlayerVisual';
import type { PlayerVisualComponentProps } from './playerVisualTypes';

// Central template lookup — the only place that maps a PlayerVisualTemplate
// to its component. No growing switch statements scattered around the
// codebase; add a new template by adding one entry here.
export const playerVisualRegistry: Record<PlayerVisualTemplate, React.ComponentType<PlayerVisualComponentProps>> = {
  'pixel-characters': PixelCharacterPlayer,
  'minimal-circles': MinimalCirclePlayer,
  legacy: LegacyPlayerVisual,
};

// Looks up a template, falling back to the default (pixel-characters) for
// any unknown/missing key — mirrors normalizePlayerVisualTemplate's fallback
// so a bad value can never fail to render.
export function resolvePlayerVisualComponent(
  template: PlayerVisualTemplate,
): React.ComponentType<PlayerVisualComponentProps> {
  return playerVisualRegistry[template] ?? playerVisualRegistry[DEFAULT_PLAYER_VISUAL_TEMPLATE];
}

// Templates whose active-player feedback (ring shape/position, growth) is
// fully self-contained and imperative (see LegacyPlayerVisual) rather than
// driven by the shared ActivePlayerRing + animation-wrapper charge-scale.
export function usesSharedActiveIndicator(template: PlayerVisualTemplate): boolean {
  return template !== 'legacy';
}
