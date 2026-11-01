import { describe, it, expect } from 'vitest';
import type { GameState, InputState, Player, Team } from './types';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import { DEFAULT_TEMPORARY_REMOVAL_CONFIG } from './temporaryRemoval';
import { LIVE_GAMEPLAY_PROFILE } from './gameplayProfiles';
import { FIELD_L, FIELD_R, FIELD_CX, FIELD_CY, GOALKEEPER_RADIUS, BALL_RADIUS, KICK_RANGE } from './constants';
import {
  GOALKEEPER_SAVE, isShotSave, saveRoll, saveOutcome, holdSeconds, heldBallSpot, releaseBall, firstSaveSeq,
} from './goalkeeperSave';
import { CATCH_SAVE_SEQ, PARRY_SAVE_SEQ, CLEAR_SAVE_SEQ } from './physicsContract/spec';

// Goalkeeper save outcomes (goalkeeperSave.ts) — the pure model plus the
// local engine. The same cases run against the server engine in
// project-hub-api src/gameEngine/goalkeeperSave.test.ts.

const NO_REMOVALS = { ...DEFAULT_TEMPORARY_REMOVAL_CONFIG, enabled: false };
const R = GOALKEEPER_RADIUS + BALL_RADIUS;
const idle = (): InputState => ({ up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false });
const fwd = (team: Team) => (team === 'home' ? 1 : -1);

describe('goalkeeper save model', () => {
  it('splits saves ~30 / 50 / 20 over a large deterministic sample', () => {
    const n = { catch: 0, parry: 0, clear: 0 };
    // 2000 matches × 10 saves, each match starting where firstSaveSeq puts it.
    for (let m = 0; m < 2000; m++) {
      const start = firstSaveSeq(180 - (m % 170), 700 + (m % 97), 200 + (m % 61));
      for (let k = 0; k < 10; k++) n[saveOutcome(saveRoll(start + k))]++;
    }
    expect(n.catch / 20000).toBeCloseTo(0.3, 1);
    expect(n.parry / 20000).toBeCloseTo(0.5, 1);
    expect(n.clear / 20000).toBeCloseTo(0.2, 1);
    expect(Math.abs(n.catch / 20000 - 0.3)).toBeLessThan(0.02);
    expect(Math.abs(n.parry / 20000 - 0.5)).toBeLessThan(0.02);
    expect(Math.abs(n.clear / 20000 - 0.2)).toBeLessThan(0.02);
  });

  it('is deterministic: the same sequence number always gives the same outcome', () => {
    for (let s = 0; s < 50; s++) expect(saveRoll(s)).toBe(saveRoll(s));
    expect(saveOutcome(saveRoll(CATCH_SAVE_SEQ))).toBe('catch');
    expect(saveOutcome(saveRoll(PARRY_SAVE_SEQ))).toBe('parry');
    expect(saveOutcome(saveRoll(CLEAR_SAVE_SEQ))).toBe('clear');
  });

  it('holds a caught ball 0.5–0.8 s', () => {
    for (let s = 0; s < 500; s++) {
      const h = holdSeconds(saveRoll(s));
      expect(h).toBeGreaterThanOrEqual(GOALKEEPER_SAVE.holdMinSeconds);
      expect(h).toBeLessThanOrEqual(GOALKEEPER_SAVE.holdMaxSeconds);
    }
  });

  it('only an opponent\'s fast ball toward his goal is a real save', () => {
    expect(isShotSave(500, 0, 'away', 'home')).toBe(true);
    expect(isShotSave(-500, 0, 'home', 'away')).toBe(true);
    expect(isShotSave(500, 0, 'away', 'away')).toBe(false);   // own team's kick
    expect(isShotSave(500, 0, 'away', null)).toBe(false);     // nobody kicked (corner clear, kick-off)
    expect(isShotSave(-500, 0, 'away', 'home')).toBe(false);  // ball moving away from his goal
    expect(isShotSave(150, 0, 'away', 'home')).toBe(false);   // slow roller / dribble
  });

  for (const team of ['home', 'away'] as const) {
    const gk = { x: team === 'home' ? FIELD_L + 34 : FIELD_R - 34, y: FIELD_CY };
    const ahead = (dx: number, dy = 0) => ({ x: gk.x + fwd(team) * dx, y: gk.y + dy });

    it(`${team}: passes to the nearest open teammate ahead`, () => {
      const r = releaseBall(gk, team, [ahead(300, -60), ahead(200, 80), ahead(-10, 100)], [ahead(400, 0)], true, 0.5);
      expect(r.passTo).toBe(1);
      expect(r.vx * fwd(team)).toBeGreaterThan(0);
      expect(Math.atan2(r.vy, r.vx)).toBeCloseTo(Math.atan2(80, (200 - R - 1) * fwd(team)), 1);
    });

    it(`${team}: clears when every pass lane is blocked or nobody is ahead`, () => {
      const blocked = releaseBall(gk, team, [ahead(200, 0)], [ahead(100, 0)], true, 0.5);
      expect(blocked.passTo).toBeNull();
      const nobody = releaseBall(gk, team, [ahead(-20, 120)], [], true, 0.5);
      expect(nobody.passTo).toBeNull();
      expect(Math.hypot(nobody.vx, nobody.vy)).toBeCloseTo(GOALKEEPER_SAVE.clearSpeed, 0);
    });

    it(`${team}: every release starts in front of him and goes forward, whatever the crowd`, () => {
      for (let k = 0; k < 400; k++) {
        const h = (i: number) => saveRoll(k, i);
        const opponents = [0, 1, 2].map((i) => ahead(30 + h(i) * 200, (h(i + 3) - 0.5) * 300));
        const mates = [0, 1].map((i) => ahead(-30 + h(i + 6) * 400, (h(i + 8) - 0.5) * 300));
        const g = { x: gk.x, y: FIELD_CY + (h(10) - 0.5) * 200 };
        const r = releaseBall(g, team, mates, opponents, h(11) < 0.5, h(12));
        expect(r.x).toBeCloseTo(heldBallSpot(g, team).x, 5);
        expect(r.vx * fwd(team)).toBeGreaterThan(0);
      }
    });
  }
});

// ── Through the local engine ─────────────────────────────────────────────────

interface Setup {
  gkTeam: Team;
  seq: number;
  ballDx?: number;            // ball start, px in front of the goalkeeper
  ballDy?: number;
  speed?: number;             // shot speed toward his goal centre
  mates?: { x: number; y: number }[];    // the goalkeeper's teammates kept on the pitch
  attacker?: { x: number; y: number };   // the shooter's position (else far away)
}

function setup(s: Setup) {
  const st = createInitialState(NO_REMOVALS, undefined, LIVE_GAMEPLAY_PROFILE);
  const shooterTeam: Team = s.gkTeam === 'home' ? 'away' : 'home';
  const gk = st.players.find((p) => p.team === s.gkTeam && p.role === 'goalkeeper')!;
  const otherGk = st.players.find((p) => p.team === shooterTeam && p.role === 'goalkeeper')!;
  const shooter = st.players.find((p) => p.team === shooterTeam && p.role === 'field_player' && p.matchStatus === 'field')!;
  const mates = st.players.filter((p) => p.team === s.gkTeam && p.role === 'field_player' && p.matchStatus === 'field');
  const humanSide = st.players.find((p) => p.team === 'home' && p.role === 'field_player' && p.matchStatus === 'field')!;
  for (const p of st.players) {
    if (p === gk || p === otherGk || p === shooter || p === humanSide) continue;
    const i = mates.indexOf(p);
    if (i >= 0 && s.mates?.[i]) { p.pos = { ...s.mates[i] }; continue; }
    p.matchStatus = 'bench';
    p.pos = { x: -500, y: -500 };
  }
  if (s.gkTeam === 'home' && !s.mates?.length) { humanSide.pos = { x: FIELD_CX, y: 480 }; }
  if (s.gkTeam === 'home' && s.mates?.length) humanSide.pos = { ...s.mates[0] };
  shooter.pos = s.attacker ? { ...s.attacker } : { x: FIELD_CX, y: 80 };
  st.activePlayerId = humanSide.id;
  const sign = fwd(s.gkTeam);
  st.ball.pos = { x: gk.pos.x + sign * (s.ballDx ?? 220), y: gk.pos.y + (s.ballDy ?? 0) };
  const speed = s.speed ?? 600;
  const goal = { x: s.gkTeam === 'home' ? FIELD_L : FIELD_R, y: FIELD_CY };
  const d = Math.hypot(goal.x - st.ball.pos.x, goal.y - st.ball.pos.y);
  st.ball.vel = { x: (goal.x - st.ball.pos.x) / d * speed, y: (goal.y - st.ball.pos.y) / d * speed };
  st.lastKickTeam = shooterTeam;
  st.lastKickPlayerId = shooter.id;
  st.lastTouchTeam = shooterTeam;
  st.lastTouchPlayerId = shooter.id;
  st.goalkeeperSaveSeq = s.seq;
  return { st, gk, shooter, sign };
}

interface Trace { st: GameState; contactT: number | null; heldFrames: number; maxHeldDrift: number; releaseT: number | null; goals: number }

function play(st0: GameState, gk: Player, seconds: number, hz = 60, input: (t: number, st: GameState) => Partial<InputState> = () => ({})): Trace {
  let st = st0;
  const dt = 1 / hz;
  const tr: Trace = { st, contactT: null, heldFrames: 0, maxHeldDrift: 0, releaseT: null, goals: 0 };
  const score0 = st.score.home + st.score.away;
  let t = 0;
  for (let i = 0; i < seconds * hz; i++) {
    const wasHeld = !!st.goalkeeperHold;
    st = updateGame(st, { ...idle(), ...input(t, st) }, dt, NO_REMOVALS, undefined, { disableOpponentAI: true });
    t += dt;
    if (tr.contactT === null && st.lastTouchPlayerId === gk.id) tr.contactT = t;
    if (st.goalkeeperHold) {
      tr.heldFrames++;
      const spot = heldBallSpot(gk.pos, gk.team);
      tr.maxHeldDrift = Math.max(tr.maxHeldDrift, Math.hypot(st.ball.pos.x - spot.x, st.ball.pos.y - spot.y), Math.hypot(st.ball.vel.x, st.ball.vel.y));
    } else if (wasHeld && tr.releaseT === null) tr.releaseT = t;
  }
  tr.st = st;
  tr.goals = st.score.home + st.score.away - score0;
  return tr;
}

describe('goalkeeper save outcomes through the local engine', () => {
  for (const gkTeam of ['home', 'away'] as const) {
    describe(`${gkTeam} goalkeeper (${gkTeam === 'home' ? 'left' : 'right'} goal)`, () => {
      it('catch: holds the ball still in front of him 0.5–0.8 s, then passes to an open teammate', () => {
        const sign = fwd(gkTeam);
        const gx = gkTeam === 'home' ? FIELD_L + 34 : FIELD_R - 34;
        const mate = { x: gx + sign * 260, y: 160 };
        const { st, gk } = setup({ gkTeam, seq: CATCH_SAVE_SEQ, mates: [mate] });
        let closest = Infinity;
        const tr = play(st, gk, 2.2, 60, (_t, s) => {
          const m = s.players.find((p) => p.team === gkTeam && p.role === 'field_player' && p.matchStatus === 'field')!;
          if (!s.goalkeeperHold && s.lastKickTeam === gkTeam) closest = Math.min(closest, Math.hypot(s.ball.pos.x - m.pos.x, s.ball.pos.y - m.pos.y));
          return {};
        });
        expect(tr.contactT).not.toBeNull();
        expect(tr.releaseT).not.toBeNull();
        const held = tr.releaseT! - tr.contactT!;
        expect(held).toBeGreaterThanOrEqual(GOALKEEPER_SAVE.holdMinSeconds - 0.02);
        expect(held).toBeLessThanOrEqual(GOALKEEPER_SAVE.holdMaxSeconds + 0.04);
        expect(tr.maxHeldDrift).toBeLessThan(0.01);          // pinned, not a free ball
        expect(tr.st.goalkeeperSaveSeq).toBe(CATCH_SAVE_SEQ + 1); // one decision
        expect(tr.st.lastKickTeam).toBe(gkTeam);
        expect(tr.goals).toBe(0);
        // The pass reached the teammate (the home one keeps repositioning
        // while the ball rolls — support positioning).
        expect(closest).toBeLessThan(60);
      });

      it('catch with nobody to pass to: he clears it toward the opponent half', () => {
        const { st, gk } = setup({ gkTeam, seq: CATCH_SAVE_SEQ });
        const tr = play(st, gk, 2.5);
        expect(tr.releaseT).not.toBeNull();
        expect((tr.st.ball.pos.x - gk.pos.x) * fwd(gkTeam)).toBeGreaterThan(300);
        expect(tr.goals).toBe(0);
      });

      it('parry: the ball bounces back into play, free for a follow-up shot', () => {
        const { st, gk, shooter } = setup({ gkTeam, seq: PARRY_SAVE_SEQ, ballDx: 160 });
        let tr = play(st, gk, 0.5);
        expect(tr.st.goalkeeperHold).toBeNull();
        expect(tr.st.goalkeeperSaveSeq).toBe(PARRY_SAVE_SEQ + 1);
        const ballOut = (tr.st.ball.pos.x - gk.pos.x) * fwd(gkTeam);
        expect(ballOut).toBeGreaterThan(R);                   // in front, free
        expect(ballOut).toBeLessThan(160);                    // a rebound, not a clearance
        // Follow-up: a new shot (the shooter's kick) is a new save decision.
        const s2 = tr.st;
        s2.ball.vel = { x: -fwd(gkTeam) * 600, y: 0 };
        s2.lastKickTeam = shooter.team; s2.lastKickPlayerId = shooter.id;
        s2.lastTouchTeam = shooter.team; s2.lastTouchPlayerId = shooter.id;
        tr = play(s2, gk, 0.5);
        expect(tr.st.goalkeeperSaveSeq).toBe(PARRY_SAVE_SEQ + 2);
      });

      it('clear: an immediate long kick toward the opponent half', () => {
        const { st, gk } = setup({ gkTeam, seq: CLEAR_SAVE_SEQ });
        const tr = play(st, gk, 1.5);
        expect(tr.heldFrames).toBe(0);
        expect(tr.st.lastKickTeam).toBe(gkTeam);
        expect((tr.st.ball.pos.x - gk.pos.x) * fwd(gkTeam)).toBeGreaterThan(350);
        expect(tr.goals).toBe(0);
      });
    });
  }

  it('one decision per save at every frame rate, also for close-range and hard shots', () => {
    for (const hz of [30, 60, 120, 144]) for (const gkTeam of ['home', 'away'] as const) {
      for (const [ballDx, speed] of [[60, 450], [40, 800], [250, 800], [120, 380]] as const) {
        for (const seq of [CATCH_SAVE_SEQ, PARRY_SAVE_SEQ, CLEAR_SAVE_SEQ]) {
          const { st, gk } = setup({ gkTeam, seq, ballDx, speed });
          const tr = play(st, gk, 2, hz);
          expect(tr.st.goalkeeperSaveSeq, `${hz} Hz ${gkTeam} dx${ballDx} v${speed} seq${seq}`).toBe(seq + 1);
          expect(tr.goals).toBe(0);
        }
      }
    }
  });

  it('a held ball cannot be played, bumped loose or caught again', () => {
    const { st, gk, shooter } = setup({ gkTeam: 'away', seq: CATCH_SAVE_SEQ });
    let tr = play(st, gk, 0.45);
    expect(tr.st.goalkeeperHold).not.toBeNull();
    // The home human runs into the held ball and kicks it.
    const s = tr.st;
    s.activePlayerId = s.players.find((p) => p.team === 'home' && p.matchStatus === 'field' && p.role === 'field_player')!.id;
    const me = s.players.find((p) => p.id === s.activePlayerId)!;
    me.pos = { x: s.ball.pos.x - 30, y: s.ball.pos.y };
    void shooter;
    tr = play(s, gk, 0.15, 60, (t) => ({ right: true, kick: t < 0.05 }));
    expect(tr.st.goalkeeperHold).not.toBeNull();
    expect(tr.maxHeldDrift).toBeLessThan(0.01);
    expect(tr.st.lastKickTeam).toBe('home'); // the shooter's kick — the human's press did nothing
    tr = play(tr.st, gk, 1);
    expect(tr.st.goalkeeperHold).toBeNull();
    expect(tr.st.goalkeeperSaveSeq).toBe(CATCH_SAVE_SEQ + 1);
    expect(tr.goals).toBe(0);
  });

  it('after the release the ball is a normal free ball again (friction, playable)', () => {
    const { st, gk } = setup({ gkTeam: 'away', seq: CLEAR_SAVE_SEQ });
    let tr = play(st, gk, 0.4);
    const v1 = Math.hypot(tr.st.ball.vel.x, tr.st.ball.vel.y);
    tr = play(tr.st, gk, 0.5);
    const v2 = Math.hypot(tr.st.ball.vel.x, tr.st.ball.vel.y);
    expect(v2).toBeLessThan(v1);
    expect(tr.st.goalkeeperHold).toBeNull();
    // The home player can take it: put him next to the ball and kick it on.
    const s = tr.st;
    const me = s.players.find((p) => p.id === s.activePlayerId)!;
    me.pos = { x: s.ball.pos.x - 25, y: s.ball.pos.y };
    s.ball.vel = { x: 0, y: 0 };
    tr = play(s, gk, 0.1, 60, (t) => ({ kick: t < 0.05 }));
    expect(tr.st.lastKickPlayerId).toBe(me.id);
  });

  it('a dribble into the goalkeeper is ordinary contact, not a save', () => {
    const st = createInitialState(NO_REMOVALS, undefined, LIVE_GAMEPLAY_PROFILE);
    const gk = st.players.find((p) => p.team === 'away' && p.role === 'goalkeeper')!;
    const me = st.players.find((p) => p.id === st.activePlayerId)!;
    for (const p of st.players) if (p !== gk && p !== me) { p.matchStatus = 'bench'; p.pos = { x: -500, y: -500 }; }
    me.pos = { x: 700, y: FIELD_CY };
    st.ball.pos = { x: 730, y: FIELD_CY };
    st.lastKickTeam = 'home';
    st.lastKickPlayerId = me.id;
    const tr = play(st, gk, 1.5, 60, () => ({ right: true }));
    expect(tr.contactT).not.toBeNull();
    expect(tr.st.goalkeeperSaveSeq).toBeNull();
  });

  it('a large sample of shots: ~30/50/20, never an own goal, never through him', () => {
    const n = { catch: 0, parry: 0, clear: 0 };
    let saves = 0;
    for (let k = 0; k < 600; k++) {
      const gkTeam: Team = k % 2 ? 'home' : 'away';
      const r = (i: number) => saveRoll(k, i + 20);
      const { st, gk } = setup({
        gkTeam, seq: Math.floor(r(0) * 1e6), ballDx: 40 + r(1) * 260, ballDy: (r(2) - 0.5) * 60, speed: 350 + r(3) * 450,
        mates: r(4) < 0.5 ? [{ x: FIELD_CX + fwd(gkTeam) * -150, y: 100 + r(5) * 360 }] : undefined,
        attacker: { x: FIELD_CX + fwd(gkTeam) * (100 + r(6) * 250), y: 80 + r(7) * 400 },
      });
      const seq = st.goalkeeperSaveSeq!;
      const tr = play(st, gk, 2.5, [30, 60, 144][k % 3]);
      if (tr.st.goalkeeperSaveSeq === seq) continue; // missed him
      saves++;
      const outcome = saveOutcome(saveRoll(seq));
      n[outcome]++;
      // A caught or cleared ball never ends in either net (a parry is the
      // old bounce — a rebound may still go in, as before).
      if (outcome !== 'parry') expect(tr.goals, `shot ${k}`).toBe(0);
    }
    expect(saves).toBeGreaterThan(400);
    expect(Math.abs(n.catch / saves - 0.3)).toBeLessThan(0.07);
    expect(Math.abs(n.parry / saves - 0.5)).toBeLessThan(0.07);
    expect(Math.abs(n.clear / saves - 0.2)).toBeLessThan(0.07);
    void KICK_RANGE;
  });
});
