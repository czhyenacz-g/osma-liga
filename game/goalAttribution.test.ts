import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GameState, Team } from './types';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import { DEFAULT_TEMPORARY_REMOVAL_CONFIG } from './temporaryRemoval';
import { deployBenchPlayer } from './benchDeployment';
import { LIVE_GAMEPLAY_PROFILE } from './gameplayProfiles';
import { GOAL_PAUSE } from './constants';
import { isOwnGoal } from './goalAttribution';

// Own goals: only the conceding team's own kick or pass makes one; a
// defender or goalkeeper the ball merely bumps into never does. The same
// cases run against the server engine in project-hub-api
// src/gameEngine/goalAttribution.test.ts.

const NO_REMOVALS = { ...DEFAULT_TEMPORARY_REMOVAL_CONFIG, enabled: false };

beforeEach(() => {
  let seed = 0x5eed;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  });
});
afterEach(() => { vi.restoreAllMocks(); });

describe('isOwnGoal', () => {
  it.each<[Team, Team | null, boolean]>([
    ['home', 'home', false],
    ['home', 'away', true],
    ['away', 'away', false],
    ['away', 'home', true],
    ['home', null, false],
    ['away', null, false],
  ])('%s scores, %s kicked last → own goal %s', (scoring, lastKick, own) => {
    expect(isOwnGoal(scoring, lastKick)).toBe(own);
  });
});

// ── Scenarios through the real engine ─────────────────────────────────────
// 'me' is the home human (attacks the right goal). Opponents in `pinned`
// stand still where placed; `live` ones play normally. `prior` stands for an
// earlier kick by that team, `priorTouch` for an earlier passive contact.

type Seg = { dur: number; up?: boolean; down?: boolean; left?: boolean; right?: boolean; kick?: boolean };
type Who = 'away:f:0' | 'away:f:1' | 'away:gk' | 'home:gk';
interface Scenario {
  me: { x: number; y: number };
  ball: { x: number; y: number };
  ballVel?: { x: number; y: number };
  pinned?: { who: Who; x: number; y: number }[];
  live?: Who[];
  prior?: Team;
  priorTouch?: Team;
  bench?: boolean;
  inputs: Seg[];
}

const TAP: Seg[] = [{ dur: 0.05, kick: true }, { dur: 3 }];
const AWAY_GK_ASIDE = { who: 'away:gk', x: 880, y: 120 } as const;

function run(sc: Scenario, hz = 60) {
  const dt = 1 / hz;
  let state = createInitialState(NO_REMOVALS, undefined, LIVE_GAMEPLAY_PROFILE);
  const find = (who: Who) => {
    const [team, kind, n] = who.split(':');
    return state.players.filter((p) => p.team === team
      && (kind === 'gk' ? p.role === 'goalkeeper' : p.role === 'field_player' && p.matchStatus === 'field'))[Number(n ?? 0)];
  };
  const me = sc.bench
    ? state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!
    : find('home:f:0' as Who);
  if (sc.bench) expect(deployBenchPlayer(state, 'home', me.id, 'attacker')).toBe(true);
  const pins = (sc.pinned ?? []).map((q) => ({ p: find(q.who), x: q.x, y: q.y }));
  const keep = new Set([me.id, ...pins.map((q) => q.p.id), ...(sc.live ?? []).map((w) => find(w).id)]);
  for (const p of state.players) if (!keep.has(p.id)) { p.matchStatus = 'bench'; p.pos = { x: -500, y: -500 }; }
  me.pos = { ...sc.me };
  state.activePlayerId = me.id;
  state.ball.pos = { ...sc.ball };
  state.ball.vel = { ...(sc.ballVel ?? { x: 0, y: 0 }) };
  if (sc.priorTouch) { state.lastTouchTeam = sc.priorTouch; state.lastTouchPlayerId = 'earlier'; }
  if (sc.prior) {
    state.lastTouchTeam = sc.prior; state.lastTouchPlayerId = 'earlier';
    state.lastKickTeam = sc.prior; state.lastKickPlayerId = 'earlier';
  }

  const opponentTouches = new Set<string>();
  let t = 0, kickAt = -1, goalAt = -1;
  for (const seg of sc.inputs) {
    for (let i = 0; i < Math.round(seg.dur / dt) && goalAt < 0; i++) {
      const cooldown = me.kickCooldown;
      state = updateGame(state, {
        up: !!seg.up, down: !!seg.down, left: !!seg.left, right: !!seg.right, kick: !!seg.kick,
        restart: false, switchPlayer: false,
      }, dt, NO_REMOVALS, undefined, { disableOpponentAI: true, gameplayProfile: LIVE_GAMEPLAY_PROFILE });
      t += dt;
      for (const q of pins) { q.p.pos = { x: q.x, y: q.y }; q.p.vel = { x: 0, y: 0 }; }
      if (me.kickCooldown > cooldown + 0.1) kickAt = t;
      const toucher = state.players.find((p) => p.id === state.lastTouchPlayerId);
      if (toucher && toucher.team !== 'home') opponentTouches.add(toucher.role === 'goalkeeper' ? 'gk' : 'field');
      if (state.phase === 'goal') goalAt = t;
    }
  }
  const scoring: Team | null = state.score.home ? 'home' : state.score.away ? 'away' : null;
  return { state, scoring, own: state.isOwnGoal, opponentTouches, sinceKick: kickAt >= 0 && goalAt >= 0 ? goalAt - kickAt : null };
}

describe('goal attribution through the local engine', () => {
  it('A: a clean shot is the shooter\'s goal', () => {
    const r = run({ me: { x: 700, y: 280 }, ball: { x: 726, y: 280 }, pinned: [AWAY_GK_ASIDE], inputs: TAP });
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });

  it.each([30, 60, 144])('B: a light defender touch on a shot on target is not an own goal (%i Hz)', (hz) => {
    const r = run({ me: { x: 700, y: 280 }, ball: { x: 726, y: 280 }, pinned: [AWAY_GK_ASIDE, { who: 'away:f:0', x: 800, y: 304 }], inputs: TAP }, hz);
    expect(r.opponentTouches.has('field')).toBe(true);
    expect([r.scoring, r.own]).toEqual(['home', false]);
    expect(r.state.score).toEqual({ home: 1, away: 0 });
  });

  it('C: a light goalkeeper touch is not an own goal', () => {
    const r = run({ me: { x: 700, y: 280 }, ball: { x: 726, y: 280 }, pinned: [{ who: 'away:gk', x: 868, y: 310 }], inputs: TAP });
    expect(r.opponentTouches.has('gk')).toBe(true);
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });

  it('D: a goalkeeper save that still ends in the net is the shooter\'s goal', () => {
    const r = run({
      me: { x: 700, y: 280 }, ball: { x: 728, y: 280 }, live: ['away:gk'],
      inputs: [{ dur: 0.2, right: true }, { dur: 0.5, right: true, kick: true }, { dur: 0.05, right: true }, { dur: 2 }],
    });
    expect(r.opponentTouches.has('gk')).toBe(true);
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });

  it('E: a wide shot a defender happens to turn in counts for the shooter (ambiguous → no own goal)', () => {
    const r = run({
      me: { x: 640, y: 355 }, ball: { x: 666, y: 355 }, pinned: [AWAY_GK_ASIDE, { who: 'away:f:0', x: 780, y: 367 }],
      inputs: [{ dur: 0.3, right: true, kick: true }, { dur: 0.05, right: true }, { dur: 3 }],
    });
    expect(r.opponentTouches.has('field')).toBe(true);
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });

  it('G: kicking into the own net is an own goal', () => {
    const r = run({ me: { x: 160, y: 280 }, ball: { x: 134, y: 280 }, inputs: [{ dur: 0.05, left: true, kick: true }, { dur: 0.05, left: true }, { dur: 3 }] });
    expect([r.scoring, r.own]).toEqual(['away', true]);
    expect(r.state.score).toEqual({ home: 0, away: 1 });
  });

  it('I: taking the ball, carrying it and then kicking it into the own net is an own goal', () => {
    const r = run({
      me: { x: 330, y: 280 }, ball: { x: 304, y: 280 }, prior: 'away',
      inputs: [{ dur: 0.6, left: true }, { dur: 0.05, left: true, kick: true }, { dur: 0.05, left: true }, { dur: 3 }],
    });
    expect([r.scoring, r.own]).toEqual(['away', true]);
  });

  it('J: a shot that brushes two defenders is the shooter\'s goal', () => {
    const r = run({
      me: { x: 300, y: 470 }, ball: { x: 600, y: 280 }, ballVel: { x: 700, y: 0 }, prior: 'home',
      pinned: [AWAY_GK_ASIDE, { who: 'away:f:0', x: 700, y: 306 }, { who: 'away:f:1', x: 800, y: 236 }], inputs: [{ dur: 3 }],
    });
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });

  it('K: off the wall, then a defender touch — the shooter\'s goal', () => {
    const r = run({
      me: { x: 300, y: 470 }, ball: { x: 640, y: 100 }, ballVel: { x: 450, y: -600 }, prior: 'home',
      pinned: [{ who: 'away:gk', x: 880, y: 460 }, { who: 'away:f:0', x: 860, y: 260 }], inputs: [{ dur: 3 }],
    });
    expect(r.opponentTouches.has('field')).toBe(true);
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });

  it('L: a slow shot, touched, in more than 1.5 s after the kick — still the shooter\'s goal', () => {
    const r = run({ me: { x: 480, y: 280 }, ball: { x: 506, y: 280 }, pinned: [AWAY_GK_ASIDE, { who: 'away:f:0', x: 850, y: 302 }], inputs: [{ dur: 0.05, kick: true }, { dur: 5 }] });
    expect(r.sinceKick).toBeGreaterThan(1.5);
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });

  it('M: an own-goal kick right after an opponent\'s shot is an own goal', () => {
    const r = run({ me: { x: 160, y: 280 }, ball: { x: 134, y: 280 }, prior: 'away', inputs: [{ dur: 0.05, left: true, kick: true }, { dur: 0.05, left: true }, { dur: 3 }] });
    expect([r.scoring, r.own]).toEqual(['away', true]);
  });

  it('other end: an away shot touched by the home goalkeeper is the away goal, not a home own goal', () => {
    const r = run({ me: { x: 400, y: 470 }, ball: { x: 300, y: 280 }, ballVel: { x: -560, y: 0 }, prior: 'away', pinned: [{ who: 'home:gk', x: 70, y: 304 }], inputs: [{ dur: 3 }] });
    expect([r.scoring, r.own]).toEqual(['away', false]);
  });

  it('N: a žolík\'s shot touched by a defender is the žolík team\'s goal', () => {
    const r = run({ bench: true, me: { x: 700, y: 280 }, ball: { x: 726, y: 280 }, pinned: [AWAY_GK_ASIDE, { who: 'away:f:0', x: 800, y: 304 }], inputs: TAP });
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });

  it('O: nobody kicked since the kick-off — a plain goal, never an own goal', () => {
    const r = run({ me: { x: 400, y: 470 }, ball: { x: 300, y: 280 }, ballVel: { x: -560, y: 0 }, inputs: [{ dur: 3 }] });
    expect([r.scoring, r.own]).toEqual(['away', false]);
  });

  it('P: a shot fired while a defender is in contact with the ball is the shooter\'s goal', () => {
    const r = run({
      me: { x: 779.3, y: 361.8 }, ball: { x: 795.8, y: 339.2 }, pinned: [{ who: 'away:f:0', x: 866.7, y: 243.3 }],
      inputs: [{ dur: 0.6, up: true, right: true, kick: true }, { dur: 0.05, up: true, right: true }, { dur: 3 }],
    });
    expect(r.opponentTouches.has('field')).toBe(true);
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });

  it('Q: an earlier opponent bump does not make a later clean shot an own goal', () => {
    const r = run({ me: { x: 700, y: 280 }, ball: { x: 740, y: 280 }, priorTouch: 'away', pinned: [AWAY_GK_ASIDE], inputs: TAP });
    expect([r.scoring, r.own]).toEqual(['home', false]);
  });
});

it('the bot\'s kick is recorded as the away team\'s kick', () => {
  let state = createInitialState(NO_REMOVALS);
  const bot = state.players.find((p) => p.team === 'away' && p.role === 'field_player' && p.matchStatus === 'field')!;
  state.ball.pos = { x: bot.pos.x - 20, y: bot.pos.y };
  const idle = { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
  for (let i = 0; i < 120 && state.lastKickTeam === null; i++) state = updateGame(state, idle, 1 / 60, NO_REMOVALS);
  expect(state.lastKickTeam).toBe('away');
});

describe('the last kick does not survive a restart', () => {
  const kicked = (state: GameState) => { state.lastKickTeam = 'home'; state.lastKickPlayerId = 'someone'; };

  it('is cleared at the kick-off after a goal', () => {
    const r = run({ me: { x: 160, y: 280 }, ball: { x: 134, y: 280 }, inputs: [{ dur: 0.05, left: true, kick: true }, { dur: 0.05, left: true }, { dur: 3 }] });
    let state = r.state;
    expect(state.phase).toBe('goal');
    expect(state.lastKickTeam).toBe('home');
    const idle = { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
    for (let t = 0; t < GOAL_PAUSE + 0.1; t += 1 / 60) state = updateGame(state, idle, 1 / 60, NO_REMOVALS, undefined, { disableOpponentAI: true });
    expect(state.phase).toBe('playing');
    expect([state.lastKickTeam, state.lastKickPlayerId, state.isOwnGoal]).toEqual([null, null, false]);
  });

  it('is cleared by a match restart', () => {
    const state = createInitialState(NO_REMOVALS);
    kicked(state);
    const fresh = updateGame(state, { up: false, down: false, left: false, right: false, kick: false, restart: true, switchPlayer: false }, 1 / 60, NO_REMOVALS);
    expect([fresh.lastKickTeam, fresh.lastKickPlayerId]).toEqual([null, null]);
  });
});
