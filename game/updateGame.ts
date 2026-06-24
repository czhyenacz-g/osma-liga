import type { GameState, InputState, Vec2 } from './types';
import { createInitialState } from './createInitialState';
import { updateAI } from './ai';
import { applySupportPositioning } from './supportPositioning';
import {
  updateBallPhysics,
  checkGoal,
  resolvePlayerBallCollisions,
  dist, normalize, clampPos,
} from './physics';
import {
  PLAYER_SPEED, KICK_RANGE, KICK_FORCE, KICK_COOLDOWN,
  KICK_TAP_FORCE_MULTIPLIER, KICK_MAX_CHARGE_FORCE_MULTIPLIER, KICK_MAX_CHARGE_MS,
  FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CX, FIELD_CY,
  PLAYER_RADIUS, GOAL_PAUSE,
  ACTIVE_PLAYER_SWITCH_MARGIN, ACTIVE_PLAYER_SWITCH_MARGIN_FADE_DISTANCE,
  MANUAL_SWITCH_LOCK_DURATION, TEAMMATE_SEPARATION_RADIUS, TEAMMATE_SEPARATION_STRENGTH,
  CORNER_ZONE_MARGIN, CORNER_CLEAR_DELAY, CORNER_CLEAR_SPEED,
  CORNER_CLEAR_REPOSITION, CORNER_CLEAR_COOLDOWN,
  BALL_RADIUS,
  BALL_CONTROL_RADIUS, BALL_CONTROL_DAMPING, BALL_CONTROL_FORCE, BALL_CONTROL_INPUT_FORCE, BALL_CONTROL_OFFSET,
} from './constants';
import {
  TemporaryRemovalConfig, DEFAULT_TEMPORARY_REMOVAL_CONFIG,
  updateTemporaryRemovals, getRemovedPlayerIds,
} from './temporaryRemoval';
import {
  PassAndSwitchConfig, DEFAULT_PASS_AND_SWITCH_CONFIG,
  hasBallControl, findBestPassTarget, computePassVelocity,
} from './passAndSwitch';

const GOAL_MESSAGES = [
  'VAR nemáme, hraj dál.',
  'Tohle měl být centr? Ale počítá se.',
  'Brankář šel na párek.',
  'Fyzika rezignovala.',
  'Okresní fotbal v plné kráse.',
  'Hlavně, že se to třepe v síti, způsob neřeš!',
  'Zelená je tjáva, fotbal to je hja.',
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

// Short extra line shown under the main goal message whenever the human
// (home) team just conceded — regardless of whether it was a normal goal
// or a home own goal, the net result for the player is the same.
const CONCEDED_GOAL_MESSAGES = [
  'Ale dali gól tobě.',
  'Hele… gól to byl krásnej. Škoda, že do tvojí brány.',
  'Tohle nebyla obrana. To byla komentovaná prohlídka trávníku.',
  'Brankář se tváří, že to bylo mimo jeho pracovní dobu.',
  'Na lavičce se právě někdo přestal smát.',
  'Soupeř děkuje za volný průchod.',
  'Tohle si obrana za rámeček nedá.',
  'Trenér právě objevil nové vrásky.',
  'Výčep na tribuně ztichl. Na dvě vteřiny.',
  'Tady se někdo zapomněl vrátit z klobásy.',
];

function pickMessage(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

// The current active player normally needs a clear ACTIVE_PLAYER_SWITCH_MARGIN
// lead before losing the role (prevents flicker near the ball). But once the
// ball is far from them — e.g. just kicked across the pitch — that bias should
// fade out so a much-closer teammate takes over almost immediately.
function computeSwitchMargin(currentDist: number): number {
  const scale = Math.max(0, 1 - currentDist / ACTIVE_PLAYER_SWITCH_MARGIN_FADE_DISTANCE);
  return ACTIVE_PLAYER_SWITCH_MARGIN * scale;
}

function resetPositions(state: GameState): void {
  const fresh = createInitialState();
  // Players currently leaving/on the bench/returning stay put — yanking them
  // back onto the pitch on a goal reset would bypass their bench timer.
  const removedIds = getRemovedPlayerIds(state);
  for (let i = 0; i < state.players.length; i++) {
    if (removedIds.has(state.players[i].id)) continue;
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
  state.isConceded = false;
  state.concededMessage = '';
}

export function updateGame(
  state: GameState,
  input: InputState,
  dt: number,
  temporaryRemovalConfig: TemporaryRemovalConfig = DEFAULT_TEMPORARY_REMOVAL_CONFIG,
  passAndSwitchConfig: PassAndSwitchConfig = DEFAULT_PASS_AND_SWITCH_CONFIG,
): GameState {
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

  // ── Temporary removals (MVP: random substitution) ────────────────────────
  // Runs before active-player resolution so a freshly removed player is
  // excluded from selection in the same tick it leaves.
  updateTemporaryRemovals(state, dt, temporaryRemovalConfig);
  const removedIds = getRemovedPlayerIds(state);

  // ── Active player selection with hysteresis ──────────────────────────────
  // The current active player stays active until a different player is clearly
  // closer by ACTIVE_PLAYER_SWITCH_MARGIN, preventing jitter when two players
  // are at similar distances from the ball.

  const homePlayers = state.players.filter(p => p.team === 'home' && !removedIds.has(p.id));
  if (homePlayers.length === 0) return state; // never happens in MVP — pickPlayerToRemove keeps at least one

  let nearest = homePlayers[0];
  let nearestDist = Infinity;
  for (const p of homePlayers) {
    const d = dist(p.pos, state.ball.pos);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = p;
    }
  }

  // Automatic candidate — tracked via its own field (not activePlayerId) so
  // it keeps running in the background while a manual override is active and
  // resumes smoothly once the manual lock expires.
  const autoCurrent = homePlayers.find(p => p.id === state.autoActivePlayerId);
  let auto: typeof nearest;
  if (!autoCurrent) {
    auto = nearest;
  } else {
    const currentDist = dist(autoCurrent.pos, state.ball.pos);
    auto = (nearest.id !== autoCurrent.id && nearestDist + computeSwitchMargin(currentDist) < currentDist)
      ? nearest
      : autoCurrent;
  }
  state.autoActivePlayerId = auto.id;

  // A manual pick that became temporarily removed (e.g. random substitution
  // mid-lock) immediately loses the override — automatic selection takes
  // back over rather than waiting out the rest of the 3s lock.
  if (state.manualActivePlayerId && removedIds.has(state.manualActivePlayerId)) {
    state.manualActivePlayerId = null;
    state.manualLockRemaining = 0;
  }

  // ── Manual override (Q / PŘEP.) ───────────────────────────────────────────
  // Edge-detected here so holding the key only switches once. A press while
  // already locked cycles to the next teammate and renews the 3s lock.
  //
  // If the player currently holding the role has the ball under control,
  // Q/PŘEP. instead passes to the best available teammate and switches onto
  // them (pass-and-switch) — otherwise it's a plain cycle, same as before.
  const order = homePlayers.map(p => p.id);
  const switchEdge = input.switchPlayer && !state.switchKeyWasDown;
  state.switchKeyWasDown = input.switchPlayer;

  const previousManualPlayer = state.manualLockRemaining > 0 && state.manualActivePlayerId
    ? homePlayers.find(p => p.id === state.manualActivePlayerId)
    : undefined;
  const previousActive = previousManualPlayer ?? auto;

  if (switchEdge) {
    const opponents = state.players.filter(p => p.team === 'away' && !removedIds.has(p.id));
    const canPass = passAndSwitchConfig.enabled && hasBallControl(previousActive, state.ball, passAndSwitchConfig);
    const passTarget = canPass ? findBestPassTarget(previousActive, homePlayers, opponents) : null;

    if (passTarget) {
      const passVel = computePassVelocity(previousActive, passTarget, passAndSwitchConfig);
      state.ball.vel.x += passVel.x;
      state.ball.vel.y += passVel.y;
      previousActive.kickCooldown = KICK_COOLDOWN;
      state.lastTouchTeam = 'home';
      state.lastTouchPlayerId = previousActive.id;
      state.manualActivePlayerId = passTarget.id;
      state.manualLockRemaining = passAndSwitchConfig.manualLockSeconds;
    } else if (state.manualLockRemaining > 0) {
      const curId = state.manualActivePlayerId ?? order[0];
      state.manualActivePlayerId = order[(order.indexOf(curId) + 1) % order.length];
      state.manualLockRemaining = MANUAL_SWITCH_LOCK_DURATION;
    } else {
      state.manualActivePlayerId = order[(order.indexOf(auto.id) + 1) % order.length];
      state.manualLockRemaining = MANUAL_SWITCH_LOCK_DURATION;
    }
  } else if (state.manualLockRemaining > 0) {
    state.manualLockRemaining = Math.max(0, state.manualLockRemaining - dt);
  }

  const manualPlayer = state.manualLockRemaining > 0 && state.manualActivePlayerId
    ? homePlayers.find(p => p.id === state.manualActivePlayerId)
    : undefined;
  const active = manualPlayer ?? auto;

  state.activePlayerId = active.id;
  const activeDist = dist(active.pos, state.ball.pos);

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

  // ── Ball control (active player only, no kick) ───────────────────────────
  // Brakes the ball and pulls it toward a point in front of the player.
  // When the player holds a direction, BALL_CONTROL_INPUT_FORCE is used so
  // the ball swings around to the correct side within ~1 s. Without input the
  // weaker BALL_CONTROL_FORCE is used as a gentle settle toward goal direction.
  // Deactivated on kick so the control impulse never dampens shots.

  if (!input.kick && activeDist < BALL_CONTROL_RADIUS) {
    state.ball.vel.x *= BALL_CONTROL_DAMPING;
    state.ball.vel.y *= BALL_CONTROL_DAMPING;

    const hasInput = mvLen > 0.1;
    const targetDir = hasInput
      ? { x: mvx / PLAYER_SPEED, y: mvy / PLAYER_SPEED }
      : normalize({ x: FIELD_R - active.pos.x, y: FIELD_CY - active.pos.y });

    const targetPoint = {
      x: active.pos.x + targetDir.x * BALL_CONTROL_OFFSET,
      y: active.pos.y + targetDir.y * BALL_CONTROL_OFFSET,
    };

    const tx = targetPoint.x - state.ball.pos.x;
    const ty = targetPoint.y - state.ball.pos.y;
    const tLen = Math.sqrt(tx * tx + ty * ty);
    if (tLen > 4) {
      const force = hasInput ? BALL_CONTROL_INPUT_FORCE : BALL_CONTROL_FORCE;
      state.ball.vel.x += (tx / tLen) * force * dt;
      state.ball.vel.y += (ty / tLen) * force * dt;
    }
  }

  // ── Space kick (charged: tap = weaker, hold = stronger) ───────────────────
  // The shot fires on release, not on press. Holding ramps the force from
  // KICK_TAP_FORCE_MULTIPLIER up to KICK_MAX_CHARGE_FORCE_MULTIPLIER over
  // KICK_MAX_CHARGE_MS; a near-instant tap still fires immediately at the
  // tap multiplier rather than waiting.

  if (input.kick) {
    state.kickHeldSeconds = state.kickWasDown ? state.kickHeldSeconds + dt : 0;
    state.kickWasDown = true;
  } else {
    if (state.kickWasDown && activeDist < KICK_RANGE && active.kickCooldown <= 0) {
      let kickDir: Vec2;
      if (mvLen > 0.1) {
        kickDir = { x: mvx / PLAYER_SPEED, y: mvy / PLAYER_SPEED };
      } else {
        kickDir = normalize({
          x: FIELD_R - state.ball.pos.x,
          y: FIELD_CY - state.ball.pos.y,
        });
      }
      const chargeT = Math.min((state.kickHeldSeconds * 1000) / KICK_MAX_CHARGE_MS, 1);
      const forceMultiplier = KICK_TAP_FORCE_MULTIPLIER
        + (KICK_MAX_CHARGE_FORCE_MULTIPLIER - KICK_TAP_FORCE_MULTIPLIER) * chargeT;
      state.ball.vel.x += kickDir.x * KICK_FORCE * forceMultiplier;
      state.ball.vel.y += kickDir.y * KICK_FORCE * forceMultiplier;
      active.kickCooldown = KICK_COOLDOWN;
      state.lastTouchTeam = 'home';
      state.lastTouchPlayerId = active.id;
    }
    state.kickWasDown = false;
    state.kickHeldSeconds = 0;
  }

  // ── Support positioning for inactive home players ─────────────────────────

  applySupportPositioning(homePlayers, active, state.ball, dt);

  // ── Teammate separation ───────────────────────────────────────────────────
  // Soft push to prevent home players from fully overlapping. Active player
  // receives only 25 % of the push so player control feels stable.

  for (let i = 0; i < homePlayers.length - 1; i++) {
    for (let j = i + 1; j < homePlayers.length; j++) {
      const a = homePlayers[i];
      const b = homePlayers[j];
      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < TEAMMATE_SEPARATION_RADIUS) {
        const nx = d > 0.1 ? dx / d : 1;
        const ny = d > 0.1 ? dy / d : 0;
        const totalPush = (TEAMMATE_SEPARATION_RADIUS - d) * TEAMMATE_SEPARATION_STRENGTH;
        const aIsActive = a.id === active.id;
        const aFrac = aIsActive ? 0.25 : (b.id === active.id ? 0.75 : 0.5);
        const bFrac = 1.0 - aFrac;
        a.pos.x -= nx * totalPush * aFrac;
        a.pos.y -= ny * totalPush * aFrac;
        b.pos.x += nx * totalPush * bFrac;
        b.pos.y += ny * totalPush * bFrac;
        a.pos = clampPos(a.pos, FIELD_L + PLAYER_RADIUS, FIELD_R - PLAYER_RADIUS, FIELD_T + PLAYER_RADIUS, FIELD_B - PLAYER_RADIUS);
        b.pos = clampPos(b.pos, FIELD_L + PLAYER_RADIUS, FIELD_R - PLAYER_RADIUS, FIELD_T + PLAYER_RADIUS, FIELD_B - PLAYER_RADIUS);
      }
    }
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

    // Conceded by the human (home) team — true for a normal away goal and
    // for a home own goal alike, since either way home's net was breached.
    state.isConceded = scored === 'away';
    state.concededMessage = state.isConceded ? pickMessage(CONCEDED_GOAL_MESSAGES) : '';

    state.goalTimer = GOAL_PAUSE;
  }

  return state;
}
