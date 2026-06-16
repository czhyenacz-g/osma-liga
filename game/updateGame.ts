import type { GameState, InputState, Vec2 } from './types';
import { createInitialState } from './createInitialState';
import { updateAI } from './ai';
import {
  updateBallPhysics,
  checkGoal,
  resolvePlayerBallCollisions,
  dist, normalize, clampPos,
} from './physics';
import {
  PLAYER_SPEED, KICK_RANGE, KICK_FORCE, KICK_COOLDOWN,
  FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CY,
  PLAYER_RADIUS, RETURN_SPEED, GOAL_PAUSE,
} from './constants';

const GOAL_MESSAGES = [
  'VAR nemáme, hraj dál.',
  'Tohle chtěl centru.',
  'Brankář šel na párek.',
  'Fyzika rezignovala.',
  'Okresní fotbal v plné kráse.',
];

function randomMessage(): string {
  return GOAL_MESSAGES[Math.floor(Math.random() * GOAL_MESSAGES.length)];
}

function resetPositions(state: GameState): void {
  const fresh = createInitialState();
  for (let i = 0; i < state.players.length; i++) {
    state.players[i].pos = { ...fresh.players[i].pos };
    state.players[i].vel = { x: 0, y: 0 };
    state.players[i].kickCooldown = 0;
  }
  state.ball.pos = { ...fresh.ball.pos };
  state.ball.vel = { x: 0, y: 0 };
}

export function updateGame(state: GameState, input: InputState, dt: number): GameState {
  if (input.restart) {
    input.restart = false;
    return createInitialState();
  }

  if (state.phase === 'ended') return state;

  // Countdown during goal pause
  if (state.phase === 'goal') {
    state.goalTimer -= dt;
    if (state.goalTimer <= 0) {
      resetPositions(state);
      state.phase = 'playing';
    }
    return state;
  }

  // Match timer
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  if (state.timeLeft === 0) {
    state.phase = 'ended';
    return state;
  }

  // ── Active player: home player closest to ball ────────────────────────────

  const homePlayers = state.players.filter(p => p.team === 'home');

  let active = homePlayers[0];
  let activeDist = Infinity;
  for (const p of homePlayers) {
    const d = dist(p.pos, state.ball.pos);
    if (d < activeDist) {
      activeDist = d;
      active = p;
    }
  }
  state.activePlayerId = active.id;

  // Decrement kick cooldowns
  for (const p of homePlayers) {
    if (p.kickCooldown > 0) p.kickCooldown -= dt;
  }

  // ── Player movement ───────────────────────────────────────────────────────

  let mvx = 0;
  let mvy = 0;
  if (input.up)    mvy -= 1;
  if (input.down)  mvy += 1;
  if (input.left)  mvx -= 1;
  if (input.right) mvx += 1;

  // Normalize diagonal movement
  const mvLen = Math.sqrt(mvx * mvx + mvy * mvy);
  if (mvLen > 0) {
    mvx = (mvx / mvLen) * PLAYER_SPEED;
    mvy = (mvy / mvLen) * PLAYER_SPEED;
  }

  active.vel.x = mvx;
  active.vel.y = mvy;
  active.pos.x += active.vel.x * dt;
  active.pos.y += active.vel.y * dt;
  active.pos = clampPos(
    active.pos,
    FIELD_L + PLAYER_RADIUS, FIELD_R - PLAYER_RADIUS,
    FIELD_T + PLAYER_RADIUS, FIELD_B - PLAYER_RADIUS,
  );

  // ── Space kick ────────────────────────────────────────────────────────────

  if (input.kick && activeDist < KICK_RANGE && active.kickCooldown <= 0) {
    let kickDir: Vec2;
    if (mvLen > 0.1) {
      // Kick in movement direction
      kickDir = { x: mvx / PLAYER_SPEED, y: mvy / PLAYER_SPEED };
    } else {
      // Default: kick toward away goal (right)
      kickDir = normalize({
        x: FIELD_R - state.ball.pos.x,
        y: FIELD_CY - state.ball.pos.y,
      });
    }
    state.ball.vel.x += kickDir.x * KICK_FORCE;
    state.ball.vel.y += kickDir.y * KICK_FORCE;
    active.kickCooldown = KICK_COOLDOWN;
  }

  // ── Passive home players return to base ───────────────────────────────────

  for (const p of homePlayers) {
    if (p === active) continue;
    const d = dist(p.pos, p.basePos);
    if (d > 5) {
      const dir = normalize({ x: p.basePos.x - p.pos.x, y: p.basePos.y - p.pos.y });
      p.vel.x = dir.x * RETURN_SPEED;
      p.vel.y = dir.y * RETURN_SPEED;
    } else {
      p.vel.x = 0;
      p.vel.y = 0;
    }
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.pos = clampPos(
      p.pos,
      FIELD_L + PLAYER_RADIUS, FIELD_R - PLAYER_RADIUS,
      FIELD_T + PLAYER_RADIUS, FIELD_B - PLAYER_RADIUS,
    );
  }

  // ── Bot AI ────────────────────────────────────────────────────────────────

  updateAI(state, dt);

  // ── Physics ───────────────────────────────────────────────────────────────

  resolvePlayerBallCollisions(state);
  updateBallPhysics(state, dt);

  // ── Goal check ────────────────────────────────────────────────────────────

  const scored = checkGoal(state);
  if (scored) {
    state.score[scored] += 1;
    state.phase = 'goal';
    state.goalMessage = randomMessage();
    state.goalTimer = GOAL_PAUSE;
  }

  return state;
}
