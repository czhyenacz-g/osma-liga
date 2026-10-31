import { describe, it, expect } from 'vitest';
import { CONTRACT_SCENARIOS, KNOWN_DIVERGENCES, TOLERANCE, type ContractMetrics } from './spec';
import { runLocalContractScenario } from './harness';
import { LIVE_GAMEPLAY_PROFILE } from '../gameplayProfiles';
import { FIELD_T, FIELD_B, PLAYER_SPEED, BENCH_DEPLOY_DURATION_MS } from '../constants';
import serverBaseline from './server-baseline.json';
import localBaseline from './local-baseline.json';

// Physics contract (docs/gameplay-physics-contract.md):
//  1. invariants the local engine must hold,
//  2. local vs server over the SAME scenarios — a difference is either a
//     KNOWN divergence (spec.ts) or a NEW one (fails),
//  3. the production `classic` profile must not drift from its baseline,
//  4. the experimental V2 profiles do what they claim and nothing else.
// server-baseline.json is generated from project-hub-api (commit inside the
// file); regenerate it whenever the server engine changes.

type Flat = Record<string, number | boolean | null>;
function flatten(m: ContractMetrics): Flat {
  const out: Flat = {};
  for (const [k, v] of Object.entries(m)) {
    if (k === 'at') for (const [probe, s] of Object.entries(v as ContractMetrics['at'])) {
      out[`at.${probe}.dist`] = s.dist; out[`at.${probe}.relDeg`] = s.relDeg; out[`at.${probe}.ballY`] = s.ballY;
    } else out[k] = v as number | boolean | null;
  }
  return out;
}

function tolerance(key: string, ref: number): number {
  if (key === 'shotTravel' || key === 'ballSpeed' || key === 'maxBallSpeed') return Math.max(TOLERANCE.positionPx, Math.abs(ref) * TOLERANCE.relative);
  if (key === 'lossSeconds') return TOLERANCE.lossSeconds;
  if (key === 'frontSeconds') return TOLERANCE.lossSeconds;
  if (key === 'benchSeconds') return TOLERANCE.benchSeconds;
  if (key.endsWith('relDeg')) return TOLERANCE.relDeg;
  return TOLERANCE.positionPx;
}

function differences(a: ContractMetrics, b: ContractMetrics): string[] {
  const fa = flatten(a), fb = flatten(b), out: string[] = [];
  for (const key of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
    const va = fa[key], vb = fb[key];
    if (typeof va === 'number' && typeof vb === 'number') {
      if (Math.abs(va - vb) > tolerance(key, vb)) out.push(`${key}: ${va} vs ${vb}`);
    } else if (va !== vb) out.push(`${key}: ${va} vs ${vb}`);
  }
  return out;
}

const server = serverBaseline.scenarios as Record<string, ContractMetrics>;
const baseline = localBaseline as Record<string, Record<string, Record<string, ContractMetrics>>>;
const byName = (name: string) => CONTRACT_SCENARIOS.find((s) => s.name === name)!;
const local = (name: string, hz = 60, profile: Parameters<typeof runLocalContractScenario>[2] = 'classic') =>
  runLocalContractScenario(byName(name), hz, profile);

describe('physics contract — local engine invariants (classic)', () => {
  it('human player runs at PlayerStats speed, diagonals are normalized', () => {
    expect(local('straight run').playerX! - 150).toBeCloseTo(PLAYER_SPEED, -1);
    const d = local('diagonal run');
    expect(Math.hypot(d.playerX! - 150, d.playerY! - 400)).toBeCloseTo(PLAYER_SPEED, -1);
  });
  it('the controlled player stays inside the pitch', () => {
    expect(local('run into top boundary').minPlayerY!).toBeGreaterThanOrEqual(FIELD_T);
  });
  it('straight dribble keeps the ball', () => {
    expect(local('dribble straight').lossSeconds).toBe(0);
  });
  it('žolík lasts BENCH_DEPLOY_DURATION_MS and is spent afterwards', () => {
    const m = local('žolík entry + expiry');
    expect(m.benchSeconds).toBeCloseTo(BENCH_DEPLOY_DURATION_MS / 1000, 1);
    expect(m.contacts).toBe(1);
  });
  it('temporary weakening sits ~10 s on the bench below the bottom line', () => {
    const m = local('temporary weakening');
    expect(m.benchSeconds).toBeCloseTo(10, 0);
    expect(m.maxPlayerY!).toBeGreaterThan(FIELD_B);
  });
});

describe('physics contract — local (60 Hz) vs server (30 Hz) on the same scenarios', () => {
  for (const sc of CONTRACT_SCENARIOS) {
    const known = KNOWN_DIVERGENCES[sc.name];
    it(`${sc.name}${known ? ' [known divergence]' : ''}`, () => {
      const diffs = differences(local(sc.name, 60, LIVE_GAMEPLAY_PROFILE), server[sc.name]);
      const unexpected = known
        ? diffs.filter((d) => !known.metrics.includes('*') && !known.metrics.some((m) => d.startsWith(m)))
        : diffs;
      // A NEW divergence fails; a known one is tolerated (and listed in the doc).
      expect(unexpected, `new local/server divergence in "${sc.name}"`).toEqual([]);
      if (known && diffs.length === 0) {
        console.warn(`[physics contract] "${sc.name}" now matches the server — drop it from KNOWN_DIVERGENCES`);
      }
    });
  }
});

// local-baseline.json was generated from the engine BEFORE the V3
// experiment (classic = production, v2-* = earlier experiments) — later
// experiments must leave all of them untouched.
describe('physics contract — existing profiles do not drift', () => {
  for (const profile of ['classic', 'v2-shot', 'v2-turn'] as const) {
    for (const hz of [30, 60, 120, 144]) {
      it(`${profile} @ ${hz} Hz matches local-baseline.json`, () => {
        for (const sc of CONTRACT_SCENARIOS) {
          expect(differences(local(sc.name, hz, profile), baseline[profile][hz][sc.name]), `${sc.name} @ ${hz} Hz`).toEqual([]);
        }
      });
    }
  }
});

describe('physics contract — EXPERIMENTAL V2 profiles', () => {
  const HZ = [30, 60, 120, 144];
  const spread = (xs: number[]) => (Math.max(...xs) - Math.min(...xs)) / Math.max(...xs);

  it('classic: short-kick travel depends on refresh rate (the audited bug, kept as-is)', () => {
    const travel = HZ.map((hz) => local('short kick', hz).shotTravel!);
    expect(spread(travel)).toBeGreaterThan(0.5);
  });

  it('v2-shot: short and charged kick travel no longer depends on refresh rate', () => {
    for (const name of ['short kick', 'charged kick (0.5 s)']) {
      const travel = HZ.map((hz) => local(name, hz, 'v2-shot').shotTravel!);
      expect(spread(travel), name).toBeLessThan(0.12);
    }
    // Charging still matters.
    expect(local('charged kick (0.5 s)', 60, 'v2-shot').shotTravel!).toBeGreaterThan(local('short kick', 60, 'v2-shot').shotTravel!);
  });

  it('v2-shot changes nothing in scenarios without a kick', () => {
    for (const name of ['straight run', 'dribble straight', 'turn 90 (R→U)', 'turn 180 (R→L)', 'defender contact']) {
      expect(differences(local(name, 60, 'v2-shot'), local(name, 60))).toEqual([]);
    }
  });

  it('v2-turn keeps the ball closer through turns but does not make them automatic', () => {
    for (const name of ['turn 90 (R→U)', 'turn 180 (R→L)', 'top line pull down (R→D)', 'bottom line pull up (R→U)']) {
      const c = local(name), t = local(name, 60, 'v2-turn');
      expect(t.at['0.6'].dist, name).toBeLessThanOrEqual(c.at['0.6'].dist + 1);
      // Still loses the ball for a while — no glue.
      expect(t.lossSeconds!, name).toBeGreaterThan(0);
    }
  });

  it('v2-turn: a defender can still win the ball (no protection in duels)', () => {
    expect(differences(local('defender contact', 60, 'v2-turn'), local('defender contact'))).toEqual([]);
  });
});
