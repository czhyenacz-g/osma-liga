import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { setPlayerVisualTemplate } from './playerVisualSettings';
import { resolveOnlinePlayerRenderStates, createFacingDirectionTracker } from '../rendering/players/resolvePlayerRenderState';

// Proves a local template switch can never turn into a network/socket
// event — the switch only ever writes to localStorage.
describe('player visual template switch is invisible to multiplayer', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('does not call fetch or construct a WebSocket when switching templates', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as never).mockImplementation(() => {
      throw new Error('fetch should never be called by a visual template switch');
    });
    const originalWebSocket = globalThis.WebSocket;
    class ThrowingWebSocket {
      constructor() {
        throw new Error('WebSocket should never be constructed by a visual template switch');
      }
    }
    // @ts-expect-error test double
    globalThis.WebSocket = ThrowingWebSocket;

    expect(() => {
      setPlayerVisualTemplate('minimal-circles');
      setPlayerVisualTemplate('legacy');
      setPlayerVisualTemplate('pixel-characters');
    }).not.toThrow();

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    globalThis.WebSocket = originalWebSocket;
  });

  it('playerVisualSettings.ts has no import of socket.io-client or any online-game module', () => {
    const source = readFileSync(join(__dirname, 'playerVisualSettings.ts'), 'utf8');
    expect(source).not.toMatch(/socket\.io|useOnlineGame|OnlineGameClient/);
  });

  it('the online snapshot -> render-state adapter only reads data, never emits anything', () => {
    const source = readFileSync(
      join(__dirname, '..', 'rendering', 'players', 'resolvePlayerRenderState.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/socket\.emit|\.send\(|new WebSocket/);
  });

  it('resolveOnlinePlayerRenderStates output is identical regardless of the locally selected template', () => {
    const players = [
      { id: 'h1', team: 'home' as const, label: 'H1', rx: 300, ry: 200, pvx: 5, pvy: 0, active: true, removed: false },
      { id: 'a1', team: 'away' as const, label: 'A1', rx: 600, ry: 300, pvx: 0, pvy: 0, active: false, removed: false },
    ];

    setPlayerVisualTemplate('legacy');
    const tracker1 = createFacingDirectionTracker();
    const withLegacySelected = resolveOnlinePlayerRenderStates(players, { x: 480, y: 280 }, 'home', 0.4, tracker1);

    setPlayerVisualTemplate('minimal-circles');
    const tracker2 = createFacingDirectionTracker();
    const withCirclesSelected = resolveOnlinePlayerRenderStates(players, { x: 480, y: 280 }, 'home', 0.4, tracker2);

    // The resolved server-derived render state (positions, active flags,
    // charge) must be identical — the locally selected template never
    // influences what data the shared snapshot->render-state mapping
    // produces, only which component later draws it.
    expect(withLegacySelected).toEqual(withCirclesSelected);
  });
});
