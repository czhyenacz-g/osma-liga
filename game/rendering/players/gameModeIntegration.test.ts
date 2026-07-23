import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', '..');

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

// The audit found exactly two rendering pipelines in this codebase:
//   - components/game/GameCanvas.tsx, shared by every single-player mode
//     (training/test-1, classic bot, bot-team, bounce, and /hra/bot-test's
//     mode switcher all funnel through MatchPageClient -> GameCanvas)
//   - components/online/OnlineGameCanvas.tsx, used by online multiplayer
//     (OnlineGameClient -> OnlineGameCanvas)
// This test proves both actually mount the shared PlayerRenderer (not a
// per-mode reimplementation), and that every entry-point page still routes
// through one of these two components — regressions here (e.g. a future
// page bypassing MatchPageClient/OnlineGameClient) would fail this test.
describe('every game mode renders through the shared PlayerRenderer', () => {
  it('GameCanvas.tsx (training / bot / bot-team / bounce / bot-test) mounts PlayerRenderer', () => {
    const source = read('components/game/GameCanvas.tsx');
    expect(source).toMatch(/from '@\/game\/rendering\/players\/PlayerRenderer'/);
    expect(source).toMatch(/<PlayerRenderer/);
  });

  it('OnlineGameCanvas.tsx (multiplayer) mounts PlayerRenderer', () => {
    const source = read('components/online/OnlineGameCanvas.tsx');
    expect(source).toMatch(/from '@\/game\/rendering\/players\/PlayerRenderer'/);
    expect(source).toMatch(/<PlayerRenderer/);
  });

  it('/hra/bot and /hra/bot-test both render through MatchPageClient -> GameCanvas', () => {
    expect(read('app/hra/bot/page.tsx')).toMatch(/MatchPageClient/);
    expect(read('app/hra/bot-test/BotTestClient.tsx')).toMatch(/MatchPageClient/);
    expect(read('components/game/MatchPageClient.tsx')).toMatch(/GameCanvas/);
  });

  it('all bot-test modes (training, bot, bot-team, bounce) share the same BotTestClient/MatchPageClient path', () => {
    const modes = read('app/hra/bot-test/botTestModes.ts');
    expect(modes).toMatch(/'test-1'/); // training (no opponent)
    expect(modes).toMatch(/'bot'/);
    expect(modes).toMatch(/'bot-team'/);
    expect(modes).toMatch(/'test-bounce'/);
    // No mode-specific renderer file exists — botTestModes.ts only maps to
    // ModeConfig (AI/duration/gameplay profile), never to a different
    // rendering component.
    expect(modes).not.toMatch(/GameCanvas|PlayerRenderer/);
  });

  it('multiplayer entry points (/hra/online, /hra/multiplayer) render through OnlineGameClient -> OnlineGameCanvas', () => {
    expect(read('app/hra/online/[code]/page.tsx')).toMatch(/OnlineGameClient/);
    expect(read('components/online/OnlineGameClient.tsx')).toMatch(/OnlineGameCanvas/);
  });

  it('both game canvases mount PlayerVisualTemplateSwitcher\'s host component (MatchPageClient/OnlineGameClient)', () => {
    expect(read('components/game/MatchPageClient.tsx')).toMatch(/PlayerVisualTemplateSwitcher/);
    expect(read('components/online/OnlineGameClient.tsx')).toMatch(/PlayerVisualTemplateSwitcher/);
  });
});
