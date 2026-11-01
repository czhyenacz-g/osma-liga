import { describe, it, expect } from 'vitest';
import type { GameState, InputState } from './types';
import { createInitialState } from './createInitialState';
import { updateGame } from './updateGame';
import { DEFAULT_TEMPORARY_REMOVAL_CONFIG } from './temporaryRemoval';
import { LIVE_GAMEPLAY_PROFILE, type GameplayProfile } from './gameplayProfiles';
import { attachInputListeners, createInputState } from './input';
import { SHOT_AIM, startShotAim, steerShotAim, shotAimDir } from './shotAim';
import { FIELD_L, FIELD_R, FIELD_CY, GOAL_T, GOAL_B, PLAYER_SPEED, BALL_CONTROL_RADIUS, KICK_FORCE, BALL_MAX_SPEED } from './constants';

// Aimed charged shot (shotAim.ts) through the local engine (/hra/bot). The
// server port runs the same cases in project-hub-api
// src/gameEngine/shotAim.test.ts (both attacking sides, 30 Hz tick).

const NO_REMOVALS = { ...DEFAULT_TEMPORARY_REMOVAL_CONFIG, enabled: false };
const DT = 1 / 60;
type Keys = Partial<InputState>;

// The home field player alone with the ball in front of it (toward the
// away goal); `opponents` keeps those away players on the pitch.
function setup(x: number, y: number, opts: { defender?: { x: number; y: number }; profile?: GameplayProfile } = {}) {
  const profile = opts.profile ?? LIVE_GAMEPLAY_PROFILE;
  const state = createInitialState(NO_REMOVALS, undefined, profile);
  const me = state.players.find((p) => p.team === 'home' && p.role === 'field_player' && p.matchStatus === 'field')!;
  const def = state.players.find((p) => p.team === 'away' && p.role === 'field_player' && p.matchStatus === 'field')!;
  for (const p of state.players) {
    if (p === me || (opts.defender && p === def)) continue;
    p.matchStatus = 'bench';
    p.pos = { x: -500, y: -500 };
  }
  me.pos = { x, y };
  if (opts.defender) def.pos = { ...opts.defender };
  state.activePlayerId = me.id;
  state.ball.pos = { x: x + 26, y };
  return { state, me, def, profile };
}

function run(ctx: { state: GameState; profile: GameplayProfile }, keys: Keys, seconds: number, each?: (s: GameState) => void) {
  for (let i = 0; i < Math.max(1, Math.round(seconds / DT)); i++) {
    ctx.state = updateGame(ctx.state, {
      up: !!keys.up, down: !!keys.down, left: !!keys.left, right: !!keys.right, kick: !!keys.kick, restart: false, switchPlayer: false,
    }, DT, NO_REMOVALS, undefined, { disableOpponentAI: true, gameplayProfile: ctx.profile });
    each?.(ctx.state);
  }
}

// Dribble right, press kick, hold `aim` for `aimFor` s of a `charge` s
// charge, release; returns where the ball crosses x = FIELD_R - 12 and the
// ball speed right after the release.
function shot(y: number, aim: Keys, charge = 0.4, aimFor = charge, x = 600) {
  const ctx = setup(x, y);
  run(ctx, { right: true }, 0.3);
  run(ctx, { right: true, kick: true }, DT);
  run(ctx, { ...aim, kick: true }, aimFor);
  if (charge > aimFor) run(ctx, { kick: true }, charge - aimFor);
  run(ctx, {}, DT);
  const speed = Math.hypot(ctx.state.ball.vel.x, ctx.state.ball.vel.y);
  let crossY: number | null = null;
  run(ctx, {}, 1.5, (s) => { if (crossY === null && s.ball.pos.x >= FIELD_R - 12) crossY = s.ball.pos.y; });
  return { crossY, speed, state: ctx.state };
}

describe('shotAim helpers (shared model, mirrored on the server)', () => {
  it('starts at the goal centre toward the goal, nowhere else', () => {
    expect(startShotAim('p', null, { x: 600, y: 200 }, 1).aimY).toBe((GOAL_T + GOAL_B) / 2);
    expect(startShotAim('p', { x: 1, y: 0 }, { x: 600, y: 200 }, 1).aimY).toBe(FIELD_CY);
    // Backward / sideways kick, or too far from the goal: no aim (unchanged kick).
    expect(startShotAim('p', { x: -1, y: 0 }, { x: 600, y: 200 }, 1).aimY).toBeNull();
    expect(startShotAim('p', { x: 0, y: -1 }, { x: 600, y: 200 }, 1).aimY).toBeNull();
    expect(startShotAim('p', { x: 1, y: 0 }, { x: 300, y: 280 }, 1).aimY).toBeNull();
  });

  it('attacking left mirrors attacking right exactly', () => {
    const r = startShotAim('p', { x: 1, y: 0 }, { x: 700, y: 240 }, 1);
    const l = startShotAim('p', { x: -1, y: 0 }, { x: FIELD_L + FIELD_R - 700, y: 240 }, -1);
    for (let i = 0; i < 10; i++) { steerShotAim(r, true, false, 1 / 30); steerShotAim(l, true, false, 1 / 30); }
    expect(l.aimY).toBe(r.aimY);
    const dr = shotAimDir(r, { x: 700, y: 240 }, 1)!, dl = shotAimDir(l, { x: FIELD_L + FIELD_R - 700, y: 240 }, -1)!;
    expect(dl.x).toBeCloseTo(-dr.x, 10);
    expect(dl.y).toBeCloseTo(dr.y, 10);
  });

  it('steers smoothly and frame-rate independently, clamped to the goal ± overshoot', () => {
    const at = (hz: number, secs: number) => {
      const a = startShotAim('p', null, { x: 700, y: 280 }, 1);
      for (let i = 0; i < Math.round(secs * hz); i++) steerShotAim(a, false, true, 1 / hz);
      return a.aimY!;
    };
    expect(at(60, 0.2)).toBeCloseTo(FIELD_CY + SHOT_AIM.aimSpeed * 0.2, 6);
    expect(at(144, 1 / 3)).toBeCloseTo(at(30, 1 / 3), 6);
    expect(at(60, 3)).toBe(GOAL_B + SHOT_AIM.aimOvershoot);
    const a = startShotAim('p', null, { x: 700, y: 280 }, 1);
    steerShotAim(a, true, true, 1); // both held = no change
    expect(a.aimY).toBe(FIELD_CY);
  });
});

describe('aimed charged shot — local engine', () => {
  it('a straight charge shoots at the goal centre (also from the wing)', () => {
    for (const y of [280, 200, 360]) {
      const { crossY } = shot(y, {});
      expect(crossY, `from y=${y}`).not.toBeNull();
      expect(Math.abs(crossY! - FIELD_CY), `from y=${y}`).toBeLessThan(12);
    }
  });

  it('↑/↓ during the charge move the shot to the top / bottom of the goal', () => {
    const top = shot(280, { up: true }, 0.4, 0.3).crossY!;
    const bottom = shot(280, { down: true }, 0.4, 0.3).crossY!;
    expect(top).toBeGreaterThan(GOAL_T);
    expect(top).toBeLessThan(FIELD_CY - 35);
    expect(bottom).toBeLessThan(GOAL_B);
    expect(bottom).toBeGreaterThan(FIELD_CY + 35);
    // The aim stays where it was left after the key is released.
    expect(shot(280, { up: true }, 0.5, 0.3).crossY!).toBeCloseTo(top, -1);
  });

  it('short vs long charge keeps the existing force curve (0.9× … 1.5× KICK_FORCE, capped)', () => {
    const short = shot(280, {}, 0.05).speed;
    const long = shot(280, {}, 0.6).speed;
    expect(short).toBeGreaterThan(KICK_FORCE * 0.9);
    expect(short).toBeLessThan(KICK_FORCE * 1.15 + 200);
    expect(long).toBe(BALL_MAX_SPEED);
  });

  it('keeps the pressed direction at 85 % speed, ignores the arrows for movement, keeps the ball', () => {
    const ctx = setup(480, 280);
    run(ctx, { right: true }, 0.3);
    run(ctx, { right: true, kick: true }, DT);
    const me = () => ctx.state.players.find((p) => p.id === ctx.state.activePlayerId)!;
    const x0 = me().pos.x, y0 = me().pos.y;
    let maxDist = 0;
    run(ctx, { up: true, left: true, kick: true }, 0.4, (s) => {
      maxDist = Math.max(maxDist, Math.hypot(s.ball.pos.x - me().pos.x, s.ball.pos.y - me().pos.y));
    });
    expect(me().pos.y).toBeCloseTo(y0, 6);
    expect((me().pos.x - x0) / 0.4).toBeCloseTo(PLAYER_SPEED * SHOT_AIM.chargeSpeedFactor, -1);
    expect(maxDist).toBeLessThan(BALL_CONTROL_RADIUS);
    expect(ctx.state.shotAim?.aimY).toBeLessThan(FIELD_CY);
    // Arrows released mid-charge: still running on at reduced speed.
    const x1 = me().pos.x;
    run(ctx, { kick: true }, 0.1);
    expect((me().pos.x - x1) / 0.1).toBeCloseTo(PLAYER_SPEED * SHOT_AIM.chargeSpeedFactor, -1);
    // Release → shot fired, aim gone, normal controls on the next frame.
    run(ctx, {}, DT);
    expect(ctx.state.shotAim).toBeNull();
    const y1 = me().pos.y;
    run(ctx, { down: true }, 0.1);
    expect(me().pos.y).toBeGreaterThan(y1 + 10);
  });

  it('a player standing still at the press does not start running', () => {
    const ctx = setup(500, 280);
    run(ctx, {}, 0.2);
    const x0 = ctx.state.players.find((p) => p.id === ctx.state.activePlayerId)!.pos.x;
    run(ctx, { kick: true }, DT);
    run(ctx, { right: true, down: true, kick: true }, 0.4);
    expect(ctx.state.players.find((p) => p.id === ctx.state.activePlayerId)!.pos.x).toBeCloseTo(x0, 0);
  });

  it('an opponent can still take the ball during the charge; the aim then ends', () => {
    const ctx = setup(480, 280, { defender: { x: 640, y: 280 } });
    run(ctx, { right: true }, 0.1);
    run(ctx, { right: true, kick: true }, DT);
    expect(ctx.state.shotAim).not.toBeNull();
    // A tackling defender runs at the ball (its AI is off in this harness).
    run(ctx, { right: true, kick: true }, 1, (s) => {
      const d = s.players.find((p) => p.team === 'away' && p.matchStatus === 'field')!;
      const dx = s.ball.pos.x - d.pos.x, dy = s.ball.pos.y - d.pos.y, l = Math.hypot(dx, dy) || 1;
      d.pos = { x: d.pos.x + (dx / l) * PLAYER_SPEED * DT, y: d.pos.y + (dy / l) * PLAYER_SPEED * DT };
    });
    const me = ctx.state.players.find((p) => p.id === ctx.state.activePlayerId)!;
    expect(Math.hypot(ctx.state.ball.pos.x - me.pos.x, ctx.state.ball.pos.y - me.pos.y)).toBeGreaterThan(BALL_CONTROL_RADIUS);
    expect(ctx.state.shotAim).toBeNull();
  });

  it('a backward kick (pass / clearance) keeps the old direction rule', () => {
    const ctx = setup(500, 280);
    ctx.state.ball.pos = { x: 474, y: 280 };
    run(ctx, { left: true }, 0.2);
    run(ctx, { left: true, kick: true }, 0.3);
    expect(ctx.state.shotAim?.aimY ?? null).toBeNull();
    run(ctx, { left: true, up: true }, DT);
    const v = ctx.state.ball.vel;
    expect(v.x).toBeLessThan(0);
    expect(Math.abs(v.y / v.x)).toBeGreaterThan(0.7); // ↖ held at release
  });

  it('classic / v2 profiles never aim (frozen baselines)', () => {
    for (const profile of ['classic', 'v2'] as GameplayProfile[]) {
      const ctx = setup(600, 280, { profile });
      run(ctx, { right: true, kick: true }, 0.2);
      expect(ctx.state.shotAim, profile).toBeNull();
    }
  });

  it('a goal reset clears the aim', () => {
    const r = shot(280, {}, 0.3, 0.3, 700);
    expect(r.state.shotAim).toBeNull();
  });
});

describe('keyboard focus loss', () => {
  it('blur / hidden tab releases a held charge and direction', () => {
    const input = createInputState();
    const detach = attachInputListeners(input);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    expect(input.kick && input.right).toBe(true);
    window.dispatchEvent(new Event('blur'));
    expect(input.kick || input.right).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(input.kick).toBe(false);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    detach();
  });
});

