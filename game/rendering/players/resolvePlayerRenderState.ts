import type { GameState } from '../../types';
import { KICK_RANGE, KICK_COOLDOWN, KICK_MAX_CHARGE_MS, PLAYER_RADIUS } from '../../constants';
import { dist } from '../../physics';
import { TEAM_COLORS, GOALKEEPER_COLORS, FACING_DEADZONE_VX, MOVING_SPEED_THRESHOLD } from './playerVisualConfig';
import type { PlayerRenderState, PlayerTeam, FacingOrientation } from './playerVisualTypes';

export interface FacingResolution {
  direction: 1 | -1;
  orientation: FacingOrientation;
}

// Facing direction + orientation need one frame of memory per player (see
// FACING_DEADZONE_VX) — kept here, entirely outside GameState/OnlineSnapshot,
// and discarded whenever the caller discards it (e.g. on unmount). This is
// the only piece of "animation state" this module keeps, and it's never
// read by physics or sent anywhere.
//
// Coordinate convention (see game/constants.ts FIELD_T < FIELD_B): y grows
// downward, same as any HTML canvas — so a positive vy means the player is
// moving down the pitch, towards the viewer ('front'); negative vy means up,
// away from the viewer ('back'). Whichever axis has the bigger magnitude
// wins ('side' when horizontal movement dominates); ties go to front/back.
// Below the dead zone (near-stationary), the last resolved value is held
// instead of snapping back to a default — a player who stops keeps showing
// whichever way they were last actually facing.
export function createFacingDirectionTracker() {
  const facing = new Map<string, FacingResolution>();
  return function resolveFacing(id: string, vx: number, vy: number): FacingResolution {
    if (Math.hypot(vx, vy) > FACING_DEADZONE_VX) {
      const resolved: FacingResolution =
        Math.abs(vx) > Math.abs(vy)
          ? { direction: vx > 0 ? 1 : -1, orientation: 'side' }
          : { direction: facing.get(id)?.direction ?? 1, orientation: vy >= 0 ? 'front' : 'back' };
      facing.set(id, resolved);
      return resolved;
    }
    return facing.get(id) ?? { direction: 1, orientation: 'front' };
  };
}

export type FacingDirectionTracker = ReturnType<typeof createFacingDirectionTracker>;

function isMovingFromVelocity(vx: number, vy: number): boolean {
  return Math.hypot(vx, vy) > MOVING_SPEED_THRESHOLD;
}

// ── Bot engine (single-player: /hra/bot, /hra/bot-test — training, bot,
// bot-team, bounce all share this GameState shape) ─────────────────────────
export function resolveBotPlayerRenderStates(
  state: GameState,
  facingTracker: FacingDirectionTracker,
): PlayerRenderState[] {
  const chargeProgress = state.kickWasDown
    ? Math.min(1, (state.kickHeldSeconds * 1000) / KICK_MAX_CHARGE_MS)
    : 0;
  const removedIds = new Set(state.temporaryRemovals.map((r) => r.playerId));

  return state.players.map((p): PlayerRenderState => {
    const isActive = p.id === state.activePlayerId && p.team === 'home';
    const isGoalkeeper = p.role === 'goalkeeper';
    const colors = isGoalkeeper ? GOALKEEPER_COLORS : TEAM_COLORS[p.team];
    const moving = isMovingFromVelocity(p.vel.x, p.vel.y);
    // A kick just fired if this player's cooldown was recently (re)set — the
    // same read-only heuristic already used for kick SFX in GameCanvas.tsx
    // (kicker.kickCooldown > 0.2s window after a KICK_COOLDOWN=0.25s reset).
    const isKicking = p.kickCooldown > KICK_COOLDOWN * 0.6;
    const facing = facingTracker(p.id, p.vel.x, p.vel.y);

    return {
      id: p.id,
      team: p.team,
      label: p.label,
      x: p.pos.x,
      y: p.pos.y,
      vx: p.vel.x,
      vy: p.vel.y,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      isActive,
      isMine: p.team === 'home',
      isMoving: moving,
      facingDirection: facing.direction,
      orientation: facing.orientation,
      isCharging: isActive && state.kickWasDown,
      chargeProgress: isActive ? chargeProgress : 0,
      isKicking,
      hasBall: dist(p.pos, state.ball.pos) < KICK_RANGE,
      isRemoved: removedIds.has(p.id),
      isGoalkeeper,
      sizeScale: p.stats.size / PLAYER_RADIUS,
    };
  });
}

// ── Online multiplayer ──────────────────────────────────────────────────────
// Input shape mirrors the interpolated render players already computed in
// OnlineGameCanvas.tsx (RenderPlayer: rx/ry position, pvx/pvy smoothed
// velocity) — no new data is invented here, only mapped into the shared
// contract. kickChargeProgress is the existing client-local (own input only)
// charge estimate already computed there; it never touches the
// server-authoritative kick.
export interface OnlineRenderPlayerInput {
  id: string;
  team: PlayerTeam;
  label: string;
  rx: number;
  ry: number;
  pvx: number;
  pvy: number;
  active: boolean;
  removed?: boolean;
  isGoalkeeper?: boolean;
  // Visual size in px (server's OnlinePlayer.stats.size — see the backend's
  // playerStats.ts) as sent over the socket snapshot. Falls back to
  // PLAYER_RADIUS (no visual scaling) if a snapshot predates this field.
  size?: number;
}

export function resolveOnlinePlayerRenderStates(
  players: OnlineRenderPlayerInput[],
  ballPos: { x: number; y: number },
  myTeam: PlayerTeam | null,
  kickChargeProgress: number,
  facingTracker: FacingDirectionTracker,
): PlayerRenderState[] {
  return players.map((p): PlayerRenderState => {
    const isGoalkeeper = !!p.isGoalkeeper;
    const colors = isGoalkeeper ? GOALKEEPER_COLORS : TEAM_COLORS[p.team];
    const isMyActivePlayer = p.active && myTeam !== null && p.team === myTeam;
    const facing = facingTracker(p.id, p.pvx, p.pvy);

    return {
      id: p.id,
      team: p.team,
      label: p.label,
      x: p.rx,
      y: p.ry,
      vx: p.pvx,
      vy: p.pvy,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      isActive: p.active,
      isMine: myTeam !== null && p.team === myTeam,
      isMoving: isMovingFromVelocity(p.pvx, p.pvy),
      facingDirection: facing.direction,
      orientation: facing.orientation,
      isCharging: isMyActivePlayer && kickChargeProgress > 0,
      chargeProgress: isMyActivePlayer ? kickChargeProgress : 0,
      // No per-player kick-cooldown is transmitted over the socket protocol
      // today (see components/online/useOnlineGame.ts OnlinePlayer) — rather
      // than invent a new network field for a cosmetic flourish, this stays
      // false for online play. See task report for this known limitation.
      isKicking: false,
      hasBall: dist({ x: p.rx, y: p.ry }, ballPos) < KICK_RANGE,
      isRemoved: !!p.removed,
      isGoalkeeper,
      sizeScale: (p.size ?? PLAYER_RADIUS) / PLAYER_RADIUS,
    };
  });
}
