import type { GameState } from '../../types';
import { KICK_RANGE, KICK_COOLDOWN, KICK_MAX_CHARGE_MS } from '../../constants';
import { dist } from '../../physics';
import { TEAM_COLORS, FACING_DEADZONE_VX, MOVING_SPEED_THRESHOLD } from './playerVisualConfig';
import type { PlayerRenderState, PlayerTeam } from './playerVisualTypes';

// Facing direction needs one frame of memory per player (see
// FACING_DEADZONE_VX) — kept here, entirely outside GameState/OnlineSnapshot,
// and discarded whenever the caller discards it (e.g. on unmount). This is
// the only piece of "animation state" this module keeps, and it's never
// read by physics or sent anywhere.
export function createFacingDirectionTracker() {
  const facing = new Map<string, 1 | -1>();
  return function resolveFacing(id: string, vx: number): 1 | -1 {
    if (Math.abs(vx) > FACING_DEADZONE_VX) {
      const dir: 1 | -1 = vx > 0 ? 1 : -1;
      facing.set(id, dir);
      return dir;
    }
    return facing.get(id) ?? 1;
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
    const colors = TEAM_COLORS[p.team];
    const moving = isMovingFromVelocity(p.vel.x, p.vel.y);
    // A kick just fired if this player's cooldown was recently (re)set — the
    // same read-only heuristic already used for kick SFX in GameCanvas.tsx
    // (kicker.kickCooldown > 0.2s window after a KICK_COOLDOWN=0.25s reset).
    const isKicking = p.kickCooldown > KICK_COOLDOWN * 0.6;

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
      facingDirection: facingTracker(p.id, p.vel.x),
      isCharging: isActive && state.kickWasDown,
      chargeProgress: isActive ? chargeProgress : 0,
      isKicking,
      hasBall: dist(p.pos, state.ball.pos) < KICK_RANGE,
      isRemoved: removedIds.has(p.id),
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
}

export function resolveOnlinePlayerRenderStates(
  players: OnlineRenderPlayerInput[],
  ballPos: { x: number; y: number },
  myTeam: PlayerTeam | null,
  kickChargeProgress: number,
  facingTracker: FacingDirectionTracker,
): PlayerRenderState[] {
  return players.map((p): PlayerRenderState => {
    const colors = TEAM_COLORS[p.team];
    const isMyActivePlayer = p.active && myTeam !== null && p.team === myTeam;

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
      facingDirection: facingTracker(p.id, p.pvx),
      isCharging: isMyActivePlayer && kickChargeProgress > 0,
      chargeProgress: isMyActivePlayer ? kickChargeProgress : 0,
      // No per-player kick-cooldown is transmitted over the socket protocol
      // today (see components/online/useOnlineGame.ts OnlinePlayer) — rather
      // than invent a new network field for a cosmetic flourish, this stays
      // false for online play. See task report for this known limitation.
      isKicking: false,
      hasBall: dist({ x: p.rx, y: p.ry }, ballPos) < KICK_RANGE,
      isRemoved: !!p.removed,
    };
  });
}
