import type { BenchRole, GameState, Player, Team, Vec2 } from './types';
import { FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CX, FIELD_CY, BENCH_DEPLOY_DURATION_MS } from './constants';
import { getRemovedPlayerIds } from './temporaryRemoval';

// Bench + 30s temporary substitute — a separate mechanic from
// temporaryRemoval.ts's random-substitution ("leaving/bench/returning")
// state machine. This tracks players deliberately brought ON from the bench
// (deployBenchPlayer), not players being taken off the pitch.
export interface BenchDeployment {
  playerId: string;
  team: Team;
  remainingMs: number;
}

export function canDeployFromBench(state: GameState, player: Player): boolean {
  if (player.role !== 'field_player') return false;
  if (player.matchStatus !== 'bench') return false;
  if (player.benchUsed) return false;
  // A player already tangled up in the unrelated random-substitution
  // mechanic must never also be deployed from the bench — the two systems
  // must not fight over the same player.
  if (getRemovedPlayerIds(state).has(player.id)) return false;
  return true;
}

export function isSelectableFieldPlayer(p: Player, removedIds: Set<string>): boolean {
  return p.role !== 'goalkeeper' && p.matchStatus !== 'bench' && !removedIds.has(p.id);
}

// Mirrored holding spot inside each team's own defensive third, away from
// the other 3 field players + GK so a freshly deployed player doesn't spawn
// on top of anyone.
export function getBenchEntryPosition(team: Team): Vec2 {
  return {
    x: team === 'home' ? FIELD_L + 90 : FIELD_R - 90,
    y: FIELD_B - 60,
  };
}

export function deployBenchPlayer(
  state: GameState,
  team: Team,
  playerId: string,
  role: BenchRole = 'attacker',
): boolean {
  const player = state.players.find((p) => p.id === playerId && p.team === team);
  if (!player || !canDeployFromBench(state, player)) return false;
  player.matchStatus = 'temporarily_deployed';
  player.benchUsed = true;
  player.benchRole = role;
  player.pos = getBenchEntryPosition(team);
  player.vel = { x: 0, y: 0 };
  player.kickCooldown = 0;
  state.benchDeployments.push({ playerId, team, remainingMs: BENCH_DEPLOY_DURATION_MS });
  return true;
}

export function updateBenchDeployments(state: GameState, dt: number): void {
  if (state.benchDeployments.length === 0) return;
  const stillActive: BenchDeployment[] = [];
  for (const d of state.benchDeployments) {
    d.remainingMs -= dt * 1000;
    if (d.remainingMs > 0) {
      stillActive.push(d);
      continue;
    }
    const player = state.players.find((p) => p.id === d.playerId);
    if (player && player.matchStatus === 'temporarily_deployed') {
      player.matchStatus = 'bench';
      player.vel = { x: 0, y: 0 };
      // Bench players aren't rendered/collided, so their exact resting
      // position doesn't matter — leave pos as wherever they expired.
    }
  }
  state.benchDeployments = stillActive;
}

const clampTo = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Where a deployed substitute heads while it is NOT the controlled player —
// the 3 starters keep their own support slots (supportPositioning.ts / bot
// ai.ts), so without this the 4th field player had no target and stood
// still. Reads only the current ball position.
//   attacker: ahead of the ball in the central lane toward the opponent goal
//             (the overload), never deeper than just outside the box
//   defender: on the line between the ball and its own goal, ~40% of the way
//             out, leaning toward the ball's height
// Mirrors project-hub-api's gameEngine/benchDeployment.ts.
export function computeBenchRoleTarget(team: Team, role: BenchRole, ball: Vec2): Vec2 {
  const dir = team === 'home' ? 1 : -1;
  const ownGoalX = team === 'home' ? FIELD_L : FIELD_R;
  const oppGoalX = team === 'home' ? FIELD_R : FIELD_L;
  const yMin = FIELD_T + 50;
  const yMax = FIELD_B - 50;
  if (role === 'attacker') {
    const x = ball.x + dir * 160;
    const lo = team === 'home' ? FIELD_CX : oppGoalX + 130;
    const hi = team === 'home' ? oppGoalX - 130 : FIELD_CX;
    return { x: clampTo(x, lo, hi), y: clampTo(FIELD_CY + (ball.y - FIELD_CY) * 0.3, yMin, yMax) };
  }
  const depth = clampTo(Math.abs(ball.x - ownGoalX) * 0.4, 90, (FIELD_R - FIELD_L) * 0.4);
  return { x: ownGoalX + dir * depth, y: clampTo(FIELD_CY + (ball.y - FIELD_CY) * 0.6, yMin, yMax) };
}

// The bot's call-up role: chase the game when behind or level, protect a
// lead. Deterministic — only the current score.
export function chooseBotBenchRole(state: GameState, team: Team): BenchRole {
  const own = team === 'home' ? state.score.home : state.score.away;
  const opp = team === 'home' ? state.score.away : state.score.home;
  return own > opp ? 'defender' : 'attacker';
}
