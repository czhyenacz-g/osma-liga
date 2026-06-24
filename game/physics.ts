import type { Vec2, GameState } from './types';
import {
  FIELD_L, FIELD_R, FIELD_T, FIELD_B,
  GOAL_T, GOAL_B,
  BALL_RADIUS, BALL_MAX_SPEED, BALL_WALL_RESTITUTION,
  PLAYER_RADIUS, BUMP_FORCE, KICK_SNAP_CLEARANCE,
} from './constants';

// ── Vec2 helpers ──────────────────────────────────────────────────────────────

export function dist(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 0.001) return { x: 1, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function clampPos(
  pos: Vec2,
  minX: number, maxX: number,
  minY: number, maxY: number,
): Vec2 {
  return {
    x: clamp(pos.x, minX, maxX),
    y: clamp(pos.y, minY, maxY),
  };
}

// ── Ball physics ──────────────────────────────────────────────────────────────

// Framerate-independent friction: retains ~35% speed per second
const FRICTION_PER_SECOND = 0.35;

export function updateBallPhysics(state: GameState, dt: number): void {
  const { ball } = state;

  ball.pos.x += ball.vel.x * dt;
  ball.pos.y += ball.vel.y * dt;

  // Framerate-independent friction
  const frictionFactor = Math.pow(FRICTION_PER_SECOND, dt);
  ball.vel.x *= frictionFactor;
  ball.vel.y *= frictionFactor;

  // Cap speed
  const speed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
  if (speed > BALL_MAX_SPEED) {
    ball.vel.x = (ball.vel.x / speed) * BALL_MAX_SPEED;
    ball.vel.y = (ball.vel.y / speed) * BALL_MAX_SPEED;
  }

  // Bounce top wall
  if (ball.pos.y - BALL_RADIUS < FIELD_T) {
    ball.pos.y = FIELD_T + BALL_RADIUS;
    ball.vel.y = Math.abs(ball.vel.y) * BALL_WALL_RESTITUTION;
  }
  // Bounce bottom wall
  if (ball.pos.y + BALL_RADIUS > FIELD_B) {
    ball.pos.y = FIELD_B - BALL_RADIUS;
    ball.vel.y = -Math.abs(ball.vel.y) * BALL_WALL_RESTITUTION;
  }

  // Bounce left wall only if ball is outside goal opening
  if (ball.pos.x - BALL_RADIUS < FIELD_L) {
    const inGoalY = ball.pos.y >= GOAL_T && ball.pos.y <= GOAL_B;
    if (!inGoalY) {
      ball.pos.x = FIELD_L + BALL_RADIUS;
      ball.vel.x = Math.abs(ball.vel.x) * BALL_WALL_RESTITUTION;
    }
  }
  // Bounce right wall only if outside goal opening
  if (ball.pos.x + BALL_RADIUS > FIELD_R) {
    const inGoalY = ball.pos.y >= GOAL_T && ball.pos.y <= GOAL_B;
    if (!inGoalY) {
      ball.pos.x = FIELD_R - BALL_RADIUS;
      ball.vel.x = -Math.abs(ball.vel.x) * BALL_WALL_RESTITUTION;
    }
  }
}

// Repositions the ball just in front of the kicker along the kick direction,
// before kick velocity is applied. Without this, a kick fired while the ball
// still overlaps the kicker can be partially reversed later in the same tick
// by resolvePlayerBallCollisions(), which pushes the ball away from whichever
// side it overlaps the kicker on — not necessarily the kick direction.
export function snapBallInFrontOfKicker(ball: GameState['ball'], kickerPos: Vec2, kickDir: Vec2): void {
  const snapDist = PLAYER_RADIUS + BALL_RADIUS + KICK_SNAP_CLEARANCE;
  ball.pos = clampPos(
    { x: kickerPos.x + kickDir.x * snapDist, y: kickerPos.y + kickDir.y * snapDist },
    FIELD_L + BALL_RADIUS, FIELD_R - BALL_RADIUS,
    FIELD_T + BALL_RADIUS, FIELD_B - BALL_RADIUS,
  );
}

// Returns which team scored, or null
export function checkGoal(state: GameState): 'home' | 'away' | null {
  const { ball } = state;
  const inGoalY = ball.pos.y >= GOAL_T && ball.pos.y <= GOAL_B;
  if (!inGoalY) return null;
  if (ball.pos.x + BALL_RADIUS > FIELD_R) return 'home';  // home scored right
  if (ball.pos.x - BALL_RADIUS < FIELD_L) return 'away';  // away scored left
  return null;
}

// Gentle push: separate overlapping players from ball and add small impulse.
// Players currently leaving/on the bench/returning (temporaryRemoval.ts)
// don't physically interact with the ball.
export function resolvePlayerBallCollisions(state: GameState): void {
  const { ball, players } = state;
  const minDist = PLAYER_RADIUS + BALL_RADIUS;
  const removedIds = new Set(state.temporaryRemovals.map((r) => r.playerId));

  for (const p of players) {
    if (removedIds.has(p.id)) continue;
    const d = dist(p.pos, ball.pos);
    if (d < minDist && d > 0.001) {
      const dir = normalize({ x: ball.pos.x - p.pos.x, y: ball.pos.y - p.pos.y });
      // Separate
      const overlap = minDist - d;
      ball.pos.x += dir.x * (overlap + 1);
      ball.pos.y += dir.y * (overlap + 1);
      // Gentle impulse in push direction
      ball.vel.x += dir.x * BUMP_FORCE;
      ball.vel.y += dir.y * BUMP_FORCE;
      // Track last touch for own goal detection
      state.lastTouchTeam = p.team;
      state.lastTouchPlayerId = p.id;
    }
  }
}
