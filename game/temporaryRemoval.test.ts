import { describe, it, expect } from 'vitest';
import { createInitialState } from './createInitialState';
import { updateTemporaryRemovals, getRemovedPlayerIds, DEFAULT_TEMPORARY_REMOVAL_CONFIG } from './temporaryRemoval';
import { updateGame } from './updateGame';
import { BENCH_SIDELINE_Y, getSidelineBenchSpot } from './benchSideline';
import { FIELD_CY, FIELD_B, MATCH_DURATION } from './constants';
import type { GameState, InputState } from './types';

// The random-substitution "temporary weakening" — same rules as before
// (trigger window, player choice, 10 s bench time), but the bench is now at
// the bottom touchline: the player walks off downwards and comes back on
// from below.

const DT = 1 / 60;

function noInput(): InputState {
  return { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
}

function triggerHomeRemoval(): { state: GameState; id: string } {
  const state = createInitialState(DEFAULT_TEMPORARY_REMOVAL_CONFIG);
  state.randomSubstitutionTriggerSecond = { home: 0, away: 999 };
  updateTemporaryRemovals(state, DT, DEFAULT_TEMPORARY_REMOVAL_CONFIG);
  expect(state.temporaryRemovals).toHaveLength(1);
  return { state, id: state.temporaryRemovals[0].playerId };
}

describe('temporary weakening — bottom-sideline bench', () => {
  it('the removed player walks DOWN off the pitch to its team\'s bench spot below the bottom line', () => {
    const { state, id } = triggerHomeRemoval();
    const p = state.players.find((x) => x.id === id)!;
    let prevY = p.pos.y;
    let guard = 0;
    while (state.temporaryRemovals[0]?.phase === 'leaving' && guard++ < 1000) {
      updateTemporaryRemovals(state, DT, DEFAULT_TEMPORARY_REMOVAL_CONFIG);
      expect(p.pos.y).toBeGreaterThanOrEqual(prevY - 1e-9);
      prevY = p.pos.y;
    }
    expect(state.temporaryRemovals[0].phase).toBe('bench');
    expect(p.pos.y).toBeGreaterThan(BENCH_SIDELINE_Y);
    const spot = getSidelineBenchSpot('home');
    expect(Math.hypot(p.pos.x - spot.x, p.pos.y - spot.y)).toBeLessThan(5);
  });

  it('sits out exactly benchDurationSeconds, then comes back on from below into its own half (bench side)', () => {
    const { state, id } = triggerHomeRemoval();
    const p = state.players.find((x) => x.id === id)!;
    while (state.temporaryRemovals[0].phase === 'leaving') updateTemporaryRemovals(state, DT, DEFAULT_TEMPORARY_REMOVAL_CONFIG);
    let benchTicks = 0;
    while (state.temporaryRemovals[0].phase === 'bench') {
      updateTemporaryRemovals(state, DT, DEFAULT_TEMPORARY_REMOVAL_CONFIG);
      benchTicks++;
    }
    expect(benchTicks * DT).toBeCloseTo(DEFAULT_TEMPORARY_REMOVAL_CONFIG.benchDurationSeconds, 1);

    const ret = state.temporaryRemovals[0].returnPosition;
    expect(ret.y).toBeGreaterThan(FIELD_CY);
    expect(ret.y).toBeLessThan(FIELD_B);
    // Walk back on: strictly upward from the bench line, at the old walk length.
    const startY = p.pos.y;
    // (the bench spot is reached within the 4px arrival threshold)
    expect(Math.abs((startY - ret.y) - (BENCH_SIDELINE_Y + 18 - (FIELD_CY + FIELD_B) / 2))).toBeLessThan(5);
    let prevY = p.pos.y;
    while (state.temporaryRemovals.length) {
      updateTemporaryRemovals(state, DT, DEFAULT_TEMPORARY_REMOVAL_CONFIG);
      expect(p.pos.y).toBeLessThanOrEqual(prevY + 1e-9);
      prevY = p.pos.y;
    }
    expect(p.pos.y).toBeLessThan(BENCH_SIDELINE_Y);
  });

  it('the removed player is never the active player while off, and play continues', () => {
    let state = createInitialState(DEFAULT_TEMPORARY_REMOVAL_CONFIG);
    state.randomSubstitutionTriggerSecond = { home: 0, away: 0 };
    for (let i = 0; i < 600 && state.phase !== 'ended'; i++) {
      state = updateGame(state, noInput(), DT);
      const removed = getRemovedPlayerIds(state);
      expect(removed.has(state.activePlayerId)).toBe(false);
    }
    expect(state.timeLeft).toBeLessThan(MATCH_DURATION);
  });
});
