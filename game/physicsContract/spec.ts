// Declarative physics-contract scenarios shared by BOTH engines.
// See docs/gameplay-physics-contract.md. Each engine has its own harness
// that replays the same scenario (start, ball offset, held inputs) and
// reports the same ContractMetrics:
//   - local:  game/physicsContract/harness.ts (this repo, vitest)
//   - server: replayed by the same scenario list against project-hub-api
//             and frozen into server-baseline.json (see README note there).
// Nothing here changes gameplay — it only describes what we measure.

export interface ContractInput { up?: boolean; down?: boolean; left?: boolean; right?: boolean; kick?: boolean }

export interface ContractStep {
  input: ContractInput;
  seconds: number;
  // Turn / probe clock starts at the beginning of this step.
  mark?: boolean;
}

export interface ContractScenario {
  name: string;
  kind?: 'move' | 'bench' | 'removal';
  start: { x: number; y: number };
  // Ball position relative to the player at t=0.
  ball: { x: number; y: number };
  // Static opponent field player, relative to the player's start.
  defender?: { x: number; y: number };
  // Keep the away goalkeeper in play.
  goalkeeper?: boolean;
  steps: ContractStep[];
  // Seconds after the marked step at which ball distance / relative angle
  // are sampled.
  probes?: string[];
}

export interface ContractMetrics {
  playerX?: number; playerY?: number; minPlayerY?: number; maxPlayerY?: number;
  ballX?: number; ballY?: number; ballSpeed?: number;
  // Total time the ball spent outside BALL_CONTROL_RADIUS of the player.
  lossSeconds?: number;
  // Distinct ball↔defender contacts.
  contacts?: number;
  // Ball x travel 0.9 s after the kick button was released.
  shotTravel?: number | null;
  goal?: boolean;
  benchSeconds?: number;
  at: Record<string, { dist: number; relDeg: number; ballY: number }>;
}

const R = { right: true }, L = { left: true }, U = { up: true }, D = { down: true };
const FWD_BALL = { x: 28, y: 0 };
const NO_BALL = { x: 300, y: 150 };
const TURN_PROBES = ['0.3', '0.6', '1'];

export const CONTRACT_SCENARIOS: ContractScenario[] = [
  { name: 'straight run', start: { x: 150, y: 400 }, ball: NO_BALL, steps: [{ input: R, seconds: 1 }] },
  { name: 'diagonal run', start: { x: 150, y: 400 }, ball: NO_BALL, steps: [{ input: { right: true, up: true }, seconds: 1 }] },
  { name: 'run into top boundary', start: { x: 300, y: 120 }, ball: NO_BALL, steps: [{ input: U, seconds: 1.5 }] },
  { name: 'dribble straight', start: { x: 150, y: 280 }, ball: FWD_BALL, steps: [{ input: R, seconds: 1.5 }] },
  { name: 'turn 90 (R→U)', start: { x: 200, y: 380 }, ball: FWD_BALL, steps: [{ input: R, seconds: 1 }, { input: U, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'turn 180 (R→L)', start: { x: 200, y: 280 }, ball: FWD_BALL, steps: [{ input: R, seconds: 1 }, { input: L, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'top line pull down (R→D)', start: { x: 200, y: 80 }, ball: FWD_BALL, steps: [{ input: R, seconds: 1 }, { input: D, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'bottom line pull up (R→U)', start: { x: 200, y: 480 }, ball: FWD_BALL, steps: [{ input: R, seconds: 1 }, { input: U, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'short kick', start: { x: 250, y: 280 }, ball: FWD_BALL, steps: [{ input: R, seconds: 0.3 }, { input: { kick: true }, seconds: 0.05 }, { input: {}, seconds: 1 }] },
  { name: 'charged kick (0.5 s)', start: { x: 250, y: 280 }, ball: FWD_BALL, steps: [{ input: R, seconds: 0.3 }, { input: { right: true, kick: true }, seconds: 0.5 }, { input: {}, seconds: 1 }] },
  { name: 'defender contact', start: { x: 200, y: 280 }, ball: FWD_BALL, defender: { x: 140, y: 0 }, steps: [{ input: R, seconds: 1.5 }] },
  { name: 'goalkeeper blocks shot', start: { x: 690, y: 280 }, ball: FWD_BALL, goalkeeper: true, steps: [{ input: R, seconds: 0.2 }, { input: { right: true, kick: true }, seconds: 0.3 }, { input: {}, seconds: 1.2 }] },
  { name: 'žolík entry + expiry', kind: 'bench', start: { x: 0, y: 0 }, ball: NO_BALL, steps: [] },
  { name: 'temporary weakening', kind: 'removal', start: { x: 0, y: 0 }, ball: NO_BALL, steps: [] },
];

// Comparison tolerances: loose enough for float / 30 Hz-vs-60 Hz step
// differences, tight enough that a real behaviour change shows up.
export const TOLERANCE = {
  positionPx: 6,
  // Relative tolerance on shot travel / ball speed.
  relative: 0.08,
  lossSeconds: 0.12,
  relDeg: 20,
  benchSeconds: 0.1,
};

// Differences between the two engines that are KNOWN today (audit
// 2026-10-31) — reported, not "fixed". A difference on any other
// scenario/metric is a new divergence and fails the test. When one of
// these gets unified, remove it here so it can't silently regress.
export const KNOWN_DIVERGENCES: Record<string, { metrics: string[]; why: string }> = {
  'run into top boundary': { metrics: ['minPlayerY', 'playerY'], why: 'server movePlayerByInput does not clamp the controlled player to the pitch' },
  'turn 90 (R→U)': { metrics: ['*'], why: 'different control radii (57 vs 44) and per-tick vs per-frame damping' },
  'turn 180 (R→L)': { metrics: ['*'], why: 'different control radii (57 vs 44) and per-tick vs per-frame damping' },
  'top line pull down (R→D)': { metrics: ['*'], why: 'different control radii + server player not clamped at the line' },
  'bottom line pull up (R→U)': { metrics: ['*'], why: 'different control radii (57 vs 44)' },
  'dribble straight': { metrics: ['ballX', 'ballY', 'ballSpeed', 'at'], why: 'equilibrium ball distance differs (control radius / damping)' },
  'short kick': { metrics: ['*'], why: 'local own-shot braking by ball control (frame-rate dependent) + KICK_RANGE 57 vs 40' },
  'charged kick (0.5 s)': { metrics: ['*'], why: 'KICK_MAX_CHARGE_MS 500 vs 1500 + local own-shot braking' },
  'defender contact': { metrics: ['*'], why: 'control/retention radii differ (57/55 vs 44/42)' },
  'goalkeeper blocks shot': { metrics: ['*'], why: 'shot power differs (charge curve, own-shot braking)' },
};
