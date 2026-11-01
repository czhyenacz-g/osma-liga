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
  // A second static opponent (relative to the player's start).
  defender2?: { x: number; y: number };
  // Initial ball velocity (px/s), e.g. a ball arriving off a rebound.
  ballVel?: { x: number; y: number };
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
  // Seconds after the marked step until the ball sits in front of the
  // player (≤ 30° off the held direction, ≤ 50 px) and stays there 0.2 s;
  // null = never within the scenario.
  frontSeconds?: number | null;
  maxBallSpeed?: number;
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
  // V3 prepared-turn set (also measured for every profile).
  { name: 'turn 90 (R→D)', start: { x: 200, y: 200 }, ball: FWD_BALL, steps: [{ input: R, seconds: 1 }, { input: D, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'diagonal change (R→RD→D)', start: { x: 200, y: 160 }, ball: FWD_BALL, steps: [{ input: R, seconds: 1 }, { input: { right: true, down: true }, seconds: 0.15, mark: true }, { input: D, seconds: 1.05 }], probes: TURN_PROBES },
  { name: 'stop and restart (R, stop, D)', start: { x: 200, y: 200 }, ball: FWD_BALL, steps: [{ input: R, seconds: 1 }, { input: {}, seconds: 0.5 }, { input: D, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'turn with defender ahead', start: { x: 200, y: 280 }, ball: FWD_BALL, defender: { x: 230, y: 50 }, steps: [{ input: R, seconds: 1 }, { input: D, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'turn with defender behind', start: { x: 300, y: 280 }, ball: FWD_BALL, defender: { x: 150, y: 40 }, steps: [{ input: R, seconds: 1 }, { input: D, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'turn with defender beside', start: { x: 200, y: 200 }, ball: FWD_BALL, defender: { x: 220, y: 60 }, steps: [{ input: R, seconds: 1 }, { input: D, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'turn between two defenders', start: { x: 200, y: 280 }, ball: FWD_BALL, defender: { x: 230, y: 55 }, defender2: { x: 250, y: -45 }, steps: [{ input: R, seconds: 1 }, { input: D, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'turn after rebound (ball arriving)', start: { x: 400, y: 280 }, ball: { x: 120, y: 0 }, ballVel: { x: -260, y: 0 }, steps: [{ input: {}, seconds: 0.6 }, { input: D, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'turn right after a shot', start: { x: 250, y: 280 }, ball: FWD_BALL, steps: [{ input: R, seconds: 0.3 }, { input: { right: true, kick: true }, seconds: 0.05 }, { input: D, seconds: 1.2, mark: true }], probes: TURN_PROBES },
  { name: 'rapid direction changes', start: { x: 200, y: 280 }, ball: FWD_BALL, steps: [{ input: R, seconds: 0.6 }, { input: D, seconds: 0.25, mark: true }, { input: R, seconds: 0.25 }, { input: U, seconds: 0.25 }, { input: R, seconds: 0.25 }, { input: D, seconds: 0.25 }, { input: R, seconds: 0.6 }], probes: ['0.6', '1.2', '1.85'] },
  // Kick reach / charge set (2026-10-31 unification audit). Standing
  // player, ball still in front: the shot goes toward the opponent goal.
  { name: 'kick at the edge of reach (50 px)', start: { x: 150, y: 280 }, ball: { x: 50, y: 0 }, steps: [{ input: { kick: true }, seconds: 0.05 }, { input: {}, seconds: 1 }] },
  { name: 'no kick out of reach (75 px)', start: { x: 150, y: 280 }, ball: { x: 75, y: 0 }, steps: [{ input: { kick: true }, seconds: 0.05 }, { input: {}, seconds: 1 }] },
  ...([['tap', 0.05], ['250 ms', 0.25], ['500 ms', 0.5], ['1000 ms', 1], ['1500 ms', 1.5]] as const).map(([label, held]): ContractScenario => ({
    name: `charge ${label} (standing)`, start: { x: 150, y: 280 }, ball: { x: 30, y: 0 },
    steps: [{ input: { kick: true }, seconds: held }, { input: {}, seconds: 1 }],
  })),
  // Charging while running: the ball is not controlled during the charge,
  // so a long charge can lose it — the release then must not fire.
  { name: 'charge 1000 ms while running', start: { x: 100, y: 120 }, ball: FWD_BALL, steps: [{ input: R, seconds: 0.3 }, { input: { right: true, kick: true }, seconds: 1 }, { input: R, seconds: 0.1 }, { input: {}, seconds: 0.9 }] },
  { name: 'shot after a 180° turn', start: { x: 500, y: 280 }, ball: FWD_BALL, steps: [{ input: R, seconds: 0.8 }, { input: L, seconds: 0.8, mark: true }, { input: { left: true, kick: true }, seconds: 0.05 }, { input: L, seconds: 0.1 }, { input: {}, seconds: 0.9 }] },
  // Aimed charged shot at goal (2026-11-01, shotAim.ts): press while
  // running right, ↑/↓ steer the aim, release in front of the goalkeeper.
  { name: 'aimed shot from the centre (↑)', start: { x: 560, y: 280 }, ball: FWD_BALL, goalkeeper: true, steps: [{ input: R, seconds: 0.3 }, { input: { right: true, kick: true }, seconds: 0.05 }, { input: { up: true, kick: true }, seconds: 0.3 }, { input: {}, seconds: 1.2 }] },
  { name: 'aimed shot from the top wing (↓)', start: { x: 560, y: 200 }, ball: FWD_BALL, goalkeeper: true, steps: [{ input: R, seconds: 0.3 }, { input: { right: true, kick: true }, seconds: 0.05 }, { input: { down: true, kick: true }, seconds: 0.3 }, { input: {}, seconds: 1.2 }] },
  { name: 'aimed shot from the bottom wing (↑)', start: { x: 560, y: 360 }, ball: FWD_BALL, goalkeeper: true, steps: [{ input: R, seconds: 0.3 }, { input: { right: true, kick: true }, seconds: 0.05 }, { input: { up: true, kick: true }, seconds: 0.3 }, { input: {}, seconds: 1.2 }] },
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
  // Since the 2026-10-31 unification (server: control/retention 57/55, kick
  // reach 57, charge 500 ms, reach measured before the move, friction after
  // the move) the rules match; what is left is the STEP SIZE (local 60 Hz
  // frame vs 33 ms server tick). Each entry below also differs between the
  // local engine at 30 Hz and at 60 Hz — see docs/gameplay-physics-contract.md
  // "Známé rozdíly". Only the listed metrics are tolerated.
  //
  // STEP: per-frame ball-control damping/force — the ball oscillates
  // ~140–250 px/s round the player while dribbling, so the sampled
  // speed/position depends on the step; server = local at 30 Hz.
  'turn 90 (R→U)': { metrics: ['ballX', 'ballSpeed', 'at.0.6.ballY', 'at.1.ballY'], why: 'STEP: per-frame control damping' },
  'turn 90 (R→D)': { metrics: ['ballX', 'ballSpeed', 'at.0.6.ballY', 'at.1.ballY'], why: 'STEP: per-frame control damping' },
  'turn 180 (R→L)': { metrics: ['ballY', 'ballSpeed', 'at.1.ballY'], why: 'STEP: per-frame control damping' },
  'top line pull down (R→D)': { metrics: ['ballX', 'ballSpeed', 'at.0.6.ballY', 'at.1.ballY'], why: 'STEP: per-frame control damping' },
  'bottom line pull up (R→U)': { metrics: ['ballX', 'ballSpeed', 'at.0.6.ballY', 'at.1.ballY'], why: 'STEP: per-frame control damping' },
  'diagonal change (R→RD→D)': { metrics: ['ballX', 'ballY', 'ballSpeed', 'at.0.3.ballY'], why: 'STEP: per-frame control damping' },
  'stop and restart (R, stop, D)': { metrics: ['playerY', 'maxPlayerY', 'ballX', 'ballSpeed', 'at.0.6.ballY'], why: 'STEP: per-frame control damping' },
  'turn after rebound (ball arriving)': { metrics: ['ballX', 'ballSpeed', 'at.0.6.', 'at.1.ballY'], why: 'STEP: per-frame control damping' },
  'rapid direction changes': { metrics: ['ballSpeed', 'at.0.6.ballY', 'at.1.2.ballY'], why: 'STEP: per-frame control damping' },
  'shot after a 180° turn': { metrics: ['ballX', 'ballY'], why: 'STEP: where the ball sits at release after the turn (local 30–144 Hz: 105–149 px)' },
  // CHARGE: the charge counts per step from the press step (0 on it), so
  // 500 ms of holding reaches ~93 % at a 33 ms tick vs ~97 % at 60 Hz —
  // the ball rolls a few px less (local 30 Hz does the same).
  'charged kick (0.5 s)': { metrics: ['ballX', 'ballSpeed'], why: 'CHARGE: per-step charge count (the ball reaches the end wall; speed after the bounce)' },
  'charge 1000 ms while running': { metrics: ['ballX', 'ballSpeed'], why: 'CHARGE: per-step charge count + the end wall (since the aimed charge, 2026-11-01, also the speed after the bounce; local 30 Hz 217.5 = server 219.7)' },
  // Since the aimed charge (2026-11-01) the ball stays under dribble control
  // during the charge, damped once per step (local 30 Hz 645 px = server 643).
  'short kick': { metrics: ['ballX'], why: 'STEP: ball-control damping per step during the 0.05 s charge (local 30–144 Hz: 627–645 px)' },
  'charge 500 ms (standing)': { metrics: ['ballX'], why: 'CHARGE: per-step charge count' },
  // BUMP: BUMP_FORCE is applied once per step of overlap, so what happens
  // after a body contact depends on the step (local 30 vs 60 Hz differ by
  // up to ~280 px in 'defender contact').
  'defender contact': { metrics: ['ballX', 'ballY', 'ballSpeed', 'lossSeconds'], why: 'BUMP: per-step bump impulse — since the 0.9× ball carrier (2026-11-01) also where the ball ends up after running into the defender' },
  'goalkeeper blocks shot': { metrics: ['maxBallSpeed'], why: 'BUMP: the shot is released in contact with the goalkeeper (contact boost / bump per step)' },
  'turn with defender ahead': { metrics: ['ballX', 'ballY', 'ballSpeed', 'at.'], why: 'BUMP: per-step bump impulse' },
  'turn with defender behind': { metrics: ['playerY', 'maxPlayerY', 'ballX', 'ballSpeed', 'maxBallSpeed', 'at.'], why: 'BUMP: per-step bump impulse' },
  'turn with defender beside': { metrics: ['ballX', 'ballY', 'ballSpeed', 'maxBallSpeed', 'at.'], why: 'BUMP: per-step bump impulse' },
  'turn between two defenders': { metrics: ['ballX', 'ballY', 'ballSpeed', 'at.'], why: 'BUMP: per-step bump impulse' },
  // GOAL LINE (older, unrelated to aiming): the bot engine counts a goal
  // once the ball's edge crosses the line, the server once its centre does
  // — the ball then freezes for the goal pause ~13 px apart. Both score.
  'aimed shot from the top wing (↓)': { metrics: ['ballX', 'ballY', 'shotTravel'], why: 'GOAL LINE: ball edge (local) vs centre (server) ends the shot — both score a goal at every rate' },
  'aimed shot from the bottom wing (↑)': { metrics: ['ballX', 'ballY', 'shotTravel'], why: 'GOAL LINE: ball edge (local) vs centre (server) ends the shot — both score a goal at every rate' },
  'aimed shot from the centre (↑)': { metrics: ['ballX', 'ballY', 'ballSpeed', 'shotTravel'], why: 'BUMP: the aimed shot glances off the goalkeeper (per-step bump; ball speed local 30 Hz 35.8 ≈ server 33.8)' },
  'turn right after a shot': { metrics: ['ballX', 'ballY', 'ballSpeed', 'shotTravel', 'lossSeconds', 'at.'], why: 'BUMP: the shot runs into the player turning after it (local 30–144 Hz: 54–98 px travel)' },
};
