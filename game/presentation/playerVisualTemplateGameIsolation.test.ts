import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createInitialState } from '../createInitialState';
import { updateGame } from '../updateGame';
import type { InputState } from '../types';
import { setPlayerVisualTemplate, getPlayerVisualTemplate } from './playerVisualSettings';

function noInput(): InputState {
  return { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
}

// Proves the presentation switch is truly isolated from game state: running
// ticks, switching the visual template mid-match, then running more ticks
// must not restart the match, reset the score, change the active player, or
// move anyone — the score/positions/active player only ever change because
// of updateGame() itself, never because of a template switch.
describe('player visual template switch does not affect game state', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('leaves score, activePlayerId, and player positions untouched by a template switch', () => {
    let state = createInitialState();
    const input = { ...noInput(), right: true };
    const dt = 0.05;

    for (let i = 0; i < 20; i++) {
      state = updateGame(state, input, dt);
    }

    const scoreBefore = { ...state.score };
    const activeBefore = state.activePlayerId;
    const positionsBefore = state.players.map((p) => ({ id: p.id, x: p.pos.x, y: p.pos.y }));
    const phaseBefore = state.phase;
    const timeLeftBefore = state.timeLeft;

    // The actual template switch under test.
    setPlayerVisualTemplate('minimal-circles');
    expect(getPlayerVisualTemplate()).toBe('minimal-circles');

    // Continue ticking with the SAME input (no restart) — if the switch had
    // any side effect on game state, it would show up as a discontinuity
    // right here (e.g. positions snapping back, score resetting).
    for (let i = 0; i < 5; i++) {
      state = updateGame(state, input, dt);
    }

    expect(state.score).toEqual(scoreBefore);
    expect(state.phase).toBe(phaseBefore);
    // timeLeft only ever decreases by dt*ticks — continuity check, not equality.
    expect(state.timeLeft).toBeLessThan(timeLeftBefore);
    expect(state.timeLeft).toBeGreaterThan(timeLeftBefore - 5 * dt - 1e-6);

    // Active player and positions are free to keep evolving normally after
    // the switch (input is still held) — the assertion is that they moved
    // by ordinary physics, not that a template switch reset them to the
    // initial spawn state.
    const activeAfter = state.activePlayerId;
    const positionsAfter = state.players.map((p) => ({ id: p.id, x: p.pos.x, y: p.pos.y }));
    expect(activeAfter).toBe(activeBefore); // held input, no reason for auto-switch here
    const n1Before = positionsBefore.find((p) => p.id === 'n1')!;
    const n1After = positionsAfter.find((p) => p.id === 'n1')!;
    expect(n1After.x).not.toBe(0); // never reset to a fresh spawn
    expect(n1After.x).toBeGreaterThan(n1Before.x); // kept moving right, as expected
  });

  it('updateGame.ts and its physics/AI modules never import the presentation layer', () => {
    // Structural proof that the engine has zero dependency on visual
    // templates/settings — not just "happens to produce the same output",
    // which the bot engine's own AI/support-positioning randomness (nothing
    // to do with this task) would make a flaky thing to assert dynamically.
    const engineFiles = ['updateGame.ts', 'physics.ts', 'ai.ts', 'createInitialState.ts'];
    for (const file of engineFiles) {
      const source = readFileSync(join(__dirname, '..', file), 'utf8');
      expect(source).not.toMatch(/presentation\/player|rendering\/players/);
    }
  });

  it('running the same input twice from a fresh state is unaffected by whichever template is currently selected', () => {
    setPlayerVisualTemplate('legacy');
    let stateA = createInitialState();
    const input = { ...noInput(), right: true };
    for (let i = 0; i < 10; i++) stateA = updateGame(stateA, input, 0.05);
    const afterLegacy = { x: stateA.players[0].pos.x, activePlayerId: stateA.activePlayerId };

    setPlayerVisualTemplate('minimal-circles');
    let stateB = createInitialState();
    for (let i = 0; i < 10; i++) stateB = updateGame(stateB, input, 0.05);
    const afterCircles = { x: stateB.players[0].pos.x, activePlayerId: stateB.activePlayerId };

    // The home player's own movement (driven purely by held input, no AI/
    // randomness involved for the human-controlled side) is identical
    // regardless of which template was active while ticking.
    expect(afterCircles.x).toBe(afterLegacy.x);
    expect(afterCircles.activePlayerId).toBe(afterLegacy.activePlayerId);
  });
});
