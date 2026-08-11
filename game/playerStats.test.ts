import { describe, it, expect } from 'vitest';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import { updateGoalkeepers } from './goalkeeperAI';
import { resolvePlayerBallCollisions } from './physics';
import { DEFAULT_FIELD_PLAYER_STATS, DEFAULT_GOALKEEPER_STATS } from './playerStats';
import { PLAYER_RADIUS, BUMP_FORCE } from './constants';
import type { InputState } from './types';

function noInput(): InputState {
  return { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
}

describe('PlayerStats — data model', () => {
  it('every player has a stats object with all fields defined', () => {
    const state = createInitialState();
    for (const p of state.players) {
      expect(p.stats).toBeDefined();
      expect(typeof p.stats.speed).toBe('number');
      expect(typeof p.stats.shotPower).toBe('number');
      expect(typeof p.stats.stoppingPower).toBe('number');
      expect(typeof p.stats.size).toBe('number');
    }
  });

  it('field players get the default field-player profile', () => {
    const state = createInitialState();
    const fieldPlayer = state.players.find((p) => p.role === 'field_player')!;
    expect(fieldPlayer.stats).toEqual(DEFAULT_FIELD_PLAYER_STATS);
  });

  it('goalkeepers get the default goalkeeper profile', () => {
    const state = createInitialState();
    const gk = state.players.find((p) => p.role === 'goalkeeper')!;
    expect(gk.stats).toEqual(DEFAULT_GOALKEEPER_STATS);
    expect(gk.stats.stoppingPower).toBeGreaterThan(DEFAULT_FIELD_PLAYER_STATS.stoppingPower);
    expect(gk.stats.size).toBeGreaterThan(DEFAULT_FIELD_PLAYER_STATS.size);
  });

  it('each player owns an independent stats object (mutating one does not affect siblings)', () => {
    const state = createInitialState();
    const [a, b] = state.players.filter((p) => p.role === 'field_player');
    a.stats.speed = 999;
    expect(b.stats.speed).not.toBe(999);
    expect(b.stats.speed).toBe(DEFAULT_FIELD_PLAYER_STATS.speed);
  });

  it('two players sharing a role can have different stats', () => {
    const state = createInitialState();
    const [a, b] = state.players.filter((p) => p.role === 'field_player');
    a.stats.speed = 300;
    b.stats.speed = 100;
    expect(a.role).toBe(b.role);
    expect(a.stats.speed).not.toBe(b.stats.speed);
  });
});

describe('PlayerStats — speed drives movement', () => {
  it('a faster active player covers more distance per tick than a slower one', () => {
    const fast = createInitialState();
    const slow = createInitialState();
    const fastActive = fast.players.find((p) => p.id === fast.activePlayerId)!;
    const slowActive = slow.players.find((p) => p.id === slow.activePlayerId)!;
    fastActive.stats.speed = 400;
    slowActive.stats.speed = 50;

    const input: InputState = { ...noInput(), right: true };
    updateGame(fast, { ...input }, 1 / 60);
    updateGame(slow, { ...input }, 1 / 60);

    const fastMoved = fast.players.find((p) => p.id === fastActive.id)!.pos.x - fastActive.basePos.x;
    const slowMoved = slow.players.find((p) => p.id === slowActive.id)!.pos.x - slowActive.basePos.x;
    expect(fastMoved).toBeGreaterThan(slowMoved);
  });

  it('goalkeeper movement respects its own stats.speed', () => {
    const state = createInitialState();
    const gk = state.players.find((p) => p.role === 'goalkeeper' && p.team === 'home')!;
    gk.stats.speed = 0; // frozen goalkeeper should never move
    const startPos = { ...gk.pos };
    state.ball.pos = { x: gk.pos.x + 60, y: gk.pos.y + 60 };
    for (let i = 0; i < 30; i++) updateGoalkeepers(state, 1 / 60);
    expect(gk.pos.x).toBeCloseTo(startPos.x, 5);
    expect(gk.pos.y).toBeCloseTo(startPos.y, 5);
  });
});

describe('PlayerStats — shotPower scales kick force', () => {
  it('a higher shotPower produces a faster ball after a kick', () => {
    const weak = createInitialState();
    const strong = createInitialState();
    const weakActive = weak.players.find((p) => p.id === weak.activePlayerId)!;
    const strongActive = strong.players.find((p) => p.id === strong.activePlayerId)!;
    weakActive.stats.shotPower = 0.5;
    strongActive.stats.shotPower = 2;

    // Put the ball right in front of both kickers and fire an immediate kick.
    for (const [state, active] of [[weak, weakActive], [strong, strongActive]] as const) {
      active.pos = { x: 300, y: 300 };
      state.ball.pos = { x: 320, y: 300 };
      state.ball.vel = { x: 0, y: 0 };
      updateGame(state, { ...noInput(), kick: true }, 1 / 60);
      updateGame(state, { ...noInput() }, 1 / 60); // release fires the kick
    }

    const weakSpeed = Math.hypot(weak.ball.vel.x, weak.ball.vel.y);
    const strongSpeed = Math.hypot(strong.ball.vel.x, strong.ball.vel.y);
    expect(strongSpeed).toBeGreaterThan(weakSpeed);
  });
});

describe('PlayerStats — stoppingPower drives ball-collision damping', () => {
  it('collision damping/bump scales with stoppingPower between the field-player and goalkeeper baselines', () => {
    const state = createInitialState();
    const [a, b] = state.players.filter((p) => p.role === 'field_player');
    a.stats.stoppingPower = 0;
    b.stats.stoppingPower = 1;

    state.ball.pos = { x: a.pos.x + 5, y: a.pos.y };
    state.ball.vel = { x: -400, y: 0 };
    resolvePlayerBallCollisions(state);
    const lowStopOutgoing = Math.hypot(state.ball.vel.x, state.ball.vel.y);

    state.ball.pos = { x: b.pos.x + 5, y: b.pos.y };
    state.ball.vel = { x: -400, y: 0 };
    resolvePlayerBallCollisions(state);
    const highStopOutgoing = Math.hypot(state.ball.vel.x, state.ball.vel.y);

    expect(highStopOutgoing).toBeLessThan(lowStopOutgoing);
  });

  it('stoppingPower 0 reproduces the plain BUMP_FORCE impulse (regression guard)', () => {
    const state = createInitialState();
    const fieldPlayer = state.players.find((p) => p.role === 'field_player')!;
    state.ball.pos = { x: fieldPlayer.pos.x + 5, y: fieldPlayer.pos.y };
    state.ball.vel = { x: 0, y: 0 };
    resolvePlayerBallCollisions(state);
    expect(Math.hypot(state.ball.vel.x, state.ball.vel.y)).toBeCloseTo(BUMP_FORCE, 0);
  });
});

describe('PlayerStats — size feeds the renderer, not physical collision', () => {
  it('goalkeeper stats.size is larger than the physical PLAYER_RADIUS hitbox', () => {
    const state = createInitialState();
    const gk = state.players.find((p) => p.role === 'goalkeeper')!;
    expect(gk.stats.size).toBeGreaterThan(PLAYER_RADIUS);
  });

  it('field player stats.size equals the physical PLAYER_RADIUS baseline', () => {
    const state = createInitialState();
    const fieldPlayer = state.players.find((p) => p.role === 'field_player')!;
    expect(fieldPlayer.stats.size).toBe(PLAYER_RADIUS);
  });
});
