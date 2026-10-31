import { describe, it, expect } from 'vitest';
import { resolveBenchUiState, type BenchCandidate } from './benchUi';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import { deployBenchPlayer } from './benchDeployment';
import { BENCH_DEPLOY_DURATION_MS, MATCH_DURATION } from './constants';
import type { GameState, InputState, Team } from './types';

function noInput(): InputState {
  return { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
}

// Same mapping GameCanvas → MatchPageClient uses for the local engine.
function localBench(state: GameState, team: Team) {
  return resolveBenchUiState(
    state.players
      .filter((p) => p.team === team && p.role === 'field_player')
      .map((p): BenchCandidate => ({
        id: p.id,
        label: p.label,
        matchStatus: p.matchStatus,
        benchUsed: p.benchUsed,
        remainingMs: state.benchDeployments.find((d) => d.playerId === p.id)?.remainingMs ?? null,
      })),
  );
}

describe('resolveBenchUiState', () => {
  it('maps the existing data model onto ready / active / used', () => {
    expect(resolveBenchUiState([{ id: 'b', label: 'B1', matchStatus: 'bench', benchUsed: false }])?.phase).toBe('ready');
    expect(
      resolveBenchUiState([{ id: 'b', label: 'B1', matchStatus: 'temporarily_deployed', benchUsed: true, remainingMs: 23_400 }]),
    ).toEqual({ playerId: 'b', label: 'B1', phase: 'active', remainingMs: 23_400 });
    expect(resolveBenchUiState([{ id: 'b', label: 'B1', matchStatus: 'bench', benchUsed: true }])?.phase).toBe('used');
  });

  it('ignores field players and returns null without a bench (old backend snapshot)', () => {
    expect(resolveBenchUiState([{ id: 'p', label: 'P1', matchStatus: 'field' }])).toBeNull();
    expect(resolveBenchUiState([{ id: 'p', label: 'P1' }])).toBeNull();
  });
});

describe('local bot game — bench lifecycle through the real engine', () => {
  it('READY → manual activation → ACTIVE for 30 s → USED, second activation rejected', () => {
    let state = createInitialState();
    const ready = localBench(state, 'home')!;
    expect(ready.phase).toBe('ready');

    expect(deployBenchPlayer(state, 'home', ready.playerId)).toBe(true);
    // Double click / repeated request in the same frame does nothing more.
    expect(deployBenchPlayer(state, 'home', ready.playerId)).toBe(false);
    expect(state.benchDeployments).toHaveLength(1);

    const active = localBench(state, 'home')!;
    expect(active.phase).toBe('active');
    expect(active.remainingMs).toBe(BENCH_DEPLOY_DURATION_MS);

    // Just before the end it is still on the pitch.
    const dt = 1 / 60;
    const ticks = Math.round((BENCH_DEPLOY_DURATION_MS / 1000) / dt);
    for (let i = 0; i < ticks - 5; i++) state = updateGame(state, noInput(), dt);
    expect(localBench(state, 'home')!.phase).toBe('active');

    for (let i = 0; i < 20; i++) state = updateGame(state, noInput(), dt);
    const used = localBench(state, 'home')!;
    expect(used.phase).toBe('used');
    expect(state.players.find((p) => p.id === used.playerId)!.matchStatus).toBe('bench');
    expect(state.activePlayerId).not.toBe(used.playerId);

    expect(deployBenchPlayer(state, 'home', used.playerId)).toBe(false);
    expect(localBench(state, 'home')!.phase).toBe('used');
  });

  it('the bot\'s automatic bench deploy (after half-time) leaves the human\'s bench ready', () => {
    let state = createInitialState();
    const dt = 1 / 60;
    const ticks = Math.ceil((MATCH_DURATION / 2 + 1) / dt);
    for (let i = 0; i < ticks && state.phase !== 'ended'; i++) {
      state = updateGame(state, noInput(), dt);
      // Skip goal pauses quickly — irrelevant here.
      if (state.phase === 'goal') state.goalTimer = 0;
    }
    expect(localBench(state, 'away')!.phase).not.toBe('ready');
    expect(localBench(state, 'home')!.phase).toBe('ready');
  });
});
