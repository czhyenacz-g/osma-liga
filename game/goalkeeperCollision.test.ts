import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GameState, Player, Vec2 } from './types';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import { sweepBallAgainstGoalkeepers } from './physics';
import { DEFAULT_TEMPORARY_REMOVAL_CONFIG } from './temporaryRemoval';
import { LIVE_GAMEPLAY_PROFILE } from './gameplayProfiles';
import { PLAYER_RADIUS, BALL_RADIUS, GOALKEEPER_BALL_DAMPING, GOALKEEPER_BUMP_FORCE } from './constants';

// Goalkeeper contact: the ball must never cross a goalkeeper's body without
// touching him — not from a fast shot at a low frame rate, not from a kick
// that snaps the ball forward next to him. Balls that miss him still score.
// The same cases run against the server engine in project-hub-api
// src/gameEngine/goalkeeperCollision.test.ts.

const NO_REMOVALS = { ...DEFAULT_TEMPORARY_REMOVAL_CONFIG, enabled: false };
const R = PLAYER_RADIUS + BALL_RADIUS;
const RATES = [30, 60, 120, 144];
// GameCanvas clamps a frame to dt 0.05 — a hitch steps the ball up to 40 px,
// enough to end past his centre.
const HITCH = 20;

beforeEach(() => {
  let seed = 0x5eed;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  });
});
afterEach(() => { vi.restoreAllMocks(); });

// Point where the segment p0→p1 enters the circle (c, R), if it does.
function entryPoint(p0: Vec2, p1: Vec2, c: Vec2): Vec2 | null {
  const dx = p1.x - p0.x, dy = p1.y - p0.y, fx = p0.x - c.x, fy = p0.y - c.y;
  const a = dx * dx + dy * dy, b = 2 * (fx * dx + fy * dy), cc = fx * fx + fy * fy - R * R;
  if (cc <= 0 || a < 1e-9) return null;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? { x: p0.x + dx * t, y: p0.y + dy * t } : null;
}

interface Shot {
  side: 'right' | 'left';
  ball: Vec2;
  vel?: Vec2;
  gk?: Vec2;          // pinned goalkeeper position; omitted = he plays normally
  kick?: number;      // 'me' runs right from just behind the ball, charges this long, releases
}
interface Outcome { goal: boolean; gkTouched: boolean; through: boolean; state: GameState; gk: Player }

function shoot(s: Shot, hz: number, seconds = 2): Outcome {
  const dt = 1 / hz;
  let st = createInitialState(NO_REMOVALS, undefined, LIVE_GAMEPLAY_PROFILE);
  const gkTeam = s.side === 'right' ? 'away' : 'home';
  const gk = st.players.find((p) => p.team === gkTeam && p.role === 'goalkeeper')!;
  const me = st.players.find((p) => p.team === 'home' && p.role === 'field_player')!;
  for (const p of st.players) if (p !== gk && p !== me) { p.matchStatus = 'bench'; p.pos = { x: -500, y: -500 }; }
  me.pos = s.kick !== undefined ? { x: s.ball.x - 28, y: s.ball.y } : { x: 480, y: 500 };
  st.activePlayerId = me.id;
  st.ball.pos = { ...s.ball };
  st.ball.vel = { ...(s.vel ?? { x: 0, y: 0 }) };
  if (s.gk) gk.pos = { ...s.gk };
  let gkTouched = false, through = false, t = 0;
  let lastEntry: Vec2 | null = null;
  for (let i = 0; i < seconds * hz && st.phase === 'playing'; i++) {
    const from = { ...st.ball.pos };
    const input = { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
    if (s.kick !== undefined) {
      input.right = t < 0.2 + s.kick + 0.05;
      input.kick = t >= 0.2 && t < 0.2 + s.kick;
    }
    t += dt;
    st.lastTouchPlayerId = null;
    st = updateGame(st, input, dt, NO_REMOVALS, undefined, { disableOpponentAI: true });
    if (st.lastTouchPlayerId === gk.id) gkTouched = true;
    // Through = the ball entered his body and came out on the opposite side
    // of it — within this step, or after ending the last one inside him.
    const b = st.ball.pos, g = gk.pos;
    const e = entryPoint(from, b, g) ?? (Math.hypot(from.x - g.x, from.y - g.y) < R ? lastEntry : null);
    if (e && (e.x - g.x) * (b.x - g.x) + (e.y - g.y) * (b.y - g.y) < 0) through = true;
    lastEntry = entryPoint(from, b, g) ?? lastEntry;
    if (s.gk) { gk.pos = { ...s.gk }; gk.vel = { x: 0, y: 0 }; }
  }
  return { goal: st.phase === 'goal', gkTouched, through, state: st, gk };
}

// Mirror a right-goal shot onto the left goal.
const mirror = (s: Shot): Shot => ({
  ...s, side: 'left', ball: { x: 960 - s.ball.x, y: s.ball.y },
  vel: s.vel && { x: -s.vel.x, y: s.vel.y }, gk: s.gk && { x: 960 - s.gk.x, y: s.gk.y },
});
const bothSides = (s: Shot): [string, Shot][] => [['right goal', s], ['left goal', mirror(s)]];

const GK = { x: 868, y: 280 };

describe('shots straight at a ready goalkeeper are stopped by his body', () => {
  for (const speed of [150, 400, 800]) for (const d of [40, 120]) for (const hz of [HITCH, ...RATES]) {
    for (const [side, shot] of bothSides({ side: 'right', ball: { x: GK.x - d, y: GK.y }, vel: { x: speed, y: 0 }, gk: GK })) {
      it(`${speed} px/s from ${d} px at ${hz} Hz, ${side}`, () => {
        const r = shoot(shot, hz);
        expect(r.gkTouched).toBe(true);
        expect(r.through).toBe(false);
        expect(r.goal).toBe(false);
      });
    }
  }
});

describe('the ball never passes through his body, whatever happens after contact', () => {
  for (const off of [0, 8, 16, 22, 26]) for (const speed of [500, 800]) for (const hz of RATES) {
    for (const [side, shot] of bothSides({ side: 'right', ball: { x: GK.x - 60, y: GK.y + off }, vel: { x: speed, y: 0 }, gk: GK })) {
      it(`${speed} px/s, ${off} px off centre at ${hz} Hz, ${side}`, () => {
        const r = shoot(shot, hz);
        expect(r.gkTouched).toBe(true);
        expect(r.through).toBe(false);
      });
    }
  }
});

// A close shot angled across the goal while he steps toward it: a glancing
// parry may still end in the net, but only off his body, never through it.
describe('close angled shots at a goalkeeper on the move', () => {
  for (const speed of [600, 800]) for (const fromY of [160, 400]) for (const hz of RATES) {
    const len = Math.hypot(60, 280 - fromY);
    const shot: Shot = { side: 'right', ball: { x: 840, y: fromY }, vel: { x: speed * 60 / len, y: speed * (280 - fromY) / len } };
    for (const [side, s] of bothSides(shot)) {
      it(`${speed} px/s from y ${fromY} at ${hz} Hz, ${side}`, () => {
        const r = shoot(s, hz);
        expect(r.through).toBe(false);
      });
    }
  }
});

describe('balls out of his reach still score', () => {
  for (const hz of RATES) {
    for (const [side, shot] of bothSides({ side: 'right', ball: { x: GK.x - 60, y: GK.y + R + 10 }, vel: { x: 600, y: 0 }, gk: GK })) {
      // R + 10: he still shuffles a few px toward the ball within a step.
      it(`just past him at ${hz} Hz, ${side}`, () => {
        const r = shoot(shot, hz);
        expect(r.gkTouched).toBe(false);
        expect(r.goal).toBe(true);
      });
    }
    for (const y of [222, 338]) {
      for (const [side, shot] of bothSides({ side: 'right', ball: { x: 760, y }, vel: { x: 700, y: 0 }, gk: GK })) {
        it(`into the ${y < 280 ? 'top' : 'bottom'} corner at ${hz} Hz, ${side}`, () => {
          const r = shoot(shot, hz);
          expect(r.gkTouched).toBe(false);
          expect(r.goal).toBe(true);
        });
      }
    }
  }
});

describe('other contacts', () => {
  for (const hz of RATES) {
    it(`an angled shot across his body is stopped at ${hz} Hz`, () => {
      const r = shoot({ side: 'right', ball: { x: 800, y: 180 }, vel: { x: 400, y: 588 }, gk: GK }, hz);
      expect(r.gkTouched).toBe(true);
      expect(r.through).toBe(false);
    });
    it(`a ball off the end wall into his body is stopped at ${hz} Hz`, () => {
      const r = shoot({ side: 'right', ball: { x: 800, y: 130 }, vel: { x: 500, y: 150 }, gk: { x: 866, y: 185 } }, hz);
      expect(r.state.ball.pos.y).toBeLessThan(215); // came off the wall above the goal, not out of the net
      expect(r.gkTouched).toBe(true);
      expect(r.through).toBe(false);
    });
    it(`a moving goalkeeper is never shot through at ${hz} Hz`, () => {
      for (const [, shot] of bothSides({ side: 'right', ball: { x: 840, y: 160 }, vel: { x: 360, y: 720 } })) {
        expect(shoot(shot, hz).through).toBe(false);
      }
    });
    it(`a kick while pressed against him does not teleport the ball past him at ${hz} Hz`, () => {
      for (const charge of [0.05, 0.3, 0.5]) {
        const r = shoot({ side: 'right', ball: { x: 728, y: 280 }, gk: { x: 866, y: 280 }, kick: charge }, hz, 3);
        expect(r.through).toBe(false);
        expect(r.goal).toBe(false);
      }
    });
  }

  it('the rebound comes back into play and a follow-up into the corner scores', () => {
    const first = shoot({ side: 'right', ball: { x: 760, y: 280 }, vel: { x: 700, y: 0 }, gk: GK }, 60, 0.5);
    expect(first.gkTouched).toBe(true);
    expect(first.state.ball.vel.x).toBeLessThan(0);
    // The attacker collects it a step further out (46 px from his body he
    // still covers the whole goal) and shoots for the corner.
    const from = { x: first.state.ball.pos.x - 60, y: first.state.ball.pos.y };
    const aim = { x: 900 - from.x, y: 225 - from.y }; // top corner
    const len = Math.hypot(aim.x, aim.y);
    const follow = shoot({ side: 'right', ball: { ...from }, vel: { x: 700 * aim.x / len, y: 700 * aim.y / len }, gk: GK }, 60);
    expect(follow.goal).toBe(true);
  });
});

describe('sweepBallAgainstGoalkeepers', () => {
  function stateWithGk(): { st: GameState; gk: Player } {
    const st = createInitialState(NO_REMOVALS, undefined, LIVE_GAMEPLAY_PROFILE);
    const gk = st.players.find((p) => p.team === 'away' && p.role === 'goalkeeper')!;
    gk.pos = { ...GK };
    return { st, gk };
  }

  it('puts the ball back at the entry point and bounces it there once', () => {
    const { st, gk } = stateWithGk();
    const from = { x: GK.x - 40, y: GK.y };
    st.ball.pos = { x: GK.x + 10, y: GK.y }; // one long step, past his centre
    st.ball.vel = { x: 1500, y: 0 };
    expect(sweepBallAgainstGoalkeepers(st, from)).toBe(gk);
    expect(st.ball.pos.x).toBeCloseTo(GK.x - R - 1, 6);
    expect(st.ball.pos.y).toBeCloseTo(GK.y, 6);
    expect(st.ball.vel.x).toBeCloseTo(1500 * GOALKEEPER_BALL_DAMPING - GOALKEEPER_BUMP_FORCE, 6);
    expect(st.lastTouchPlayerId).toBe(gk.id);
    // Already outside him: the overlap pass in the same step finds nothing.
    expect(Math.hypot(st.ball.pos.x - gk.pos.x, st.ball.pos.y - gk.pos.y)).toBeGreaterThan(R);
  });

  it('leaves a ball that only reaches into him from the front to the overlap pass', () => {
    const { st } = stateWithGk();
    st.ball.pos = { x: GK.x - R + 5, y: GK.y };
    st.ball.vel = { x: 300, y: 0 };
    expect(sweepBallAgainstGoalkeepers(st, { x: GK.x - 40, y: GK.y })).toBeNull();
    expect(st.ball.vel.x).toBe(300);
  });

  it('ignores a path that misses him and field players altogether', () => {
    const { st } = stateWithGk();
    st.ball.pos = { x: GK.x + 40, y: GK.y + R + 1 };
    expect(sweepBallAgainstGoalkeepers(st, { x: GK.x - 40, y: GK.y + R + 1 })).toBeNull();
    const field = st.players.find((p) => p.role === 'field_player')!;
    field.pos = { x: 500, y: 280 };
    st.ball.pos = { x: 540, y: 280 };
    expect(sweepBallAgainstGoalkeepers(st, { x: 460, y: 280 })).toBeNull();
  });
});
