import { describe, it, expect } from 'vitest';
import { resolveBenchUiState, type BenchCandidate } from './benchUi';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import { deployBenchPlayer, computeBenchRoleTarget, chooseBotBenchRole } from './benchDeployment';
import { BENCH_DEPLOY_DURATION_MS, MATCH_DURATION, FIELD_L, FIELD_R, FIELD_CX, SUPPORT_PLAYER_SPEED } from './constants';
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
        benchRole: p.benchRole ?? null,
      })),
  );
}

describe('resolveBenchUiState', () => {
  it('maps the existing data model onto ready / active / used', () => {
    expect(resolveBenchUiState([{ id: 'b', label: 'B1', matchStatus: 'bench', benchUsed: false }])?.phase).toBe('ready');
    expect(
      resolveBenchUiState([{ id: 'b', label: 'B1', matchStatus: 'temporarily_deployed', benchUsed: true, remainingMs: 23_400, benchRole: 'defender' }]),
    ).toEqual({ playerId: 'b', label: 'B1', phase: 'active', remainingMs: 23_400, role: 'defender' });
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

describe('žolík role — where a deployed substitute plays when it is not the controlled player', () => {
  const dt = 1 / 60;

  function deployedHomeSub(role: 'attacker' | 'defender') {
    const state = createInitialState();
    const sub = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    expect(deployBenchPlayer(state, 'home', sub.id, role)).toBe(true);
    expect(sub.benchRole).toBe(role);
    return { state, sub };
  }

  it('attacker heads forward into the opponent half (no longer stands still)', () => {
    let { state, sub } = deployedHomeSub('attacker');
    const start = { ...sub.pos };
    for (let i = 0; i < 180; i++) state = updateGame(state, noInput(), dt); // 3 s
    sub = state.players.find((p) => p.id === sub.id)!;
    expect(state.activePlayerId).not.toBe(sub.id);
    expect(Math.hypot(sub.pos.x - start.x, sub.pos.y - start.y)).toBeGreaterThan(150);
    expect(sub.pos.x).toBeGreaterThan(FIELD_CX - 40);
  });

  it('defender drops into its own half in front of its goal', () => {
    // (The ball-relative side of the target is covered by the mirror test —
    // here the bot may already have pushed the ball deep, so only the zone.)
    let { state, sub } = deployedHomeSub('defender');
    for (let i = 0; i < 180; i++) state = updateGame(state, noInput(), dt);
    sub = state.players.find((p) => p.id === sub.id)!;
    expect(sub.pos.x).toBeLessThan(FIELD_CX);
    expect(sub.pos.x).toBeGreaterThan(FIELD_L + 60);
  });

  it('moves at the normal support speed, not faster', () => {
    const { state, sub } = deployedHomeSub('attacker');
    const before = { ...sub.pos };
    updateGame(state, noInput(), dt);
    // separateSameTeamPlayers can add a small push; never a speed boost beyond it.
    expect(Math.hypot(sub.pos.x - before.x, sub.pos.y - before.y)).toBeLessThanOrEqual(SUPPORT_PLAYER_SPEED * dt + 2);
  });

  it('role targets mirror for the away team and stay inside the pitch', () => {
    const ball = { x: 480, y: 280 };
    const homeAtt = computeBenchRoleTarget('home', 'attacker', ball);
    const awayAtt = computeBenchRoleTarget('away', 'attacker', ball);
    const homeDef = computeBenchRoleTarget('home', 'defender', ball);
    const awayDef = computeBenchRoleTarget('away', 'defender', ball);
    expect(homeAtt.x).toBeGreaterThan(ball.x);
    expect(awayAtt.x).toBeLessThan(ball.x);
    expect(homeDef.x).toBeLessThan(ball.x);
    expect(awayDef.x).toBeGreaterThan(ball.x);
    for (const t of [homeAtt, awayAtt, homeDef, awayDef]) {
      expect(t.x).toBeGreaterThan(FIELD_L);
      expect(t.x).toBeLessThan(FIELD_R);
    }
  });

  it('the bot calls its žolík up as attacker when level/behind, defender when leading', () => {
    const state = createInitialState();
    expect(chooseBotBenchRole(state, 'away')).toBe('attacker');
    state.score = { home: 2, away: 1 };
    expect(chooseBotBenchRole(state, 'away')).toBe('attacker');
    state.score = { home: 0, away: 1 };
    expect(chooseBotBenchRole(state, 'away')).toBe('defender');
  });

  it('the bot\'s deployed substitute moves to its role position', () => {
    let state = createInitialState();
    const sub = state.players.find((p) => p.team === 'away' && p.matchStatus === 'bench')!;
    deployBenchPlayer(state, 'away', sub.id, 'attacker');
    const start = { ...sub.pos };
    for (let i = 0; i < 180; i++) state = updateGame(state, noInput(), dt);
    const after = state.players.find((p) => p.id === sub.id)!;
    expect(Math.hypot(after.pos.x - start.x, after.pos.y - start.y)).toBeGreaterThan(100);
  });
});
