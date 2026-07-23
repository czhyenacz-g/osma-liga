// Player visual template — a purely local, cosmetic presentation choice.
// Never sent over the network, never stored in GameState/OnlineSnapshot, and
// never read by game physics/AI/scoring. See playerVisualSettings.ts for
// persistence and game/rendering/players/ for the renderer that consumes it.
export type PlayerVisualTemplate = 'pixel-characters' | 'minimal-circles' | 'legacy';

// New installs and unreadable/legacy-invalid stored values both fall back
// here — pixel-characters is the product default per spec.
export const DEFAULT_PLAYER_VISUAL_TEMPLATE: PlayerVisualTemplate = 'pixel-characters';

const VALID_TEMPLATES: readonly PlayerVisualTemplate[] = ['pixel-characters', 'minimal-circles', 'legacy'];

// Normalizes any input (untrusted localStorage content, a stale value from
// an older build, etc.) to a valid template, defaulting safely instead of
// throwing or rendering nothing.
export function normalizePlayerVisualTemplate(value: unknown): PlayerVisualTemplate {
  if (typeof value === 'string' && (VALID_TEMPLATES as readonly string[]).includes(value)) {
    return value as PlayerVisualTemplate;
  }
  return DEFAULT_PLAYER_VISUAL_TEMPLATE;
}
