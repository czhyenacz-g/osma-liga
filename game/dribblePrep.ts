import type { DribblePrepState, GameState, Player, Vec2 } from './types';
import { BALL_PHYSICS_V3 } from './gameplayProfiles';
import { FIELD_L, FIELD_R, FIELD_T, FIELD_B } from './constants';

// V3 "prepared turn" — active with the v3-dribble profile
// (GameplayProfileConfig.dribblePrepEnabled) = LIVE_GAMEPLAY_PROFILE.
//
// While the human really dribbles (ball close, moving with the player, for
// a moment, no opponent near) and asks for a direction the ball is clearly
// NOT in front of, a short prep phase starts:
//   1. the player slows to prepPlayerSpeed,
//   2. the ball is carried round the player by a critically damped spring
//      toward a waypoint that walks along an arc (never through the
//      player's body) into the new direction — a force on the ball's
//      velocity, never a position write, so collisions stay in charge,
//   3. once the ball sits settled in front (or the window runs out) the
//      player ramps back to full speed over recoverSeconds.
// Everything is time-based (dt), not frame-based. An opponent near the
// ball, letting go of the controls, kicking or losing the ball ends it at
// once — no protection in duels, no endless assist. One exception: a
// drag-back AWAY from a pressing opponent (shield turn) stays assisted
// while no opponent touches the ball or stands in the new direction.

const C = BALL_PHYSICS_V3;
const DEG = Math.PI / 180;

export function createDribblePrepState(): DribblePrepState {
  return {
    playerId: null, controlSeconds: 0, phase: 'none', remaining: 0, recoverTotal: 0, side: 1,
    prepDir: null, chainSeconds: 0, idleSeconds: 0, shield: false,
  };
}

export function resetDribblePrep(state: GameState): void {
  state.dribblePrep = createDribblePrepState();
}

function opponentsNearBall(state: GameState, team: Player['team']): Vec2[] {
  const near: Vec2[] = [];
  for (const p of state.players) {
    if (p.team === team || p.matchStatus === 'bench') continue;
    if (Math.hypot(p.pos.x - state.ball.pos.x, p.pos.y - state.ball.pos.y) <= C.noOpponentRadius) near.push(p.pos);
  }
  return near;
}

// Shield turn allowed: every near opponent is off the ball (not touching
// it) and on the side the player is turning away from.
function shieldClear(near: Vec2[], player: Vec2, ball: Vec2, dir: Vec2): boolean {
  return near.every((o) => Math.hypot(o.x - ball.x, o.y - ball.y) > C.shieldContactRadius
    && (o.x - player.x) * dir.x + (o.y - player.y) * dir.y < 0);
}

// Angle (deg, 0..180) between the ball's position relative to the player
// and a unit direction.
function offAngleDeg(rel: Vec2, dir: Vec2): number {
  const len = Math.hypot(rel.x, rel.y);
  if (len < 0.001) return 0;
  return Math.acos(Math.max(-1, Math.min(1, (rel.x * dir.x + rel.y * dir.y) / len))) / DEG;
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

// Which way round the player the ball travels. For a clear turn the short
// way; for a near-reversal the side whose halfway point is farther from
// the touchlines (and from a pressing opponent), so at the top line the
// ball goes round the bottom and a drag-back goes round the free side.
function chooseSide(player: Vec2, rel: Vec2, dir: Vec2, opponents: Vec2[]): number {
  const thB = Math.atan2(rel.y, rel.x);
  const delta = wrap(Math.atan2(dir.y, dir.x) - thB);
  if (Math.abs(delta) < 150 * DEG) return delta >= 0 ? 1 : -1;
  const room = (side: number) => {
    const a = thB + side * Math.PI / 2;
    const x = player.x + Math.cos(a) * C.targetDistance;
    const y = player.y + Math.sin(a) * C.targetDistance;
    let r = Math.min(x - FIELD_L, FIELD_R - x, y - FIELD_T, FIELD_B - y);
    for (const o of opponents) r = Math.min(r, Math.hypot(o.x - x, o.y - y) - C.shieldContactRadius);
    return r;
  };
  const plus = room(1), minus = room(-1);
  if (Math.abs(plus - minus) < 1) return delta >= 0 ? 1 : -1;
  return plus > minus ? 1 : -1;
}

// Speed cap for the player carrying the ball: ball close and moving with
// it (same test as a settled dribble), not just shot. Runs before the
// active player moves, like updateDribblePrep. Infinity = no cap.
export function carrierSpeedCap(state: GameState, active: Player, selfTrapProtected: boolean): number {
  if (selfTrapProtected) return Infinity;
  const d = Math.hypot(state.ball.pos.x - active.pos.x, state.ball.pos.y - active.pos.y);
  const relSpeed = Math.hypot(state.ball.vel.x - active.vel.x, state.ball.vel.y - active.vel.y);
  return d < C.dribbleControlRadius && relSpeed < C.dribbleMaxRelativeSpeed
    ? active.stats.speed * C.carrierSpeedFactor
    : Infinity;
}

// Runs before the active player moves. `active.vel` still holds last
// frame's velocity here. Returns the speed cap for this frame (Infinity =
// no cap).
export function updateDribblePrep(
  state: GameState,
  active: Player,
  dir: Vec2 | null,
  kickHeld: boolean,
  selfTrapProtected: boolean,
  dt: number,
): number {
  const dp = state.dribblePrep;
  if (dp.playerId !== active.id) {
    state.dribblePrep = createDribblePrepState();
    state.dribblePrep.playerId = active.id;
    return Infinity;
  }

  const rel = { x: state.ball.pos.x - active.pos.x, y: state.ball.pos.y - active.pos.y };
  const d = Math.hypot(rel.x, rel.y);
  const relSpeed = Math.hypot(state.ball.vel.x - active.vel.x, state.ball.vel.y - active.vel.y);
  const near = opponentsNearBall(state, active.team);
  const opponentNear = near.length > 0;
  const onBall = !kickHeld && !selfTrapProtected && d < C.dribbleControlRadius;
  // A settled dribble (ball moving with the player) — required to START a
  // chain, so a loose ball rolling past is never pulled in.
  dp.controlSeconds = onBall && relSpeed < C.dribbleMaxRelativeSpeed ? Math.min(1, dp.controlSeconds + dt) : 0;
  // Which kind of prep a turn toward `aim` may use: plain (nobody near),
  // shield (sharp turn away from the pressure) or none.
  const turnKind = (aim: Vec2, off: number): 'plain' | 'shield' | null => {
    if (!onBall) return null;
    if (!opponentNear) return 'plain';
    return off >= C.shieldTurnMinAngleDeg && shieldClear(near, active.pos, state.ball.pos, aim) ? 'shield' : null;
  };

  if (dp.phase === 'prep') dp.chainSeconds += dt;
  else dp.idleSeconds += dt;
  if (dp.phase !== 'prep' && dp.idleSeconds >= C.chainResetSeconds) dp.chainSeconds = 0;

  const full = active.stats.speed;
  const budgetLeft = dp.chainSeconds < C.maxChainSeconds;
  const startPrep = (aim: Vec2, off: number, kind: 'plain' | 'shield') => {
    const sharp = Math.max(0, Math.min(1, (off - 90) / 90));
    dp.phase = 'prep';
    dp.remaining = C.prepSeconds + (C.prepSeconds180 - C.prepSeconds) * sharp;
    dp.side = chooseSide(active.pos, rel, aim, near);
    dp.prepDir = aim;
    dp.idleSeconds = 0;
    // A sharp turn may carry on under the shield rules even if it started
    // in the clear and an opponent closes in on the way round.
    dp.shield = kind === 'shield' || off >= C.shieldTurnMinAngleDeg;
  };
  const toRecover = () => {
    dp.phase = 'recover';
    dp.recoverTotal = C.recoverSeconds;
    dp.remaining = C.recoverSeconds;
    dp.prepDir = null;
  };

  if (dp.phase === 'prep') {
    // A running shield turn keeps going while the pressure stays off the
    // ball and behind; the ball has already swung part-way, so the angle
    // test only applies when it starts.
    const allowed = onBall && (!opponentNear || (dp.shield && !!dir && shieldClear(near, active.pos, state.ball.pos, dir)));
    if (!dir || !allowed) {
      dp.phase = 'none';
      dp.prepDir = null;
      return Infinity;
    }
    // New turn mid-prep: re-aim (fresh window), but only within the chain
    // budget — the budget, not the window, is what can't be extended.
    if (dp.prepDir && offAngleDeg(dp.prepDir, dir) >= C.reaimMinAngleDeg) {
      const off = offAngleDeg(rel, dir);
      const kind = turnKind(dir, off);
      if (!budgetLeft || !kind) { toRecover(); return C.prepPlayerSpeed; }
      startPrep(dir, off, kind);
      return C.prepPlayerSpeed;
    }
    const settled = offAngleDeg(rel, dir) <= C.settledAngleDeg
      && relSpeed < C.settledRelativeSpeed
      && d > C.targetDistance - 10 && d < C.targetDistance + 14;
    dp.remaining -= dt;
    if (settled || dp.remaining <= 0 || !budgetLeft) toRecover();
    return C.prepPlayerSpeed;
  }

  // Start (from a settled dribble) or continue a chain (from recover).
  const canStart = dp.phase === 'recover' || dp.controlSeconds >= C.dribbleMinControlSeconds;
  if (dir && budgetLeft && canStart) {
    const off = offAngleDeg(rel, dir);
    const kind = off >= C.turnMinAngleDeg ? turnKind(dir, off) : null;
    if (kind) {
      startPrep(dir, off, kind);
      return C.prepPlayerSpeed;
    }
  }

  if (dp.phase === 'recover') {
    if (!dir || opponentNear) { dp.phase = 'none'; return Infinity; }
    dp.remaining -= dt;
    if (dp.remaining <= 0) { dp.phase = 'none'; return Infinity; }
    const t = 1 - dp.remaining / dp.recoverTotal;
    return C.prepPlayerSpeed + (full - C.prepPlayerSpeed) * t;
  }
  return Infinity;
}

// Runs in the ball-control step, after the active player moved. Returns
// true when it handled ball control this frame (classic control skipped).
export function applyDribblePrepBallControl(state: GameState, active: Player, dt: number): boolean {
  const dp = state.dribblePrep;
  if (dp.phase !== 'prep' || dp.playerId !== active.id) return false;
  if (Math.hypot(active.vel.x, active.vel.y) < 0.001) return false;

  const ball = state.ball;
  const rel = { x: ball.pos.x - active.pos.x, y: ball.pos.y - active.pos.y };
  const d = Math.hypot(rel.x, rel.y);
  if (d < 0.001) return false;
  const radial = { x: rel.x / d, y: rel.y / d };

  // Remaining angle to the new direction, travelled on the side chosen at
  // prep start; close to the target the short way wins, so the ball
  // settles instead of orbiting past.
  let delta = wrap(Math.atan2(active.vel.y, active.vel.x) - Math.atan2(rel.y, rel.x));
  if (Math.abs(delta) > 100 * DEG && Math.sign(delta) !== dp.side) delta += dp.side * 2 * Math.PI;
  const dirSign = delta >= 0 ? 1 : -1;
  const tangential = { x: -radial.y * dirSign, y: radial.x * dirSign };
  const tanSpeed = Math.min(C.arcSpeed, C.angularGain * Math.abs(delta) * C.targetDistance);
  const radSpeed = Math.max(-C.maxRadialSpeed, Math.min(C.maxRadialSpeed, C.radialGain * (C.targetDistance - d)));
  const wantX = tangential.x * tanSpeed + radial.x * radSpeed;
  const wantY = tangential.y * tanSpeed + radial.y * radSpeed;

  // Relative velocity eases toward the wanted one (exp-based, capped).
  const relVx = ball.vel.x - active.vel.x;
  const relVy = ball.vel.y - active.vel.y;
  const blend = 1 - Math.exp(-C.velocityBlendRate * dt);
  let dvx = (wantX - relVx) * blend;
  let dvy = (wantY - relVy) * blend;
  const dv = Math.hypot(dvx, dvy), dvMax = C.maxAccel * dt;
  if (dv > dvMax) { dvx *= dvMax / dv; dvy *= dvMax / dv; }
  ball.vel.x += dvx;
  ball.vel.y += dvy;
  return true;
}
