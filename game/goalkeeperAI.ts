import type { Ball, GameState, Player } from './types';
import {
  FIELD_L, FIELD_R, FIELD_CY,
  GOALKEEPER_ZONE_DEPTH, GOALKEEPER_ZONE_HEIGHT, GOALKEEPER_SPEED,
  GOALKEEPER_DEFAULT_DEPTH, GOALKEEPER_REACT_RANGE,
} from './constants';

// Simple, fully-automatic goalkeeper AI (see task spec section 4): stay
// between the ball and the own goal, moving only within a small rectangular
// zone in front of it. No shot prediction, no advanced saves — just a
// smoothed vertical track of the ball's y position, clamped to the zone.
// Runs for BOTH teams' goalkeepers every tick, entirely separate from the
// home-team manual-control pool (updateGame.ts) and the away-team bot-chase
// AI (ai.ts) — goalkeepers are excluded from both of those.

export interface GoalkeeperZone {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export function getGoalkeeperZone(team: 'home' | 'away'): GoalkeeperZone {
  const isHome = team === 'home';
  return {
    xMin: isHome ? FIELD_L : FIELD_R - GOALKEEPER_ZONE_DEPTH,
    xMax: isHome ? FIELD_L + GOALKEEPER_ZONE_DEPTH : FIELD_R,
    yMin: FIELD_CY - GOALKEEPER_ZONE_HEIGHT / 2,
    yMax: FIELD_CY + GOALKEEPER_ZONE_HEIGHT / 2,
  };
}

function updateGoalkeeper(gk: Player, ball: Ball, dt: number): void {
  const isHome = gk.team === 'home';
  const zone = getGoalkeeperZone(gk.team);
  const goalLineX = isHome ? FIELD_L : FIELD_R;
  const defaultX = isHome ? FIELD_L + GOALKEEPER_DEFAULT_DEPTH : FIELD_R - GOALKEEPER_DEFAULT_DEPTH;

  const ballIsThreat = Math.abs(ball.pos.x - goalLineX) < GOALKEEPER_REACT_RANGE;
  const targetX = defaultX;
  const targetY = ballIsThreat
    ? Math.max(zone.yMin, Math.min(zone.yMax, ball.pos.y))
    : FIELD_CY;

  const dx = targetX - gk.pos.x;
  const dy = targetY - gk.pos.y;
  const distToTarget = Math.hypot(dx, dy);

  if (distToTarget > 1) {
    const step = Math.min(distToTarget, GOALKEEPER_SPEED * dt);
    const nx = dx / distToTarget;
    const ny = dy / distToTarget;
    gk.pos.x += nx * step;
    gk.pos.y += ny * step;
    gk.vel.x = nx * GOALKEEPER_SPEED;
    gk.vel.y = ny * GOALKEEPER_SPEED;
  } else {
    gk.vel.x = 0;
    gk.vel.y = 0;
  }

  // Safety clamp — guarantees the goalkeeper stays in its zone even if a
  // collision (or anything else) knocked it out this tick.
  gk.pos.x = Math.max(zone.xMin, Math.min(zone.xMax, gk.pos.x));
  gk.pos.y = Math.max(zone.yMin, Math.min(zone.yMax, gk.pos.y));
}

export function updateGoalkeepers(state: GameState, dt: number): void {
  for (const p of state.players) {
    if (p.role !== 'goalkeeper') continue;
    updateGoalkeeper(p, state.ball, dt);
  }
}
