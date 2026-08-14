import { describe, it, expect } from 'vitest';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import { updateGoalkeepers, getGoalkeeperZone } from './goalkeeperAI';
import { resolvePlayerBallCollisions } from './physics';
import {
  FIELD_L, FIELD_R, FIELD_CY, GOALKEEPER_BALL_DAMPING, BUMP_FORCE, GOALKEEPER_BUMP_FORCE,
} from './constants';
import type { InputState } from './types';

function noInput(): InputState {
  return { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
}

describe('goalkeeper — data model', () => {
  it('each team has exactly one goalkeeper, not counted among the 3 on-pitch field players', () => {
    const state = createInitialState();
    const homeGKs = state.players.filter((p) => p.team === 'home' && p.role === 'goalkeeper');
    const awayGKs = state.players.filter((p) => p.team === 'away' && p.role === 'goalkeeper');
    // On-pitch field players only — role 'field_player' also matches bench
    // players (see benchDeployment.ts / game/types.ts PlayerMatchStatus),
    // so this must additionally filter by matchStatus.
    const homeFieldPlayers = state.players.filter(
      (p) => p.team === 'home' && p.role === 'field_player' && p.matchStatus === 'field',
    );
    const awayFieldPlayers = state.players.filter(
      (p) => p.team === 'away' && p.role === 'field_player' && p.matchStatus === 'field',
    );
    expect(homeGKs).toHaveLength(1);
    expect(awayGKs).toHaveLength(1);
    expect(homeFieldPlayers).toHaveLength(3);
    expect(awayFieldPlayers).toHaveLength(3);
    // 3 field + 1 GK per team + 1 bench per team (DEFAULT_BENCH_SIZE) = 10.
    expect(state.players).toHaveLength(10);
  });

  it('goalkeepers start inside their own zone, near their own goal', () => {
    const state = createInitialState();
    const homeGK = state.players.find((p) => p.team === 'home' && p.role === 'goalkeeper')!;
    const awayGK = state.players.find((p) => p.team === 'away' && p.role === 'goalkeeper')!;
    expect(homeGK.pos.x).toBeLessThan(FIELD_R / 2);
    expect(awayGK.pos.x).toBeGreaterThan(FIELD_L + (FIELD_R - FIELD_L) / 2);
    const homeZone = getGoalkeeperZone('home');
    const awayZone = getGoalkeeperZone('away');
    expect(homeGK.pos.x).toBeGreaterThanOrEqual(homeZone.xMin);
    expect(homeGK.pos.x).toBeLessThanOrEqual(homeZone.xMax);
    expect(awayGK.pos.x).toBeGreaterThanOrEqual(awayZone.xMin);
    expect(awayGK.pos.x).toBeLessThanOrEqual(awayZone.xMax);
  });
});

describe('goalkeeper — zone clamp', () => {
  it('never leaves its zone even while chasing a distant ball, over many ticks', () => {
    const state = createInitialState();
    state.ball.pos = { x: FIELD_R - 5, y: 20 }; // far from the home GK, near the opposite corner
    for (let i = 0; i < 300; i++) {
      updateGoalkeepers(state, 1 / 60);
    }
    const homeGK = state.players.find((p) => p.team === 'home' && p.role === 'goalkeeper')!;
    const zone = getGoalkeeperZone('home');
    expect(homeGK.pos.x).toBeGreaterThanOrEqual(zone.xMin);
    expect(homeGK.pos.x).toBeLessThanOrEqual(zone.xMax);
    expect(homeGK.pos.y).toBeGreaterThanOrEqual(zone.yMin);
    expect(homeGK.pos.y).toBeLessThanOrEqual(zone.yMax);
  });

  it('is clamped back into the zone if knocked out by an external force', () => {
    const state = createInitialState();
    const homeGK = state.players.find((p) => p.team === 'home' && p.role === 'goalkeeper')!;
    // Simulate a shove far outside the zone (e.g. a collision elsewhere).
    homeGK.pos = { x: FIELD_R - 100, y: FIELD_CY };
    updateGoalkeepers(state, 1 / 60);
    const zone = getGoalkeeperZone('home');
    expect(homeGK.pos.x).toBeLessThanOrEqual(zone.xMax);
  });

  it('tracks the ball vertically within the zone bounds when the ball is a threat', () => {
    const state = createInitialState();
    const zone = getGoalkeeperZone('home');
    state.ball.pos = { x: FIELD_L + 50, y: zone.yMax + 200 }; // way below the zone, near the goal line
    for (let i = 0; i < 120; i++) {
      updateGoalkeepers(state, 1 / 60);
    }
    const homeGK = state.players.find((p) => p.team === 'home' && p.role === 'goalkeeper')!;
    expect(homeGK.pos.y).toBeCloseTo(zone.yMax, 0);
  });
});

describe('goalkeeper — excluded from active-player / bot-AI / substitution pools', () => {
  it('is never picked as the human-controlled active player, even standing on the ball', () => {
    const state = createInitialState();
    const homeGK = state.players.find((p) => p.team === 'home' && p.role === 'goalkeeper')!;
    state.ball.pos = { ...homeGK.pos };
    const next = updateGame(state, noInput(), 1 / 60);
    expect(next.activePlayerId).not.toBe(homeGK.id);
    expect(next.players.find((p) => p.id === homeGK.id)!.role).toBe('goalkeeper');
  });

  it('does not move like the away-team ball-chasing bot even when the ball sits right next to it', () => {
    const state = createInitialState();
    const awayGK = state.players.find((p) => p.team === 'away' && p.role === 'goalkeeper')!;
    const startPos = { ...awayGK.pos };
    state.ball.pos = { x: awayGK.pos.x - 200, y: awayGK.pos.y }; // far from goal, would attract a chasing bot
    for (let i = 0; i < 60; i++) {
      updateGame(state, noInput(), 1 / 60);
    }
    // The GK should stay near its own goal area (zone), not have chased 200px away.
    const zone = getGoalkeeperZone('away');
    const gk = state.players.find((p) => p.id === awayGK.id)!;
    expect(gk.pos.x).toBeGreaterThanOrEqual(zone.xMin);
    expect(Math.abs(gk.pos.x - startPos.x)).toBeLessThan(150);
  });
});

describe('goalkeeper — ball collision stopping power', () => {
  it('damps the ball far more than a regular player on contact', () => {
    const state = createInitialState();
    const gk = state.players.find((p) => p.team === 'home' && p.role === 'goalkeeper')!;
    state.ball.pos = { x: gk.pos.x + 5, y: gk.pos.y };
    state.ball.vel = { x: -400, y: 0 };
    const incomingSpeed = 400;
    resolvePlayerBallCollisions(state);
    const outgoingSpeed = Math.hypot(state.ball.vel.x, state.ball.vel.y);
    // Regular BUMP_FORCE alone (no damping) would leave the ball near/above
    // its incoming speed; the goalkeeper's heavy damping must bring it well below.
    expect(outgoingSpeed).toBeLessThan(incomingSpeed * 0.7);
  });

  it('is not perfectly impenetrable — a strong shot retains some speed after contact', () => {
    const state = createInitialState();
    const gk = state.players.find((p) => p.team === 'home' && p.role === 'goalkeeper')!;
    state.ball.pos = { x: gk.pos.x + 5, y: gk.pos.y };
    state.ball.vel = { x: -600, y: 0 };
    resolvePlayerBallCollisions(state);
    const outgoingSpeed = Math.hypot(state.ball.vel.x, state.ball.vel.y);
    expect(outgoingSpeed).toBeGreaterThan(0);
  });

  it('field players use unchanged BUMP_FORCE behavior (regression guard)', () => {
    const state = createInitialState();
    const fieldPlayer = state.players.find((p) => p.role === 'field_player')!;
    state.ball.pos = { x: fieldPlayer.pos.x + 5, y: fieldPlayer.pos.y };
    state.ball.vel = { x: 0, y: 0 };
    resolvePlayerBallCollisions(state);
    // With zero incoming velocity, the only added velocity is the push
    // direction times BUMP_FORCE (not GOALKEEPER_BUMP_FORCE).
    const speed = Math.hypot(state.ball.vel.x, state.ball.vel.y);
    expect(speed).toBeCloseTo(BUMP_FORCE, 0);
    expect(GOALKEEPER_BUMP_FORCE).toBeLessThan(BUMP_FORCE * 1.5);
    expect(GOALKEEPER_BALL_DAMPING).toBeLessThan(1);
  });
});

describe('goalkeeper — reset after goal / kickoff', () => {
  it('keeps goalkeepers at their default zone position after a goal reset', () => {
    const state = createInitialState();
    const homeGK = state.players.find((p) => p.team === 'home' && p.role === 'goalkeeper')!;
    homeGK.pos = { x: homeGK.pos.x + 40, y: homeGK.pos.y + 60 };
    state.ball.pos = { x: FIELD_R + 5, y: FIELD_CY };
    state.phase = 'playing';

    const afterGoal = updateGame(state, noInput(), 1 / 60);
    expect(afterGoal.phase).toBe('goal');

    afterGoal.goalTimer = 0;
    const afterReset = updateGame(afterGoal, noInput(), 1 / 60);
    expect(afterReset.phase).toBe('playing');

    const resetGK = afterReset.players.find((p) => p.id === homeGK.id)!;
    const zone = getGoalkeeperZone('home');
    expect(resetGK.pos.x).toBeGreaterThanOrEqual(zone.xMin);
    expect(resetGK.pos.x).toBeLessThanOrEqual(zone.xMax);
    expect(resetGK.role).toBe('goalkeeper');
  });
});
