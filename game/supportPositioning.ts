import type { Player, Ball } from './types';
import { clampPos } from './physics';
import {
  FIELD_L, FIELD_R, FIELD_T, FIELD_B, FIELD_CY,
  PLAYER_RADIUS, SUPPORT_PLAYER_SPEED,
} from './constants';

const FIELD_W = FIELD_R - FIELD_L;
const sc = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function applySupportPositioning(
  homePlayers: Player[],
  active: Player,
  ball: Ball,
  dt: number,
): void {
  const nonActive = homePlayers.filter(p => p !== active);
  const defender  = nonActive[0];
  const runner    = nonActive[1];

  if (defender) {
    const defTarget = {
      x: FIELD_L + FIELD_W * 0.25,
      y: sc(ball.pos.y, FIELD_T + 50, FIELD_B - 50),
    };
    const ddx = defTarget.x - defender.pos.x;
    const ddy = defTarget.y - defender.pos.y;
    const dd  = Math.sqrt(ddx * ddx + ddy * ddy);
    if (dd > 5) {
      defender.vel.x = (ddx / dd) * SUPPORT_PLAYER_SPEED;
      defender.vel.y = (ddy / dd) * SUPPORT_PLAYER_SPEED;
    } else {
      defender.vel.x = 0;
      defender.vel.y = 0;
    }
    defender.pos.x += defender.vel.x * dt;
    defender.pos.y += defender.vel.y * dt;
    defender.pos = clampPos(
      defender.pos,
      FIELD_L + PLAYER_RADIUS, FIELD_R - PLAYER_RADIUS,
      FIELD_T + PLAYER_RADIUS, FIELD_B - PLAYER_RADIUS,
    );
  }

  if (runner) {
    const vertOffset = ball.pos.y < FIELD_CY ? 80 : -80;
    const runX = sc(ball.pos.x + 120, FIELD_L + FIELD_W * 0.45, FIELD_R - 60);
    let   runY = sc(ball.pos.y + vertOffset, FIELD_T + 50, FIELD_B - 50);

    // Nudge away from active player if too close
    const rdx = runX - active.pos.x;
    const rdy = runY - active.pos.y;
    if (Math.sqrt(rdx * rdx + rdy * rdy) < 70) {
      runY = sc(runY + (vertOffset > 0 ? -40 : 40), FIELD_T + 50, FIELD_B - 50);
    }

    const rrx = runX - runner.pos.x;
    const rry = runY - runner.pos.y;
    const rr  = Math.sqrt(rrx * rrx + rry * rry);
    if (rr > 5) {
      runner.vel.x = (rrx / rr) * SUPPORT_PLAYER_SPEED;
      runner.vel.y = (rry / rr) * SUPPORT_PLAYER_SPEED;
    } else {
      runner.vel.x = 0;
      runner.vel.y = 0;
    }
    runner.pos.x += runner.vel.x * dt;
    runner.pos.y += runner.vel.y * dt;
    runner.pos = clampPos(
      runner.pos,
      FIELD_L + PLAYER_RADIUS, FIELD_R - PLAYER_RADIUS,
      FIELD_T + PLAYER_RADIUS, FIELD_B - PLAYER_RADIUS,
    );
  }
}
