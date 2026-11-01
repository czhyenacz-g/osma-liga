import type { Team, Vec2 } from './types';
import { FIELD_L, FIELD_R } from './constants';

// Off-ball AI positioning limit: the pitch length split into eight equal
// segments; an AI field player WITHOUT the ball never targets the last one in
// front of the opponent's goal (it just crowded the goalkeeper and blocked
// its own team's shots). Only position TARGETS are capped — a player already
// inside walks back at its normal speed (no teleport), and the ball chaser,
// the human-controlled player and goalkeepers never go through this.
export const ATTACK_LIMIT_DEPTH = (FIELD_R - FIELD_L) / 8;

// Furthest x an off-ball AI player may target: home attacks right, away left.
export function attackLimitX(team: Team): number {
  return team === 'home' ? FIELD_R - ATTACK_LIMIT_DEPTH : FIELD_L + ATTACK_LIMIT_DEPTH;
}

export function capOffBallTarget(team: Team, target: Vec2): Vec2 {
  const limit = attackLimitX(team);
  const x = team === 'home' ? Math.min(target.x, limit) : Math.max(target.x, limit);
  return x === target.x ? target : { x, y: target.y };
}
