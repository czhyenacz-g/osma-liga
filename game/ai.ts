import type { GameState, Player } from './types';
import {
  FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CY,
  PLAYER_RADIUS,
  BOT_SPEED, BOT_KICK_FORCE, BOT_KICK_RANGE, BOT_KICK_COOLDOWN,
} from './constants';
import { dist, normalize, clampPos } from './physics';

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

  for (const p of botPlayers) {
    if (p.kickCooldown > 0) p.kickCooldown -= dt;

    if (p === chaser) {
      // Chase the ball
      if (chaserDist > PLAYER_RADIUS * 0.6) {
        const dir = normalize({ x: ball.pos.x - p.pos.x, y: ball.pos.y - p.pos.y });
        p.vel.x = dir.x * BOT_SPEED;
        p.vel.y = dir.y * BOT_SPEED;
      } else {
        p.vel.x = 0;
        p.vel.y = 0;
      }

      // Strong kick toward home (left) goal when close and cooldown ready
      if (chaserDist < BOT_KICK_RANGE && p.kickCooldown <= 0) {
        const targetX = FIELD_L - 8;
        // Add slight vertical variation so bot doesn't always shoot perfectly center
        const targetY = FIELD_CY + (Math.random() - 0.5) * 50;
        const dir = normalize({ x: targetX - ball.pos.x, y: targetY - ball.pos.y });
        ball.vel.x += dir.x * BOT_KICK_FORCE;
        ball.vel.y += dir.y * BOT_KICK_FORCE;
        p.kickCooldown = BOT_KICK_COOLDOWN;
      }
    } else {
      // Return to base position at reduced speed
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
