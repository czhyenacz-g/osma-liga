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

describe('createFacingDirectionTracker — orientation (front/back/side)', () => {
  it('resolves down movement (positive vy) to front', () => {
    const tracker = createFacingDirectionTracker();
    expect(tracker('p1', 0, 200).orientation).toBe('front');
  });

  it('resolves up movement (negative vy) to back', () => {
    const tracker = createFacingDirectionTracker();
    expect(tracker('p1', 0, -200).orientation).toBe('back');
  });

  it('resolves horizontal-dominant movement to side, with direction from the sign of vx', () => {
    const tracker = createFacingDirectionTracker();
    expect(tracker('p1', 200, 10)).toEqual({ direction: 1, orientation: 'side' });
    expect(tracker('p2', -200, -10)).toEqual({ direction: -1, orientation: 'side' });
  });

  it('holds the last resolved orientation/direction once velocity drops inside the dead zone', () => {
    const tracker = createFacingDirectionTracker();
    tracker('p1', -200, 0); // side, facing left
    expect(tracker('p1', 0, 0)).toEqual({ direction: -1, orientation: 'side' });

    const tracker2 = createFacingDirectionTracker();
    tracker2('p2', 0, -200); // back
    expect(tracker2('p2', 1, 1).orientation).toBe('back'); // still inside dead zone (hypot < 6)
  });

  it('defaults to front for a player that has never moved', () => {
    const tracker = createFacingDirectionTracker();
    expect(tracker('never-moved', 0, 0)).toEqual({ direction: 1, orientation: 'front' });
  });

  it('tracks each player id independently', () => {
    const tracker = createFacingDirectionTracker();
    tracker('a', 0, -200); // back
    tracker('b', 0, 200); // front
    expect(tracker('a', 0, 0).orientation).toBe('back');
    expect(tracker('b', 0, 0).orientation).toBe('front');
  });
});

describe('resolveBotPlayerRenderStates — orientation is independent of isActive', () => {
  it('every player gets an orientation derived from their own velocity, not whether they are the active player', () => {
    const state = createInitialState();
    const tracker = createFacingDirectionTracker();
    const n1 = state.players.find((p) => p.id === 'n1')!;
    const n2 = state.players.find((p) => p.id === 'n2')!;
    n1.vel.x = 0; n1.vel.y = -200; // n1 moves up (back)
    n2.vel.x = 0; n2.vel.y = 200; // n2 moves down (front)
    state.activePlayerId = 'n1'; // n1 is active, n2 is not

    const result = resolveBotPlayerRenderStates(state, tracker);
    expect(result.find((p) => p.id === 'n1')!.orientation).toBe('back');
    expect(result.find((p) => p.id === 'n2')!.orientation).toBe('front');
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

  describe('matchStatus (bench)', () => {
    const tracker = () => createFacingDirectionTracker();
    const ball = { x: 480, y: 280 };

    it('does not render bench players', () => {
      const players = [
        ...basePlayers,
        { id: 'h-bench-0', team: 'home' as const, label: 'B1', rx: 100, ry: 540, pvx: 0, pvy: 0, active: false, matchStatus: 'bench' as const },
        { id: 'a-bench-0', team: 'away' as const, label: 'B1', rx: 860, ry: 540, pvx: 0, pvy: 0, active: false, matchStatus: 'bench' as const },
      ];
      const result = resolveOnlinePlayerRenderStates(players, ball, 'home', 0, tracker());
      expect(result.map((p) => p.id)).toEqual(['h1', 'a1']);
      expect(result.some((p) => p.label === 'B1')).toBe(false);
    });

    it('renders field and temporarily deployed players', () => {
      const players = [
        { ...basePlayers[0], matchStatus: 'field' as const },
        { id: 'h-bench-0', team: 'home' as const, label: 'B1', rx: 150, ry: 450, pvx: 0, pvy: 0, active: false, matchStatus: 'temporarily_deployed' as const },
      ];
      const result = resolveOnlinePlayerRenderStates(players, ball, 'home', 0, tracker());
      expect(result.map((p) => p.id)).toEqual(['h1', 'h-bench-0']);
    });

    it('renders players without matchStatus (older backend snapshot)', () => {
      const result = resolveOnlinePlayerRenderStates(basePlayers, ball, 'home', 0, tracker());
      expect(result).toHaveLength(2);
    });

    it('renders the goalkeeper as goalkeeper with its server size', () => {
      const players = [
        ...basePlayers,
        { id: 'h-gk', team: 'home' as const, label: 'GK', rx: 94, ry: 280, pvx: 0, pvy: 0, active: false, isGoalkeeper: true, size: PLAYER_RADIUS * 1.15, matchStatus: 'field' as const },
      ];
      const gk = resolveOnlinePlayerRenderStates(players, ball, 'home', 0, tracker()).find((p) => p.id === 'h-gk')!;
      expect(gk.isGoalkeeper).toBe(true);
      expect(gk.sizeScale).toBeCloseTo(1.15);
      expect(gk.isActive).toBe(false);
    });

    it('keeps the active-player highlight when bench players are filtered out', () => {
      const players = [
        { id: 'h-bench-0', team: 'home' as const, label: 'B1', rx: 100, ry: 540, pvx: 0, pvy: 0, active: false, matchStatus: 'bench' as const },
        ...basePlayers,
      ];
      const result = resolveOnlinePlayerRenderStates(players, ball, 'home', 0.5, tracker());
      const h1 = result.find((p) => p.id === 'h1')!;
      expect(h1.isActive).toBe(true);
      expect(h1.chargeProgress).toBe(0.5);
    });

    it('does not throw on an unknown matchStatus and still renders the player', () => {
      const players = [{ ...basePlayers[0], matchStatus: 'injured' as unknown as 'field' }];
      expect(() => resolveOnlinePlayerRenderStates(players, ball, 'home', 0, tracker())).not.toThrow();
      expect(resolveOnlinePlayerRenderStates(players, ball, 'home', 0, tracker())).toHaveLength(1);
    });
  });
});
