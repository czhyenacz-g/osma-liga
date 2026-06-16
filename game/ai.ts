import type { GameState, Player, Vec2 } from './types';
import {
  FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CX, FIELD_CY,
  PLAYER_RADIUS,
  BOT_SPEED, BOT_KICK_FORCE, BOT_KICK_RANGE, BOT_KICK_COOLDOWN,
} from './constants';
import { dist, normalize, clampPos } from './physics';

const EDGE_MARGIN = 68;

/** Detects how close to each wall the ball is; returns a vector pointing INTO the field. */
function wallAvoidanceDir(pos: Vec2): Vec2 {
  let dx = 0;
  let dy = 0;
  const topGap   = pos.y - FIELD_T;
  const botGap   = FIELD_B - pos.y;
  const leftGap  = pos.x - FIELD_L;
  const rightGap = FIELD_R - pos.x;
  if (topGap   < EDGE_MARGIN) dy += (EDGE_MARGIN - topGap)   / EDGE_MARGIN;
  if (botGap   < EDGE_MARGIN) dy -= (EDGE_MARGIN - botGap)   / EDGE_MARGIN;
  if (leftGap  < EDGE_MARGIN) dx += (EDGE_MARGIN - leftGap)  / EDGE_MARGIN;
  if (rightGap < EDGE_MARGIN) dx -= (EDGE_MARGIN - rightGap) / EDGE_MARGIN;
  if (dx === 0 && dy === 0) return { x: 0, y: 0 };
  return normalize({ x: dx, y: dy });
}

function isNearWall(pos: Vec2): boolean {
  return (
    pos.y - FIELD_T   < EDGE_MARGIN ||
    FIELD_B - pos.y   < EDGE_MARGIN ||
    pos.x - FIELD_L   < EDGE_MARGIN ||
    FIELD_R - pos.x   < EDGE_MARGIN
  );
}

/**
 * When ball is near a wall, offset the chase target away from the wall.
 * This means the bot approaches the ball from a side angle instead of
 * head-on into the wall, so BUMP_FORCE doesn't just slam ball into the wall.
 */
function chaseTarget(ballPos: Vec2): Vec2 {
  const OFFSET = PLAYER_RADIUS * 2; // 36px — keeps bot outside BUMP range but inside kick range
  let tx = ballPos.x;
  let ty = ballPos.y;

  const topGap   = ballPos.y - FIELD_T;
  const botGap   = FIELD_B - ballPos.y;
  const leftGap  = ballPos.x - FIELD_L;
  const rightGap = FIELD_R - ballPos.x;

  // Offset target perpendicular to the nearest wall so bot arrives from the side
  if (topGap   < EDGE_MARGIN) ty += OFFSET * (1 - topGap   / EDGE_MARGIN);
  if (botGap   < EDGE_MARGIN) ty -= OFFSET * (1 - botGap   / EDGE_MARGIN);
  if (leftGap  < EDGE_MARGIN) tx += OFFSET * (1 - leftGap  / EDGE_MARGIN);
  if (rightGap < EDGE_MARGIN) tx -= OFFSET * (1 - rightGap / EDGE_MARGIN);

  return { x: tx, y: ty };
}

export function updateAI(state: GameState, dt: number): void {
  const { ball, players } = state;
  const botPlayers = players.filter(p => p.team === 'away');

  // Identify bot player closest to ball
  let chaser: Player = botPlayers[0];
  let chaserDist = Infinity;
  for (const p of botPlayers) {
    const d = dist(p.pos, ball.pos);
    if (d < chaserDist) {
      chaserDist = d;
      chaser = p;
    }
  }

  const ballNearWall = isNearWall(ball.pos);
  const avoidDir     = wallAvoidanceDir(ball.pos);

  for (const p of botPlayers) {
    if (p.kickCooldown > 0) p.kickCooldown -= dt;

    if (p === chaser) {
      // ── Chase ────────────────────────────────────────────────────────────
      // Use offset target near walls so bot approaches from the side
      const target = chaseTarget(ball.pos);
      const toTarget = { x: target.x - p.pos.x, y: target.y - p.pos.y };
      const targetDist = Math.sqrt(toTarget.x ** 2 + toTarget.y ** 2);

      if (targetDist > PLAYER_RADIUS * 0.6) {
        const dir = normalize(toTarget);
        p.vel.x = dir.x * BOT_SPEED;
        p.vel.y = dir.y * BOT_SPEED;
      } else {
        p.vel.x = 0;
        p.vel.y = 0;
      }

      // ── Kick ─────────────────────────────────────────────────────────────
      if (chaserDist < BOT_KICK_RANGE && p.kickCooldown <= 0) {
        const variation = (Math.random() - 0.5) * 50;

        // Base attack direction: toward home (left) goal
        const attackDir = normalize({
          x: FIELD_L - 8 - ball.pos.x,
          y: FIELD_CY + variation - ball.pos.y,
        });

        let kickDir: Vec2;

        if (ballNearWall) {
          // Blend attack direction with wall-avoidance so ball escapes the edge.
          // 55% away from wall, 45% toward goal — keeps bot effective but not stuck.
          kickDir = normalize({
            x: attackDir.x * 0.45 + avoidDir.x * 0.55,
            y: attackDir.y * 0.45 + avoidDir.y * 0.55,
          });
          // Fire sooner from wall situations to get ball moving before BUMP accumulates
          p.kickCooldown = BOT_KICK_COOLDOWN * 0.55;
        } else {
          kickDir = attackDir;
          p.kickCooldown = BOT_KICK_COOLDOWN;
        }

        ball.vel.x += kickDir.x * BOT_KICK_FORCE;
        ball.vel.y += kickDir.y * BOT_KICK_FORCE;
      }

      // ── Ball unstuck nudge ────────────────────────────────────────────────
      // If ball is nearly stationary near a wall, give it a gentle push toward
      // center regardless of kick cooldown, so it never freezes against the wall.
      if (ballNearWall) {
        const ballSpeed = Math.sqrt(ball.vel.x ** 2 + ball.vel.y ** 2);
        if (ballSpeed < 30 && chaserDist < BOT_KICK_RANGE * 1.6) {
          ball.vel.x += avoidDir.x * 55;
          ball.vel.y += avoidDir.y * 55;
        }
      }
    } else {
      // ── Return to base ───────────────────────────────────────────────────
      const d = dist(p.pos, p.basePos);
      if (d > 5) {
        const dir = normalize({ x: p.basePos.x - p.pos.x, y: p.basePos.y - p.pos.y });
        p.vel.x = dir.x * BOT_SPEED * 0.5;
        p.vel.y = dir.y * BOT_SPEED * 0.5;
      } else {
        p.vel.x = 0;
        p.vel.y = 0;
      }
    }

    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.pos = clampPos(
      p.pos,
      FIELD_L + PLAYER_RADIUS,
      FIELD_R - PLAYER_RADIUS,
      FIELD_T + PLAYER_RADIUS,
      FIELD_B - PLAYER_RADIUS,
    );
  }
}
