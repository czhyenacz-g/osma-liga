import { describe, it, expect } from 'vitest';
import { CONTRACT_SCENARIOS, type ContractScenario } from './physicsContract/spec';
import { runLocalContractScenario } from './physicsContract/harness';
import { BALL_PHYSICS_V3 } from './gameplayProfiles';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import { FIELD_L, FIELD_R, FIELD_T, FIELD_B, PLAYER_RADIUS, BALL_RADIUS } from './constants';
import type { GameState, InputState } from './types';

// EXPERIMENTAL V3 prepared turn (dribblePrep.ts) — behaviour checks on top
// of the physics contract scenarios. Only the v3-dribble profile is
// affected; classic / v2-* drift is guarded in physicsContract.test.ts.

const HZ = [30, 60, 120, 144];
const byName = (name: string) => CONTRACT_SCENARIOS.find((s) => s.name === name)!;
const v3 = (sc: ContractScenario, hz = 60, observe?: (s: GameState, id: string) => void) =>
  runLocalContractScenario(sc, hz, 'v3-dribble', observe);
const classic = (sc: ContractScenario, hz = 60) => runLocalContractScenario(sc, hz, 'classic');

const TURNS_90 = ['turn 90 (R→U)', 'turn 90 (R→D)', 'top line pull down (R→D)', 'bottom line pull up (R→U)', 'diagonal change (R→RD→D)', 'stop and restart (R, stop, D)'];

describe('V3 prepared turn — open play (no opponent near)', () => {
  it('90° turns keep the ball and bring it in front within ~0.4 s on every refresh rate', () => {
    for (const name of TURNS_90) {
      const fronts = HZ.map((hz) => {
        const m = v3(byName(name), hz);
        expect(m.lossSeconds, `${name} @ ${hz}`).toBe(0);
        return m.frontSeconds;
      });
      for (const f of fronts) expect(f, name).not.toBeNull();
      expect(Math.max(...(fronts as number[])), name).toBeLessThanOrEqual(0.45);
      // Frequency-stable: 30 Hz vs 144 Hz within 0.15 s.
      expect(Math.max(...(fronts as number[])) - Math.min(...(fronts as number[])), name).toBeLessThanOrEqual(0.15);
    }
  });

  it('classic loses the ball on the same 90° turns (what V3 is for)', () => {
    for (const name of TURNS_90) expect(classic(byName(name)).lossSeconds, name).toBeGreaterThan(0.5);
  });

  it('180° is possible but clearly slower than 90°', () => {
    for (const hz of HZ) {
      const t180 = v3(byName('turn 180 (R→L)'), hz).frontSeconds!;
      const t90 = v3(byName('turn 90 (R→D)'), hz).frontSeconds!;
      expect(t180).not.toBeNull();
      expect(t180 - t90).toBeGreaterThanOrEqual(0.1);
    }
  });

  it('straight dribbling is untouched (no prep starts)', () => {
    let prepFrames = 0;
    const m = v3(byName('dribble straight'), 60, (s) => { if (s.dribblePrep.phase === 'prep') prepFrames++; });
    expect(prepFrames).toBe(0);
    expect(m).toEqual(classic(byName('dribble straight')));
  });
});

describe('V3 prepared turn — duels stay real', () => {
  for (const name of ['turn with defender ahead', 'turn with defender beside', 'turn between two defenders']) {
    it(`${name}: no assist, identical to classic`, () => {
      for (const hz of HZ) expect(v3(byName(name), hz), `${hz} Hz`).toEqual(classic(byName(name), hz));
    });
  }

  it('the assist switches off the moment an opponent gets within the radius', () => {
    let prepNearOpponent = 0;
    for (const name of ['turn with defender ahead', 'turn with defender beside', 'turn between two defenders', 'turn with defender behind']) {
      v3(byName(name), 60, (s) => {
        if (s.dribblePrep.phase !== 'prep') return;
        const near = s.players.some((p) => p.team === 'away' && p.matchStatus !== 'bench'
          && Math.hypot(p.pos.x - s.ball.pos.x, p.pos.y - s.ball.pos.y) <= BALL_PHYSICS_V3.noOpponentRadius);
        if (near) prepNearOpponent++;
      });
    }
    // At most the single frame in which the opponent closes in.
    expect(prepNearOpponent).toBeLessThanOrEqual(1);
  });
});

describe('V3 prepared turn — drag-back away from pressure', () => {
  // Dribble right into a defender standing ahead, then reverse (toward the
  // own goal). gap = defender ↔ ball distance at the moment of the turn.
  const reverse = (gap: number, defenderY = 0): ContractScenario => ({
    name: `reverse, defender ${gap} px ahead of the ball`, start: { x: 250, y: 280 }, ball: { x: 30, y: 0 },
    defender: { x: 126 + 32 + gap, y: defenderY },
    steps: [{ input: { right: true }, seconds: 0.6 }, { input: { left: true }, seconds: 1.5, mark: true }],
    probes: ['0.3', '0.6', '1'],
  });

  it('reversing away from a pressing defender keeps the ball (classic loses it)', () => {
    for (const gap of [50, 70, 90]) {
      for (const hz of HZ) {
        const m = v3(reverse(gap), hz);
        expect(m.lossSeconds, `gap ${gap} @ ${hz}`).toBe(0);
        expect(m.frontSeconds, `gap ${gap} @ ${hz}`).not.toBeNull();
        expect(m.frontSeconds!, `gap ${gap} @ ${hz}`).toBeLessThanOrEqual(0.6);
      }
      expect(classic(reverse(gap)).lossSeconds, `classic gap ${gap}`).toBeGreaterThan(1);
    }
  });

  it('the ball goes round the side away from the defender', () => {
    for (const side of [1, -1]) {
      let worst = Infinity;
      v3(reverse(50, side * 20), 60, (s) => {
        if (s.dribblePrep.phase !== 'prep') return;
        const d = s.players.find((p) => p.team === 'away' && p.matchStatus !== 'bench' && p.role === 'field_player')!;
        worst = Math.min(worst, Math.hypot(d.pos.x - s.ball.pos.x, d.pos.y - s.ball.pos.y));
      });
      expect(worst, `defender ${side > 0 ? 'below' : 'above'}`).toBeGreaterThan(BALL_PHYSICS_V3.shieldContactRadius);
    }
  });

  it('no assist when turning INTO a near opponent or when the opponent already touches the ball', () => {
    const steps = [{ input: { right: true }, seconds: 0.6 }, { input: { left: true }, seconds: 1, mark: true }];
    // Passed on the run; at the turn it sits just behind the player, in
    // the new direction, ~60 px from the ball.
    const into: ContractScenario = {
      name: 'reverse into a defender behind', start: { x: 300, y: 280 }, ball: { x: 30, y: 0 }, defender: { x: 110, y: 38 }, steps, probes: ['0.3', '0.6'],
    };
    // Ahead and already on the ball when the player turns.
    const touching: ContractScenario = {
      name: 'reverse with defender on the ball', start: { x: 300, y: 280 }, ball: { x: 30, y: 0 }, defender: { x: 185, y: 0 }, steps, probes: ['0.3', '0.6'],
    };
    // Without the defender the same reversal is assisted — the cases below
    // are switched off by the opponent, not by anything else.
    let freePrep = 0;
    v3({ ...into, defender: undefined }, 60, (s) => { if (s.dribblePrep.phase === 'prep') freePrep++; });
    expect(freePrep).toBeGreaterThan(0);
    for (const sc of [into, touching]) {
      for (const hz of HZ) {
        let prepFrames = 0;
        const m = v3(sc, hz, (s) => { if (s.dribblePrep.phase === 'prep') prepFrames++; });
        expect(prepFrames, `${sc.name} @ ${hz}`).toBe(0);
        expect(m, `${sc.name} @ ${hz}`).toEqual(classic(sc, hz));
      }
    }
  });
});

describe('V3 prepared turn — no exploits, no unnatural ball motion', () => {
  it('a shot is never pulled back (turning right after a shot = classic behaviour)', () => {
    const m = v3(byName('turn right after a shot'));
    expect(m.lossSeconds).toBeGreaterThan(0.8);
    expect(m.frontSeconds).toBeNull();
  });

  it('a loose ball rushing past is not pulled in', () => {
    const pass: ContractScenario = {
      name: 'loose ball crossing', start: { x: 300, y: 300 }, ball: { x: 45, y: -60 }, ballVel: { x: -320, y: 0 },
      steps: [{ input: { down: true }, seconds: 0.6 }],
    };
    let prepFrames = 0;
    v3(pass, 60, (s) => { if (s.dribblePrep.phase === 'prep') prepFrames++; });
    expect(prepFrames).toBe(0);
  });

  it('no orbiting: within a continuous prep the ball never winds more than ~200° round the player', () => {
    for (const name of [...TURNS_90, 'turn 180 (R→L)', 'rapid direction changes', 'turn after rebound (ball arriving)']) {
      for (const hz of HZ) {
        let last: number | null = null, swept = 0, worst = 0;
        v3(byName(name), hz, (s, id) => {
          const p = s.players.find((q) => q.id === id)!;
          const a = Math.atan2(s.ball.pos.y - p.pos.y, s.ball.pos.x - p.pos.x);
          if (s.dribblePrep.phase === 'prep' && last !== null) {
            // Signed: an orbit keeps turning the same way; a zig-zag that
            // follows the controls back and forth does not add up.
            swept += Math.atan2(Math.sin(a - last), Math.cos(a - last));
            worst = Math.max(worst, Math.abs(swept));
          } else if (s.dribblePrep.phase !== 'prep') swept = 0;
          last = a;
        });
        expect(worst * 180 / Math.PI, `${name} @ ${hz}`).toBeLessThan(200);
      }
    }
  });

  it('no endless assist: continuous prep is bounded by the chain budget, even with endless zig-zags', () => {
    for (const hz of HZ) {
      const zigzag: ContractScenario = {
        name: 'endless zig-zag', start: { x: 200, y: 280 }, ball: { x: 28, y: 0 },
        steps: [{ input: { right: true }, seconds: 0.6 }, ...Array.from({ length: 40 }, (_, i) => ({
          input: i % 2 ? { right: true } : (i % 4 ? { up: true } : { down: true }), seconds: 0.2,
        }))],
      };
      let run = 0, worst = 0, prepTime = 0;
      v3(zigzag, hz, (s) => {
        if (s.dribblePrep.phase === 'prep') { run += 1 / hz; prepTime += 1 / hz; worst = Math.max(worst, run); } else run = 0;
      });
      expect(worst, `${hz} Hz`).toBeLessThanOrEqual(BALL_PHYSICS_V3.maxChainSeconds + 1.5 / hz);
      // 8.6 s of zig-zag can't be assisted throughout.
      expect(prepTime, `${hz} Hz`).toBeLessThan(8.6 * 0.8);
    }
  });

  it('bounded ball speed and acceleration while the ball is carried round', () => {
    const contact = PLAYER_RADIUS + BALL_RADIUS + 0.5;
    for (const name of [...TURNS_90, 'turn 180 (R→L)', 'rapid direction changes']) {
      for (const hz of HZ) {
        let prev: { x: number; y: number } | null = null, maxSpeed = 0, maxAccel = 0;
        v3(byName(name), hz, (s, id) => {
          const p = s.players.find((q) => q.id === id)!;
          const v = { ...s.ball.vel };
          if (s.dribblePrep.phase === 'prep') {
            maxSpeed = Math.max(maxSpeed, Math.hypot(v.x, v.y));
            const touching = Math.hypot(s.ball.pos.x - p.pos.x, s.ball.pos.y - p.pos.y) < contact;
            if (prev && !touching) maxAccel = Math.max(maxAccel, Math.hypot(v.x - prev.x, v.y - prev.y) * hz);
          }
          prev = v;
        });
        // player prep speed + arc speed + radial correction, small margin
        expect(maxSpeed, `${name} @ ${hz}`).toBeLessThan(BALL_PHYSICS_V3.prepPlayerSpeed + BALL_PHYSICS_V3.arcSpeed + 60);
        // maxAccel + friction/wall share (the player's own speed step is
        // not on the ball)
        expect(maxAccel, `${name} @ ${hz}`).toBeLessThan(BALL_PHYSICS_V3.maxAccel + 800);
      }
    }
  });

  it('the ball never leaves the pitch during a turn at the touchline', () => {
    for (const name of ['top line pull down (R→D)', 'bottom line pull up (R→U)']) {
      for (const hz of HZ) {
        v3(byName(name), hz, (s) => {
          expect(s.ball.pos.y).toBeGreaterThanOrEqual(FIELD_T);
          expect(s.ball.pos.y).toBeLessThanOrEqual(FIELD_B);
        });
      }
    }
  });
});

describe('V3 prepared turn — profile switching and full matches', () => {
  const noInput = (): InputState => ({ up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false });

  it('switching the profile away mid-prep drops the prep state on the next tick', () => {
    let state = createInitialState({ enabled: false, randomSubstitutionEnabled: false, benchDurationSeconds: 10, minTriggerSecond: 0, maxTriggerSecond: 0 } as never);
    state.phase = 'playing';
    state.gameplayProfile = 'v3-dribble';
    state.dribblePrep = { ...state.dribblePrep, playerId: state.activePlayerId, phase: 'prep', remaining: 0.3 };
    state.gameplayProfile = 'classic';
    state = updateGame(state, { ...noInput(), down: true }, 1 / 60);
    expect(state.dribblePrep.phase).toBe('none');
  });

  it('v3 against the real bot: 20 s of play, physics stays sane', () => {
    for (const disableOpponentAI of [true, false]) {
      let state = createInitialState();
      state.phase = 'playing';
      state.gameplayProfile = 'v3-dribble';
      const dirs: Partial<InputState>[] = [{ right: true }, { down: true }, { right: true, up: true }, { left: true }, { up: true }, {}];
      for (let i = 0; i < 20 * 60; i++) {
        const input = { ...noInput(), ...dirs[Math.floor(i / 25) % dirs.length], kick: i % 97 === 0 };
        state = updateGame(state, input, 1 / 60, undefined, undefined, { disableOpponentAI });
        if (state.phase === 'goal') state.goalTimer = 0;
        expect(Number.isFinite(state.ball.pos.x) && Number.isFinite(state.ball.pos.y)).toBe(true);
        expect(state.ball.pos.x).toBeGreaterThanOrEqual(FIELD_L - 40);
        expect(state.ball.pos.x).toBeLessThanOrEqual(FIELD_R + 40);
      }
    }
  });
});
