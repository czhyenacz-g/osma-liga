import {
  DEFAULT_PLAYER_VISUAL_TEMPLATE,
  normalizePlayerVisualTemplate,
  type PlayerVisualTemplate,
} from './playerVisualTemplate';

// Local presentation preference only — mirrors the existing sound-mute
// persistence pattern (lib/audio/whistleEngine.ts): a module-level value
// seeded once from localStorage (guarded for SSR/tests where `window` is
// absent), exposed via get/set + a listener set so any mounted switcher
// stays in sync even if rendered on more than one page at once. This is
// never wired into GameState/OnlineSnapshot or any network call.
const STORAGE_KEY = 'osmaliga.playerVisualTemplate';

function readStoredTemplate(): PlayerVisualTemplate {
  if (typeof window === 'undefined') return DEFAULT_PLAYER_VISUAL_TEMPLATE;
  try {
    return normalizePlayerVisualTemplate(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private browsing / storage disabled / not available in this environment.
    return DEFAULT_PLAYER_VISUAL_TEMPLATE;
  }
}

let current: PlayerVisualTemplate = readStoredTemplate();

const listeners = new Set<(template: PlayerVisualTemplate) => void>();

export function getPlayerVisualTemplate(): PlayerVisualTemplate {
  return current;
}

export function setPlayerVisualTemplate(value: PlayerVisualTemplate): void {
  const normalized = normalizePlayerVisualTemplate(value);
  current = normalized;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // ignore — preference just won't survive a reload this session
    }
  }
  listeners.forEach((listener) => listener(current));
}

export function onPlayerVisualTemplateChange(listener: (template: PlayerVisualTemplate) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Test-only helper: re-reads from localStorage. Production code never needs
// this (the module-level `current` is always authoritative after load), but
// tests that mutate localStorage directly need a way to force a re-read
// without reimporting the module.
export function _reloadFromStorageForTests(): PlayerVisualTemplate {
  current = readStoredTemplate();
  return current;
}
