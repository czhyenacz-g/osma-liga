import { it, expect } from 'vitest';
import { runLocalContractScenario } from './physicsContract/harness';
import type { ContractInput, ContractScenario } from './physicsContract/spec';
import { LIVE_GAMEPLAY_PROFILE } from './gameplayProfiles';
import { SHOT_AIM } from './shotAim';
import { PLAYER_RADIUS, BALL_RADIUS } from './constants';
import type { GameState } from './types';

// DIAGNOSTIC (shooting audit 2026-11-01, aimed charge since then) — prints
// goal / save / miss rates; asserts only the headline result. Human
// dribbles right toward the away goal with the real away goalkeeper AI,
// then charges and shoots from (x, y). Before the aimed charge (audit, max
// charge): straight 24 % goals / 76 % saved, best of 4 kick keys 24 %.

const HZ = 60;
const XS = [580, 625, 670, 715, 760];
const YS = [200, 240, 280, 320, 360];
const RUN = 0.45;
const CARRY = 189; // 0.9 × 210, the dribble speed before the charge
const CONTACT = PLAYER_RADIUS + BALL_RADIUS + 0.5;

type Outcome = 'goal' | 'save' | 'miss' | 'noshot';

// aim: key held during the charge (none = goal centre). The start is set
// back so that the release happens at (x, y).
// aimFor: seconds the aim key is held (default the whole charge), then kick only.
function shoot(x: number, y: number, aim: ContractInput, charge: number, aimFor = charge): Outcome {
  const R = { right: true };
  const sc: ContractScenario = {
    name: 'diag', start: { x: x - CARRY * RUN - 210 * SHOT_AIM.chargeSpeedFactor * charge, y }, ball: { x: 30, y: 0 }, goalkeeper: true,
    steps: [
      { input: R, seconds: RUN },
      { input: { ...R, kick: true }, seconds: 1 / HZ },
      { input: { ...aim, kick: true }, seconds: aimFor },
      ...(aimFor < charge ? [{ input: { kick: true }, seconds: charge - aimFor }] : []),
      { input: {}, seconds: 2 },
    ],
  };
  let released = false, saved = false, prevSpeed = 0;
  const m = runLocalContractScenario(sc, HZ, LIVE_GAMEPLAY_PROFILE, (s: GameState) => {
    const v = Math.hypot(s.ball.vel.x, s.ball.vel.y);
    if (!released && v > prevSpeed + 250) released = true;
    prevSpeed = v;
    if (released && !saved) {
      const gk = s.players.find((p) => p.team === 'away' && p.role === 'goalkeeper')!;
      if (Math.hypot(gk.pos.x - s.ball.pos.x, gk.pos.y - s.ball.pos.y) < CONTACT && s.phase !== 'goal') saved = true;
    }
  });
  if (m.goal) return 'goal';
  if (!released) return 'noshot';
  return saved ? 'save' : 'miss';
}

function rate(cases: Outcome[]) {
  const n = cases.length, c = (o: Outcome) => Math.round((cases.filter((x) => x === o).length / n) * 100);
  return { n, goal: `${c('goal')} %`, save: `${c('save')} %`, miss: `${c('miss')} %`, noshot: `${c('noshot')} %` };
}

const grid = (f: (x: number, y: number) => Outcome) => XS.flatMap((x) => YS.map((y) => f(x, y)));
// The far side of the goal from the shooter (centre: up).
const far = (y: number): ContractInput => (y < 280 ? { down: true } : { up: true });

it('shooting audit — aimed charge: goal / save / miss', () => {
  const table: Record<string, ReturnType<typeof rate>> = {};
  for (const [cname, charge] of Object.entries({ 'krátké 0,15 s': 0.15, 'dlouhé 0,5 s': 0.5 })) {
    table[`bez míření = střed (${cname})`] = rate(grid((x, y) => shoot(x, y, {}, charge)));
    table[`↑ celou dobu (${cname})`] = rate(grid((x, y) => shoot(x, y, { up: true }, charge)));
    table[`↓ celou dobu (${cname})`] = rate(grid((x, y) => shoot(x, y, { down: true }, charge)));
    table[`na vzdálenější stranu (${cname})`] = rate(grid((x, y) => shoot(x, y, far(y), charge)));
  }
  table['vzdálenější třetina (míření 0,3 s, nabití 0,5 s)'] = rate(grid((x, y) => shoot(x, y, far(y), 0.5, 0.3)));
  console.table(table);
  const best = grid((x, y) => shoot(x, y, far(y), 0.5, 0.3));
  // Aiming beats the goalkeeper clearly more often than the old shots (24 %).
  expect(best.filter((o) => o === 'goal').length / best.length).toBeGreaterThan(0.3);
  expect(best.filter((o) => o === 'noshot').length).toBe(0);
});

it('shooting audit — per-position grid (long charge)', () => {
  const rows: Record<string, Record<string, string>> = {};
  for (const y of YS) {
    rows[`y=${y}`] = {};
    for (const x of XS) rows[`y=${y}`][`x=${x}`] = `${shoot(x, y, {}, 0.5)[0]}/${shoot(x, y, far(y), 0.5, 0.3)[0]}`;
  }
  console.log('legend: bez míření / vzdálenější třetina (míření 0,3 s) (g=gól, s=chyceno, m=mimo, n=nevystřeleno)');
  console.table(rows);
});
