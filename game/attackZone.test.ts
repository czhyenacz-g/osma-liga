import { describe, it, expect } from 'vitest';
import { ATTACK_LIMIT_DEPTH, attackLimitX, capOffBallTarget } from './attackZone';
import { applySupportPositioning } from './supportPositioning';
import { updateAI } from './ai';
import { createInitialState } from './createInitialState';
import { FIELD_L, FIELD_R, SUPPORT_PLAYER_SPEED, BOT_SPEED } from './constants';
import type { GameState, Player } from './types';

const DT = 1 / 60;
// Support players stop within 5 px of their target (supportPositioning.ts).
const ARRIVE = 5;
const byId = (s: GameState, id: string) => s.players.find((p) => p.id === id)!;

describe('attackZone — last eighth before the opponent goal', () => {
  it('is one eighth of the pitch length, mirrored for both teams', () => {
    expect(ATTACK_LIMIT_DEPTH).toBe((FIELD_R - FIELD_L) / 8);
    expect(attackLimitX('home')).toBe(FIELD_R - ATTACK_LIMIT_DEPTH); // attacks right
    expect(attackLimitX('away')).toBe(FIELD_L + ATTACK_LIMIT_DEPTH); // attacks left
  });

  it('caps targets past the line, keeps targets on or before it', () => {
    const home = attackLimitX('home');
    const away = attackLimitX('away');
    expect(capOffBallTarget('home', { x: FIELD_R - 10, y: 200 })).toEqual({ x: home, y: 200 });
    expect(capOffBallTarget('home', { x: home, y: 200 })).toEqual({ x: home, y: 200 });
    expect(capOffBallTarget('home', { x: home - 1, y: 200 })).toEqual({ x: home - 1, y: 200 });
    expect(capOffBallTarget('away', { x: FIELD_L + 10, y: 300 })).toEqual({ x: away, y: 300 });
    expect(capOffBallTarget('away', { x: away, y: 300 })).toEqual({ x: away, y: 300 });
    // Own half is never touched.
    expect(capOffBallTarget('home', { x: FIELD_L + 20, y: 1 })).toEqual({ x: FIELD_L + 20, y: 1 });
    expect(capOffBallTarget('away', { x: FIELD_R - 20, y: 1 })).toEqual({ x: FIELD_R - 20, y: 1 });
  });
});

describe('home support players (attacking right)', () => {
  function attackScene() {
    const s = createInitialState();
    const active = byId(s, 'n1');
    active.pos = { x: FIELD_R - 140, y: 280 };
    s.ball.pos = { x: FIELD_R - 120, y: 280 };
    return { s, active, home: s.players.filter((p) => p.team === 'home' && p.role !== 'goalkeeper' && p.matchStatus !== 'bench') };
  }

  it('the runner without the ball stops at the line', () => {
    const { s, active, home } = attackScene();
    for (let i = 0; i < 600; i++) applySupportPositioning(home, active, s.ball, DT);
    for (const p of home.filter((p) => p !== active)) expect(p.pos.x).toBeLessThanOrEqual(attackLimitX('home') + ARRIVE);
    const front = Math.max(...home.filter((p) => p !== active).map((p) => p.pos.x));
    expect(Math.abs(front - attackLimitX('home'))).toBeLessThanOrEqual(ARRIVE);
  });

  it('a runner already inside walks back at normal speed (no teleport, no freeze)', () => {
    const { s, active, home } = attackScene();
    const runner = home.find((p) => p.id === 'n3')!;
    runner.pos = { x: FIELD_R - 30, y: 360 };
    let prevX = runner.pos.x;
    for (let i = 0; i < 300; i++) {
      applySupportPositioning(home, active, s.ball, DT);
      expect(prevX - runner.pos.x).toBeLessThanOrEqual(SUPPORT_PLAYER_SPEED * DT + 1e-6);
      prevX = runner.pos.x;
    }
    expect(runner.pos.x).toBeLessThanOrEqual(attackLimitX('home') + ARRIVE);
  });

  it('the human-controlled player is never limited', () => {
    const { s, active, home } = attackScene();
    active.pos = { x: FIELD_R - 30, y: 280 };
    applySupportPositioning(home, active, s.ball, DT);
    expect(active.pos.x).toBe(FIELD_R - 30);
  });
});

describe('away bots (attacking left)', () => {
  function botScene(ballX: number) {
    const s = createInitialState();
    s.ball.pos = { x: ballX, y: 280 };
    s.ball.vel = { x: 0, y: 0 };
    const bots = s.players.filter((p) => p.team === 'away' && p.role !== 'goalkeeper' && p.matchStatus !== 'bench');
    return { s, bots };
  }

  it('an off-ball bot inside the last eighth walks back out', () => {
    const { s, bots } = botScene(FIELD_R - 200);
    const lost: Player = bots.find((p) => p.id === 'p3')!;
    lost.pos = { x: FIELD_L + 30, y: 400 };
    let prevX = lost.pos.x;
    for (let i = 0; i < 240; i++) {
      updateAI(s, DT);
      expect(lost.pos.x - prevX).toBeLessThanOrEqual(BOT_SPEED * DT + 1e-6);
      expect(lost.pos.x).toBeGreaterThanOrEqual(prevX - 1e-6);
      prevX = lost.pos.x;
    }
    expect(lost.pos.x).toBeGreaterThan(attackLimitX('away'));
  });

  it('the bot going for a free ball may enter the zone and reach it', () => {
    const ballX = FIELD_L + 40;
    const { s, bots } = botScene(ballX);
    const chaser = bots.find((p) => p.id === 'p1')!;
    chaser.pos = { x: FIELD_L + 140, y: 280 };
    for (let i = 0; i < 120; i++) updateAI(s, DT);
    expect(chaser.pos.x).toBeLessThan(attackLimitX('away'));
  });

  it('goalkeepers are not moved by the off-ball limit', () => {
    const { s } = botScene(FIELD_L + 40);
    const gk = byId(s, 'p-gk');
    const before = { ...gk.pos };
    updateAI(s, DT);
    expect(gk.pos).toEqual(before);
  });
});
