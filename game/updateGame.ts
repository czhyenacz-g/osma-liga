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
  FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CX, FIELD_CY,
  PLAYER_RADIUS, RETURN_SPEED, GOAL_PAUSE,
  CORNER_ZONE_MARGIN, CORNER_CLEAR_DELAY, CORNER_CLEAR_SPEED,
  CORNER_CLEAR_REPOSITION, CORNER_CLEAR_COOLDOWN,
  BALL_RADIUS,
  BALL_CONTROL_RADIUS, BALL_CONTROL_DAMPING, BALL_CONTROL_FORCE, BALL_CONTROL_OFFSET,
} from './constants';

const GOAL_MESSAGES = [
  'VAR nemáme, hraj dál.',
  'Tohle chtěl centru.',
  'Brankář šel na párek.',
  'Fyzika rezignovala.',
  'Okresní fotbal v plné kráse.',
];

const HOME_OWN_GOAL_MESSAGES = [
  'Vlastní gól. To se zapíše, ale nikdo se k tomu nehlásí.',
  'Obrana si to vyřešila sama. Bohužel.',
  'Brankář čekal střelu soupeře. Chyba.',
  'Tohle byla přihrávka do historie.',
  'Náhoda FC překonala vlastního brankáře.',
];

const AWAY_OWN_GOAL_MESSAGES = [
  'Vlastní gól. Okresní fotbal v plné kráse.',
  'Obrana FK Pařezov si to vyřešila sama.',
  'Brankář čekal střelu. Dostalo se to jinak.',
];

function pickMessage(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
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
  state.cornerTimer = 0;
  state.cornerClearCooldown = 0;
  state.lastTouchTeam = null;
  state.lastTouchPlayerId = null;
  state.isOwnGoal = false;
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

  // ── Soft ball control (active player only, no kick) ───────────────────────
  // Gently slows the ball and nudges it toward a controlled position in front
  // of the player. Deactivated when kick is held so it doesn't dampen shots.

  if (!input.kick && activeDist < BALL_CONTROL_RADIUS) {
    state.ball.vel.x *= BALL_CONTROL_DAMPING;
    state.ball.vel.y *= BALL_CONTROL_DAMPING;

    const targetDir = mvLen > 0.1
      ? { x: mvx / PLAYER_SPEED, y: mvy / PLAYER_SPEED }
      : normalize({ x: FIELD_R - active.pos.x, y: FIELD_CY - active.pos.y });

    const targetPoint = {
      x: active.pos.x + targetDir.x * BALL_CONTROL_OFFSET,
      y: active.pos.y + targetDir.y * BALL_CONTROL_OFFSET,
    };

    const tx = targetPoint.x - state.ball.pos.x;
    const ty = targetPoint.y - state.ball.pos.y;
    const tLen = Math.sqrt(tx * tx + ty * ty);
    if (tLen > 1) {
      state.ball.vel.x += (tx / tLen) * BALL_CONTROL_FORCE * dt;
      state.ball.vel.y += (ty / tLen) * BALL_CONTROL_FORCE * dt;
    }
  }

  // ── Space kick ────────────────────────────────────────────────────────────

  if (input.kick && activeDist < KICK_RANGE && active.kickCooldown <= 0) {
    let kickDir: Vec2;
    if (mvLen > 0.1) {
      kickDir = { x: mvx / PLAYER_SPEED, y: mvy / PLAYER_SPEED };
    } else {
      kickDir = normalize({
        x: FIELD_R - state.ball.pos.x,
        y: FIELD_CY - state.ball.pos.y,
      });
    }
    state.ball.vel.x += kickDir.x * KICK_FORCE;
    state.ball.vel.y += kickDir.y * KICK_FORCE;
    active.kickCooldown = KICK_COOLDOWN;
    state.lastTouchTeam = 'home';
    state.lastTouchPlayerId = active.id;
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

  // ── Corner zone clearance ─────────────────────────────────────────────────

  // Decrement cooldown after a clear (suppresses immediate re-trigger)
  if (state.cornerClearCooldown > 0) {
    state.cornerClearCooldown = Math.max(0, state.cornerClearCooldown - dt);
  }

  const nearLeft  = state.ball.pos.x - FIELD_L < CORNER_ZONE_MARGIN;
  const nearRight = FIELD_R - state.ball.pos.x < CORNER_ZONE_MARGIN;
  const nearTop   = state.ball.pos.y - FIELD_T < CORNER_ZONE_MARGIN;
  const nearBot   = FIELD_B - state.ball.pos.y < CORNER_ZONE_MARGIN;
  const inCorner  = (nearLeft || nearRight) && (nearTop || nearBot);

  if (inCorner && state.cornerClearCooldown <= 0) {
    state.cornerTimer += dt;
    if (state.cornerTimer >= CORNER_CLEAR_DELAY) {
      const dir = normalize({
        x: FIELD_CX - state.ball.pos.x,
        y: FIELD_CY - state.ball.pos.y,
      });
      // Move ball toward center before applying velocity so it escapes the corner
      state.ball.pos = clampPos(
        {
          x: state.ball.pos.x + dir.x * CORNER_CLEAR_REPOSITION,
          y: state.ball.pos.y + dir.y * CORNER_CLEAR_REPOSITION,
        },
        FIELD_L + BALL_RADIUS, FIELD_R - BALL_RADIUS,
        FIELD_T + BALL_RADIUS, FIELD_B - BALL_RADIUS,
      );
      state.ball.vel.x = dir.x * CORNER_CLEAR_SPEED + (Math.random() - 0.5) * 40;
      state.ball.vel.y = dir.y * CORNER_CLEAR_SPEED + (Math.random() - 0.5) * 40;
      state.cornerTimer = 0;
      state.cornerClearCooldown = CORNER_CLEAR_COOLDOWN;
      state.cornerKickCount += 1;
    }
  } else if (!inCorner) {
    state.cornerTimer = 0;
  }

  // ── Goal check ────────────────────────────────────────────────────────────

  const scored = checkGoal(state);
  if (scored) {
    // Own goal: ball scored into team's OWN net by their last touch
    const isOwnGoal =
      (scored === 'away' && state.lastTouchTeam === 'home') ||
      (scored === 'home' && state.lastTouchTeam === 'away');

    state.score[scored] += 1;
    state.phase = 'goal';
    state.isOwnGoal = isOwnGoal;

    if (isOwnGoal && scored === 'away') {
      state.goalMessage = pickMessage(HOME_OWN_GOAL_MESSAGES);
    } else if (isOwnGoal && scored === 'home') {
      state.goalMessage = pickMessage(AWAY_OWN_GOAL_MESSAGES);
    } else {
      state.goalMessage = pickMessage(GOAL_MESSAGES);
    }

    state.goalTimer = GOAL_PAUSE;
  }

  return state;
}
