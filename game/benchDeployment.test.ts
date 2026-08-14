import { describe, it, expect } from 'vitest';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import {
  canDeployFromBench, isSelectableFieldPlayer, deployBenchPlayer, updateBenchDeployments,
} from './benchDeployment';
import { DEFAULT_BENCH_SIZE, BENCH_DEPLOY_DURATION_MS } from './constants';
import type { InputState } from './types';

function noInput(): InputState {
  return { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
}

describe('bench — data model / default size', () => {
  it('default bench size is 1', () => {
    expect(DEFAULT_BENCH_SIZE).toBe(1);
  });

  it('createInitialState() produces exactly 1 bench player per team by default', () => {
    const state = createInitialState();
    const homeBench = state.players.filter((p) => p.team === 'home' && p.matchStatus === 'bench');
    const awayBench = state.players.filter((p) => p.team === 'away' && p.matchStatus === 'bench');
    expect(homeBench).toHaveLength(1);
    expect(awayBench).toHaveLength(1);
    expect(state.players).toHaveLength(10);
    expect(state.benchDeployments).toEqual([]);
  });

  it('engine works with bench size 0 — no bench players, updateGame/updateBenchDeployments never crash', () => {
    const state = createInitialState(undefined, undefined, undefined, 0);
    expect(state.players.filter((p) => p.matchStatus === 'bench')).toHaveLength(0);
    expect(() => updateBenchDeployments(state, 1 / 60)).not.toThrow();
    expect(() => updateGame(state, noInput(), 1 / 60)).not.toThrow();
  });

  it('engine works with 3 bench players per team', () => {
    const state = createInitialState(undefined, undefined, undefined, 3);
    expect(state.players.filter((p) => p.team === 'home' && p.matchStatus === 'bench')).toHaveLength(3);
    expect(state.players.filter((p) => p.team === 'away' && p.matchStatus === 'bench')).toHaveLength(3);
    expect(() => updateGame(state, noInput(), 1 / 60)).not.toThrow();
  });

  it('engine works with 5 bench players per team', () => {
    const state = createInitialState(undefined, undefined, undefined, 5);
    expect(state.players.filter((p) => p.team === 'home' && p.matchStatus === 'bench')).toHaveLength(5);
    expect(() => updateGame(state, noInput(), 1 / 60)).not.toThrow();
  });
});

describe('bench — active-pool exclusion', () => {
  it('a bench player is NOT included in the selectable pool before activation', () => {
    const state = createInitialState();
    const bench = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    expect(isSelectableFieldPlayer(bench, new Set())).toBe(false);
    const homePlayers = state.players.filter((p) => p.team === 'home' && isSelectableFieldPlayer(p, new Set()));
    expect(homePlayers.map((p) => p.id)).not.toContain(bench.id);
    expect(homePlayers).toHaveLength(3);
  });
});

describe('bench — deployBenchPlayer', () => {
  it('activates the correct player by ID, not "first field player"', () => {
    const state = createInitialState(undefined, undefined, undefined, 2);
    const target = state.players.find((p) => p.id === 'n-bench-1')!;
    const ok = deployBenchPlayer(state, 'home', 'n-bench-1');
    expect(ok).toBe(true);
    expect(target.matchStatus).toBe('temporarily_deployed');
    const other = state.players.find((p) => p.id === 'n-bench-0')!;
    expect(other.matchStatus).toBe('bench');
  });

  it('after deploy, matchStatus becomes temporarily_deployed and is included in the selectable pool', () => {
    const state = createInitialState();
    const bench = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(state, 'home', bench.id);
    expect(bench.matchStatus).toBe('temporarily_deployed');
    expect(isSelectableFieldPlayer(bench, new Set())).toBe(true);
  });

  it('the deployed player keeps its own real stats (not a simplified stand-in)', () => {
    const state = createInitialState();
    const bench = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(state, 'home', bench.id);
    expect(bench.stats).toBeDefined();
    expect(typeof bench.stats.speed).toBe('number');
    expect(typeof bench.stats.shotPower).toBe('number');
    expect(typeof bench.stats.stoppingPower).toBe('number');
  });

  it('deploy duration is exactly BENCH_DEPLOY_DURATION_MS', () => {
    expect(BENCH_DEPLOY_DURATION_MS).toBe(30000);
    const state = createInitialState();
    const bench = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(state, 'home', bench.id);
    const deployment = state.benchDeployments.find((d) => d.playerId === bench.id);
    expect(deployment?.remainingMs).toBe(BENCH_DEPLOY_DURATION_MS);
  });

  it('after updateBenchDeployments ticks past the duration, the player reverts to bench', () => {
    const state = createInitialState();
    const bench = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(state, 'home', bench.id);
    updateBenchDeployments(state, BENCH_DEPLOY_DURATION_MS / 1000 + 1);
    expect(bench.matchStatus).toBe('bench');
    expect(state.benchDeployments).toHaveLength(0);
  });

  it('once benchUsed is true, canDeployFromBench/deployBenchPlayer reject reactivating that player', () => {
    const state = createInitialState();
    const bench = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(state, 'home', bench.id);
    updateBenchDeployments(state, BENCH_DEPLOY_DURATION_MS / 1000 + 1);
    expect(bench.matchStatus).toBe('bench');
    expect(bench.benchUsed).toBe(true);
    expect(canDeployFromBench(state, bench)).toBe(false);
    expect(deployBenchPlayer(state, 'home', bench.id)).toBe(false);
  });

  it('the same player cannot be deployed twice concurrently', () => {
    const state = createInitialState();
    const bench = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    expect(deployBenchPlayer(state, 'home', bench.id)).toBe(true);
    expect(deployBenchPlayer(state, 'home', bench.id)).toBe(false);
    expect(state.benchDeployments).toHaveLength(1);
  });

  it('goalkeeper is rejected by canDeployFromBench', () => {
    const state = createInitialState();
    const gk = state.players.find((p) => p.team === 'home' && p.role === 'goalkeeper')!;
    expect(canDeployFromBench(state, gk)).toBe(false);
    expect(deployBenchPlayer(state, 'home', gk.id)).toBe(false);
  });
});

describe('bench — coexistence with random-substitution removal + active-player safety', () => {
  it('rejects deploying a player currently in state.temporaryRemovals', () => {
    const state = createInitialState();
    const fieldPlayer = state.players.find((p) => p.team === 'home' && p.matchStatus === 'field' && p.role === 'field_player')!;
    fieldPlayer.matchStatus = 'bench'; // simulate a would-be-eligible bench slot for the test
    state.temporaryRemovals.push({
      playerId: fieldPlayer.id,
      team: 'home',
      reason: 'randomSubstitution',
      phase: 'bench',
      remainingSeconds: 5,
      benchDurationSeconds: 10,
      returnPosition: { x: 0, y: 0 },
    });
    expect(deployBenchPlayer(state, 'home', fieldPlayer.id)).toBe(false);
  });

  it('when an active temporarily-deployed player expires, active-player selection safely picks another valid player', () => {
    const state = createInitialState();
    const bench = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(state, 'home', bench.id);
    state.manualActivePlayerId = bench.id;
    state.manualLockRemaining = 5;
    state.autoActivePlayerId = bench.id;

    updateBenchDeployments(state, BENCH_DEPLOY_DURATION_MS / 1000 + 1);
    expect(bench.matchStatus).toBe('bench');

    expect(() => updateGame(state, noInput(), 1 / 60)).not.toThrow();
    const activeId = state.activePlayerId;
    const active = state.players.find((p) => p.id === activeId)!;
    expect(isSelectableFieldPlayer(active, new Set())).toBe(true);
    expect(active.id).not.toBe(bench.id);
  });
});

describe('bench — reset behavior', () => {
  it('a new match resets bench players to unused/on-bench with no leftover deployments', () => {
    const state1 = createInitialState();
    const bench1 = state1.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(state1, 'home', bench1.id);
    expect(state1.benchDeployments).toHaveLength(1);

    const state2 = createInitialState();
    expect(state2.benchDeployments).toEqual([]);
    const bench2 = state2.players.filter((p) => p.matchStatus === 'bench');
    expect(bench2.every((p) => !p.benchUsed)).toBe(true);
  });

  it('goal reset does not break with an active temporarily-deployed player, and preserves their deployment', () => {
    const state = createInitialState();
    const bench = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(state, 'home', bench.id);

    state.ball.pos = { x: 895, y: 280 };
    state.phase = 'playing';
    const afterGoal = updateGame(state, noInput(), 1 / 60);
    expect(afterGoal.phase).toBe('goal');
    expect(bench.matchStatus).toBe('temporarily_deployed');

    afterGoal.goalTimer = 0;
    const afterReset = updateGame(afterGoal, noInput(), 1 / 60);
    expect(afterReset.phase).toBe('playing');

    const resetBenchPlayer = afterReset.players.find((p) => p.id === bench.id)!;
    // Still temporarily deployed (not permanently converted to a field
    // player, not wiped back to bench) and still tracked in benchDeployments.
    expect(resetBenchPlayer.matchStatus).toBe('temporarily_deployed');
    expect(afterReset.benchDeployments.find((d) => d.playerId === bench.id)).toBeDefined();
  });
});
