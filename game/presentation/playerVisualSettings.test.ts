import { describe, it, expect, beforeEach, vi } from 'vitest';

const STORAGE_KEY = 'osmaliga.playerVisualTemplate';

// The module seeds its `current` value once at import time from
// localStorage, so each test that cares about a specific starting value
// needs a fresh module instance (vi.resetModules + dynamic import) after
// priming localStorage — mirrors how the real app only reads localStorage
// once per page load too.
async function freshSettingsModule() {
  vi.resetModules();
  return import('./playerVisualSettings');
}

describe('playerVisualSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to svg-footballers-v5 with no stored value (new install)', async () => {
    const { getPlayerVisualTemplate } = await freshSettingsModule();
    expect(getPlayerVisualTemplate()).toBe('svg-footballers-v5');
  });

  it('loads a previously stored minimal-circles value', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'minimal-circles');
    const { getPlayerVisualTemplate } = await freshSettingsModule();
    expect(getPlayerVisualTemplate()).toBe('minimal-circles');
  });

  it.each(['svg-footballers-v4', 'minimal-circles', 'pixel-characters'])(
    'keeps a previously stored %s choice (the v5 default never overrides it)',
    async (stored) => {
      window.localStorage.setItem(STORAGE_KEY, stored);
      const { getPlayerVisualTemplate } = await freshSettingsModule();
      expect(getPlayerVisualTemplate()).toBe(stored);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe(stored);
    },
  );

  it('loads a previously stored legacy value', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'legacy');
    const { getPlayerVisualTemplate } = await freshSettingsModule();
    expect(getPlayerVisualTemplate()).toBe('legacy');
  });

  it('falls back to svg-footballers-v5 for an invalid/stale stored value', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'circle-players-v1'); // pretend old build's key
    const { getPlayerVisualTemplate } = await freshSettingsModule();
    expect(getPlayerVisualTemplate()).toBe('svg-footballers-v5');
  });

  it('persists the choice across a simulated reload', async () => {
    const { setPlayerVisualTemplate } = await freshSettingsModule();
    setPlayerVisualTemplate('minimal-circles');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('minimal-circles');

    const { getPlayerVisualTemplate: getAfterReload } = await freshSettingsModule();
    expect(getAfterReload()).toBe('minimal-circles');
  });

  it('notifies listeners on change and stops after unsubscribe', async () => {
    const { setPlayerVisualTemplate, onPlayerVisualTemplateChange } = await freshSettingsModule();
    const seen: string[] = [];
    const unsubscribe = onPlayerVisualTemplateChange((t) => seen.push(t));

    setPlayerVisualTemplate('legacy');
    expect(seen).toEqual(['legacy']);

    unsubscribe();
    setPlayerVisualTemplate('pixel-characters');
    expect(seen).toEqual(['legacy']); // no further notifications
  });

  it('normalizes an invalid value passed directly to setPlayerVisualTemplate', async () => {
    const { setPlayerVisualTemplate, getPlayerVisualTemplate } = await freshSettingsModule();
    // @ts-expect-error deliberately passing an invalid value to prove the setter also normalizes
    setPlayerVisualTemplate('not-a-real-template');
    expect(getPlayerVisualTemplate()).toBe('svg-footballers-v5');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('svg-footballers-v5');
  });
});
