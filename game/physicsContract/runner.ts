import type { ContractInput, ContractMetrics, ContractScenario } from './spec';

// Engine-agnostic measurement loop over one contract scenario. Each engine
// supplies a tiny adapter; no engine code is imported here, so the same
// runner replays the scenario against the local engine (harness.ts) and
// the server engine (project-hub-api, via the baseline script).

export interface Pos { x: number; y: number }

export interface EngineAdapter {
  // Advances the engine by dt with the human's held input.
  step(input: ContractInput, dt: number): void;
  player(): Pos;
  ball(): Pos & { vx: number; vy: number };
  defender(): Pos | null;
  scored(): boolean;
  controlRadius: number;
  // Player + ball radius: a defender "contact" is the ball inside it.
  contactDist: number;
}

const round = (v: number) => Math.round(v * 10) / 10;

function dirOf(i: ContractInput): Pos | null {
  let x = 0, y = 0;
  if (i.right) x++; if (i.left) x--; if (i.down) y++; if (i.up) y--;
  const l = Math.hypot(x, y);
  return l ? { x: x / l, y: y / l } : null;
}

export function runContractScenario(sc: ContractScenario, e: EngineAdapter, dt: number): ContractMetrics {
  let t = 0, lossSeconds = 0, contacts = 0, touching = false, goal = false;
  let minPlayerY = Infinity, maxPlayerY = -Infinity;
  let markT: number | null = null, releaseT: number | null = null, ballAtRelease = 0, shotTravel: number | null = null;
  let heading: Pos | null = null;
  let kickWasHeld = false;
  const at: ContractMetrics['at'] = {};

  for (const step of sc.steps) {
    const n = Math.max(1, Math.round(step.seconds / dt));
    if (step.mark && markT === null) markT = t;
    for (let i = 0; i < n; i++) {
      if (kickWasHeld && !step.input.kick && releaseT === null) { releaseT = t; ballAtRelease = e.ball().x; }
      kickWasHeld = !!step.input.kick;
      e.step(step.input, dt);
      t += dt;
      const p = e.player(), b = e.ball();
      if (e.scored()) goal = true;
      minPlayerY = Math.min(minPlayerY, p.y);
      maxPlayerY = Math.max(maxPlayerY, p.y);
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d > e.controlRadius) lossSeconds += dt;
      const def = e.defender();
      if (def) {
        const now = Math.hypot(b.x - def.x, b.y - def.y) < e.contactDist + 0.5;
        if (now && !touching) contacts++;
        touching = now;
      }
      heading = dirOf(step.input) ?? heading;
      if (markT !== null && heading) {
        for (const probe of sc.probes ?? []) {
          if (at[probe] || t - markT < Number(probe) - 1e-9) continue;
          const rel = Math.atan2(b.y - p.y, b.x - p.x) - Math.atan2(heading.y, heading.x);
          const deg = Math.abs(((rel * 180 / Math.PI) % 360 + 540) % 360 - 180);
          at[probe] = { dist: round(d), relDeg: Math.round(deg), ballY: round(b.y) };
        }
      }
      if (releaseT !== null && shotTravel === null && t - releaseT >= 0.9 - 1e-9) shotTravel = round(b.x - ballAtRelease);
    }
  }
  const p = e.player(), b = e.ball();
  return {
    playerX: round(p.x), playerY: round(p.y), minPlayerY: round(minPlayerY), maxPlayerY: round(maxPlayerY),
    ballX: round(b.x), ballY: round(b.y), ballSpeed: round(Math.hypot(b.vx, b.vy)),
    lossSeconds: round(lossSeconds), contacts, shotTravel, goal, at,
  };
}
