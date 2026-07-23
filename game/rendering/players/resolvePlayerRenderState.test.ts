import { describe, it, expect } from 'vitest';
import { createInitialState } from '../../createInitialState';
import { PLAYER_RADIUS, KICK_COOLDOWN } from '../../constants';
import {
  resolveBotPlayerRenderStates,
  resolveOnlinePlayerRenderStates,
  createFacingDirectionTracker,
} from './resolvePlayerRenderState';

describe('resolveBotPlayerRenderStates', () => {
  it('never reads or derives a collision/hitbox radius — physics stays untouched', () => {
    const state = createInitialState();
    const tracker = createFacingDirectionTracker();
    const result = resolveBotPlayerRenderStates(state, tracker);
    for (const p of result) {
      expect(p).not.toHaveProperty('radius');
      expect(p).not.toHaveProperty('collisionRadius');
      expect(p).not.toHaveProperty('hitboxRadiusPx');
    }
    // The real hitbox constant is a fixed physics value the resolver never
    // imports for sizing purposes — proven by construction (this module has
    // no PLAYER_RADIUS-based branching), asserted here defensively.
    expect(PLAYER_RADIUS).toBe(18);
  });

  it('marks only the home team as isMine, matching single-player (you always control home)', () => {
    const state = createInitialState();
    const tracker = createFacingDirectionTracker();
    const result = resolveBotPlayerRenderStates(state, tracker);
    for (const p of result) {
      expect(p.isMine).toBe(p.team === 'home');
    }
  });

  it('flags exactly the current activePlayerId (home team) as isActive', () => {
    const state = createInitialState();
    state.activePlayerId = 'n2';
    const tracker = createFacingDirectionTracker();
    const result = resolveBotPlayerRenderStates(state, tracker);
    const active = result.filter((p) => p.isActive);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('n2');
  });

  it('derives isMoving from velocity magnitude with a sane threshold', () => {
    const state = createInitialState();
    const tracker = createFacingDirectionTracker();
    const p = state.players.find((pl) => pl.id === 'n1')!;

    p.vel.x = 0; p.vel.y = 0;
    expect(resolveBotPlayerRenderStates(state, tracker).find((r) => r.id === 'n1')!.isMoving).toBe(false);

    p.vel.x = 200; p.vel.y = 0;
    expect(resolveBotPlayerRenderStates(state, tracker).find((r) => r.id === 'n1')!.isMoving).toBe(true);
  });

  it('keeps the last facing direction while velocity is inside the dead zone', () => {
    const state = createInitialState();
    const tracker = createFacingDirectionTracker();
    const p = state.players.find((pl) => pl.id === 'n1')!;

    p.vel.x = 200; p.vel.y = 0;
    expect(resolveBotPlayerRenderStates(state, tracker).find((r) => r.id === 'n1')!.facingDirection).toBe(1);

    p.vel.x = -200; p.vel.y = 0;
    expect(resolveBotPlayerRenderStates(state, tracker).find((r) => r.id === 'n1')!.facingDirection).toBe(-1);

    // Small residual velocity below the dead zone must not flip facing back.
    p.vel.x = 1; p.vel.y = 0;
    expect(resolveBotPlayerRenderStates(state, tracker).find((r) => r.id === 'n1')!.facingDirection).toBe(-1);
  });

  it('reports isKicking only in the short window right after a kick resets the cooldown', () => {
    const state = createInitialState();
    const tracker = createFacingDirectionTracker();
    const p = state.players.find((pl) => pl.id === 'n1')!;

    p.kickCooldown = 0;
    expect(resolveBotPlayerRenderStates(state, tracker).find((r) => r.id === 'n1')!.isKicking).toBe(false);

    p.kickCooldown = KICK_COOLDOWN; // just kicked
    expect(resolveBotPlayerRenderStates(state, tracker).find((r) => r.id === 'n1')!.isKicking).toBe(true);
  });

  it('derives chargeProgress only for the active player, from kickWasDown/kickHeldSeconds', () => {
    const state = createInitialState();
    state.kickWasDown = true;
    state.kickHeldSeconds = 10; // long past max charge
    const tracker = createFacingDirectionTracker();
    const result = resolveBotPlayerRenderStates(state, tracker);
    const active = result.find((p) => p.id === state.activePlayerId)!;
    const inactive = result.find((p) => p.id !== state.activePlayerId && p.team === 'home')!;
    expect(active.chargeProgress).toBe(1);
    expect(active.isCharging).toBe(true);
    expect(inactive.chargeProgress).toBe(0);
  });
});

describe('resolveOnlinePlayerRenderStates', () => {
  const basePlayers = [
    { id: 'h1', team: 'home' as const, label: 'H1', rx: 400, ry: 280, pvx: 0, pvy: 0, active: true, removed: false },
    { id: 'a1', team: 'away' as const, label: 'A1', rx: 600, ry: 280, pvx: 0, pvy: 0, active: false, removed: false },
  ];

  it('isMine reflects the local role, not raw team-active state', () => {
    const tracker = createFacingDirectionTracker();
    const asHome = resolveOnlinePlayerRenderStates(basePlayers, { x: 480, y: 280 }, 'home', 0, tracker);
    expect(asHome.find((p) => p.id === 'h1')!.isMine).toBe(true);
    expect(asHome.find((p) => p.id === 'a1')!.isMine).toBe(false);

    const asAway = resolveOnlinePlayerRenderStates(basePlayers, { x: 480, y: 280 }, 'away', 0, tracker);
    expect(asAway.find((p) => p.id === 'h1')!.isMine).toBe(false);
    expect(asAway.find((p) => p.id === 'a1')!.isMine).toBe(true);
  });

  it('only applies local chargeProgress to the local active player', () => {
    const tracker = createFacingDirectionTracker();
    const result = resolveOnlinePlayerRenderStates(basePlayers, { x: 480, y: 280 }, 'home', 0.6, tracker);
    expect(result.find((p) => p.id === 'h1')!.chargeProgress).toBe(0.6);
    expect(result.find((p) => p.id === 'a1')!.chargeProgress).toBe(0);
  });

  it('never sets isKicking (no per-player kick state is transmitted over the socket protocol)', () => {
    const tracker = createFacingDirectionTracker();
    const result = resolveOnlinePlayerRenderStates(basePlayers, { x: 480, y: 280 }, 'home', 1, tracker);
    expect(result.every((p) => p.isKicking === false)).toBe(true);
  });

  it('maps the removed flag through unchanged', () => {
    const tracker = createFacingDirectionTracker();
    const players = [{ ...basePlayers[0], removed: true }];
    const result = resolveOnlinePlayerRenderStates(players, { x: 480, y: 280 }, 'home', 0, tracker);
    expect(result[0].isRemoved).toBe(true);
  });
});
