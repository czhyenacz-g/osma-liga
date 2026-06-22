import type { Ball, Player, Team, Vec2 } from './types';
import { dist, normalize } from './physics';
import { BALL_CONTROL_RADIUS } from './constants';

// Q / PŘEP. with the ball under control = pass-and-switch instead of a plain
// active-player cycle. Mirrors project-hub-api/src/gameEngine/passAndSwitch.ts
// so /hra/bot, multiplayer and training challenge share one principle.
export interface PassAndSwitchConfig {
  enabled: boolean;
  requiresBallControl: boolean;
  controlDistance: number;
  maxBallSpeedForControl: number;
  accuracy: number; // 0..1 — higher = straighter, more reliably-paced pass
  minForce: number;
  maxForce: number;
  manualLockSeconds: number;
}

export const DEFAULT_PASS_AND_SWITCH_CONFIG: PassAndSwitchConfig = {
  enabled: true,
  requiresBallControl: true,
  controlDistance: BALL_CONTROL_RADIUS,
  maxBallSpeedForControl: 240,
  accuracy: 0.85,
  minForce: 320,
  maxForce: 520,
  manualLockSeconds: 2,
};

const MAX_ERROR_ANGLE_RAD = (30 * Math.PI) / 180;
const IDEAL_PASS_DIST_MIN = 70;
const IDEAL_PASS_DIST_MAX = 320;
const LANE_BLOCK_RADIUS = 28;

export function hasBallControl(player: Player, ball: Ball, config: PassAndSwitchConfig): boolean {
  if (!config.requiresBallControl) return true;
  const d = dist(player.pos, ball.pos);
  const speed = Math.hypot(ball.vel.x, ball.vel.y);
  return d < config.controlDistance && speed < config.maxBallSpeedForControl;
}

// Perpendicular distance from `point` to the segment a→b, restricted to the
// middle stretch of the pass lane (t in [0.15, 0.85]) — a simple stand-in for
// "is an opponent standing in the passing lane".
function isInPassingLane(a: Vec2, b: Vec2, point: Vec2, radius: number): boolean {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq < 1) return false;
  const t = ((point.x - a.x) * abx + (point.y - a.y) * aby) / lenSq;
  if (t < 0.15 || t > 0.85) return false;
  const projX = a.x + abx * t;
  const projY = a.y + aby * t;
  return Math.hypot(point.x - projX, point.y - projY) < radius;
}

function scoreCandidate(passer: Player, candidate: Player, opponents: Player[], attackDir: 1 | -1): number {
  const d = dist(passer.pos, candidate.pos);
  let score = 0;

  // Distance — reward a sensible passing range, penalize too close/too far.
  if (d < IDEAL_PASS_DIST_MIN) {
    score -= (IDEAL_PASS_DIST_MIN - d) * 1.5;
  } else if (d > IDEAL_PASS_DIST_MAX) {
    score -= (d - IDEAL_PASS_DIST_MAX) * 0.6;
  } else {
    score += 40 - Math.abs(d - (IDEAL_PASS_DIST_MIN + IDEAL_PASS_DIST_MAX) / 2) * 0.15;
  }

  // Forward progress toward the opponent's goal.
  score += (candidate.pos.x - passer.pos.x) * attackDir * 0.3;

  // Open space around the candidate (distance to nearest opponent).
  let nearestOpponent = Infinity;
  for (const o of opponents) nearestOpponent = Math.min(nearestOpponent, dist(candidate.pos, o.pos));
  if (nearestOpponent !== Infinity) {
    score += Math.min(nearestOpponent, 200) * 0.25;
    if (nearestOpponent < 35) score -= 40; // marked too tightly
  }

  // Passing lane blocked by a defender standing in the way.
  for (const o of opponents) {
    if (isInPassingLane(passer.pos, candidate.pos, o.pos, LANE_BLOCK_RADIUS)) {
      score -= 60;
    }
  }

  return score;
}

// Picks the best available teammate to pass to — never "next in order".
// Returns null if no sensible teammate exists (caller should fall back to a
// plain active-player switch).
export function findBestPassTarget(
  passer: Player,
  teammates: Player[],
  opponents: Player[],
): Player | null {
  const candidates = teammates.filter((p) => p.id !== passer.id);
  if (candidates.length === 0) return null;

  const attackDir: 1 | -1 = passer.team === 'home' ? 1 : -1;
  let best: Player | null = null;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const score = scoreCandidate(passer, candidate, opponents, attackDir);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

// Inaccurate-on-purpose pass velocity: direction toward the target plus a
// small angular error (shrinking as `accuracy` rises), force scaled by
// distance and clamped to [minForce, maxForce].
export function computePassVelocity(passer: Player, target: Player, config: PassAndSwitchConfig): Vec2 {
  const dx = target.pos.x - passer.pos.x;
  const dy = target.pos.y - passer.pos.y;
  const baseDir = normalize({ x: dx, y: dy });

  const errorAngle = (Math.random() * 2 - 1) * MAX_ERROR_ANGLE_RAD * (1 - config.accuracy);
  const cos = Math.cos(errorAngle);
  const sin = Math.sin(errorAngle);
  const dir = {
    x: baseDir.x * cos - baseDir.y * sin,
    y: baseDir.x * sin + baseDir.y * cos,
  };

  const distance = Math.hypot(dx, dy);
  const t = Math.max(0, Math.min(1, (distance - IDEAL_PASS_DIST_MIN) / (IDEAL_PASS_DIST_MAX - IDEAL_PASS_DIST_MIN)));
  const force = config.minForce + (config.maxForce - config.minForce) * t;

  return { x: dir.x * force, y: dir.y * force };
}

export function getTeammatesAndOpponents(players: Player[], team: Team): { teammates: Player[]; opponents: Player[] } {
  return {
    teammates: players.filter((p) => p.team === team),
    opponents: players.filter((p) => p.team !== team),
  };
}
