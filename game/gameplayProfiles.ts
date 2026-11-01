import { BALL_WALL_RESTITUTION } from './constants';

// Named gameplay profiles — a config layer on top of the single shared
// engine (updateGame.ts), not a second engine. `classic` reproduces today's
// behavior exactly; `v2`/`bounce` are alternate parameter sets for the same
// code paths. /hra/bot plays LIVE_GAMEPLAY_PROFILE; /hra/bot-dis
// (?profile=...) and the /hra/bot-test physics switch can pick any.
// Multiplayer and the training challenge run on the server engine, whose
// human teams mirror v3-dribble (project-hub-api TeamBehaviorConfig
// .preparedTurns).
//
// Ball-control variants (see docs/gameplay-physics-contract.md):
//   v2-shot    = classic + kickSelfTrapProtection
//   v2-turn    = v2-shot + turnAssist
//   v3-dribble = v2-shot + dribblePrep (NOT turnAssist — no double slow-down)
export type GameplayProfile = 'classic' | 'v2' | 'bounce' | 'v2-shot' | 'v2-turn' | 'v3-dribble';

export interface GameplayProfileConfig {
  profile: GameplayProfile;
  wallRestitution: number;
  // Elastic restitution for player-ball collisions. 0 = current behaviour
  // (fixed BUMP_FORCE impulse only). >0 also reflects the ball's incoming
  // velocity component along the collision normal, scaled by this factor.
  playerBallRestitution: number;
  kickEnabled: boolean;
  ballControlEnabled: boolean;
  ballRetentionEnabled: boolean;
  teammateReceiveEnabled: boolean;
  // EXPERIMENTAL — after the active player actually fires a shot, its own
  // ball control (soft trap + retention) stays off for
  // BALL_PHYSICS_V2.kickSelfTrapProtectionSeconds so it can't brake its own
  // shot (today that braking scales with the display's refresh rate).
  kickSelfTrapProtectionEnabled: boolean;
  // EXPERIMENTAL — on a sharp direction change while controlling the ball
  // with no opponent close, the active player is briefly slowed so the
  // existing ball control can bring the ball round to the new side.
  turnAssistEnabled: boolean;
  // EXPERIMENTAL V3 — "prepared turn" (game/dribblePrep.ts): on a sharp
  // turn while really dribbling with no opponent near, the player briefly
  // slows and a time-normalized spring-damper carries the ball round the
  // player along an arc into the new direction; then speed recovers.
  dribblePrepEnabled: boolean;
}

// Tunables for the experimental V3 dribblePrep flag — one place, not final.
export const BALL_PHYSICS_V3 = {
  // Controlled dribble: ball this close, moving with the player (relative
  // speed below), for at least this long — a loose ball rolling past never
  // qualifies.
  dribbleControlRadius: 57,
  dribbleMaxRelativeSpeed: 160,
  dribbleMinControlSeconds: 0.12,
  // Opponent this close to the ball → no prep / prep aborted (duels stay real).
  // 40 = just past body contact (PLAYER_RADIUS + BALL_RADIUS = 28) and the
  // bot's kick reach — more room to dribble round a nearby opponent.
  noOpponentRadius: 40,
  // Ball retention (velocity blend toward the carrier) under V3 stays on
  // until an opponent is this close to the ball (classic/v2:
  // BALL_RETENTION_NO_OPPONENT_RADIUS = 70).
  retentionNoOpponentRadius: 40,
  // The player carrying the ball (close, moving with it — same test as the
  // dribble above) runs at this fraction of stats.speed, so defenders and
  // passes get a chance. Not applied right after the player's own shot.
  carrierSpeedFactor: 0.9,
  // Drag-back exception: turning at least this far AWAY from every opponent
  // inside noOpponentRadius (each one on the side the player is leaving,
  // none touching the ball — centre farther than shieldContactRadius from
  // it) is still assisted; the ball goes round the side away from them.
  // Turning into an opponent or a ball already being challenged stays a
  // real duel.
  shieldTurnMinAngleDeg: 120,
  shieldContactRadius: 36,
  // Prep starts when the ball sits at least this far off the new direction.
  turnMinAngleDeg: 60,
  // Prep window: base, growing linearly to the 180° value (s).
  prepSeconds: 0.35,
  prepSeconds180: 0.55,
  // Player speed while preparing (px/s) and the time to ramp back to full.
  prepPlayerSpeed: 90,
  recoverSeconds: 0.15,
  // A chain of turns (incl. re-aiming mid-prep) may use at most this much
  // prep time; then at least chainResetSeconds without any prep — rapid
  // zig-zags can't keep the assist running forever.
  maxChainSeconds: 1.2,
  chainResetSeconds: 0.3,
  // Re-aim a running prep when the held direction moves this far.
  reaimMinAngleDeg: 45,
  // Where the ball should end up: distance in front of the player (px).
  targetDistance: 34,
  // Ball carried round the player: desired velocity RELATIVE to the player
  // = tangential (along the arc, slowing as the remaining angle shrinks)
  // + radial (holds targetDistance, keeps it off the player's body); the
  // ball's relative velocity approaches it at velocityBlendRate (1/s,
  // exp-based) with at most maxAccel — all scaled by dt.
  arcSpeed: 280,
  angularGain: 8,
  radialGain: 10,
  maxRadialSpeed: 150,
  velocityBlendRate: 30,
  maxAccel: 3000,
  // Prep ends early once the ball is this well in front and settled.
  settledAngleDeg: 25,
  settledRelativeSpeed: 90,
} as const;

// Tunables for the experimental V2 flags above — one place, not final.
export const BALL_PHYSICS_V2 = {
  // Time window (s) after a real shot during which the shooter's own ball
  // control is not applied. Time-based (dt), independent of frame count.
  kickSelfTrapProtectionSeconds: 0.25,
  // A turn counts when the held direction changes by at least this much
  // versus the last held direction.
  turnAssistMinAngleDeg: 60,
  // Longest the slow-down may last per turn (s).
  turnAssistMaxSeconds: 0.3,
  // Player speed (px/s) while the assist runs (normal: stats.speed, 210).
  turnAssistPlayerSpeed: 130,
  // Ends early once the ball sits within this angle in front of the new
  // direction.
  turnAssistBallInFrontDeg: 45,
  // No assist with an opponent this close to the ball — same threshold as
  // ball retention (BALL_RETENTION_NO_OPPONENT_RADIUS), duels stay real.
  turnAssistNoOpponentRadius: 70,
} as const;

export const GAMEPLAY_PROFILES: Record<GameplayProfile, GameplayProfileConfig> = {
  classic: {
    profile: 'classic',
    wallRestitution: BALL_WALL_RESTITUTION,
    playerBallRestitution: 0,
    kickEnabled: true,
    ballControlEnabled: true,
    ballRetentionEnabled: true,
    teammateReceiveEnabled: true,
    kickSelfTrapProtectionEnabled: false,
    turnAssistEnabled: false,
    dribblePrepEnabled: false,
  },
  // Placeholder for a future simpler/fairer engine tune — intentionally
  // identical to classic for now. Exists so /hra/bot-dis?profile=v2 already
  // exercises the profile-selection plumbing before any real values change.
  v2: {
    profile: 'v2',
    wallRestitution: BALL_WALL_RESTITUTION,
    playerBallRestitution: 0,
    kickEnabled: true,
    ballControlEnabled: true,
    ballRetentionEnabled: true,
    teammateReceiveEnabled: true,
    kickSelfTrapProtectionEnabled: false,
    turnAssistEnabled: false,
    dribblePrepEnabled: false,
  },
  // Pongier/pinball-ier: near-elastic wall bounces, no kick, no soft
  // ball-control trap, no retention, no teammate receive — ball just bounces.
  bounce: {
    profile: 'bounce',
    wallRestitution: 1.60,
    playerBallRestitution: 1.60,
    kickEnabled: false,
    ballControlEnabled: false,
    ballRetentionEnabled: false,
    teammateReceiveEnabled: false,
    kickSelfTrapProtectionEnabled: false,
    turnAssistEnabled: false,
    dribblePrepEnabled: false,
  },
  'v2-shot': {
    profile: 'v2-shot',
    wallRestitution: BALL_WALL_RESTITUTION,
    playerBallRestitution: 0,
    kickEnabled: true,
    ballControlEnabled: true,
    ballRetentionEnabled: true,
    teammateReceiveEnabled: true,
    kickSelfTrapProtectionEnabled: true,
    turnAssistEnabled: false,
    dribblePrepEnabled: false,
  },
  'v2-turn': {
    profile: 'v2-turn',
    wallRestitution: BALL_WALL_RESTITUTION,
    playerBallRestitution: 0,
    kickEnabled: true,
    ballControlEnabled: true,
    ballRetentionEnabled: true,
    teammateReceiveEnabled: true,
    kickSelfTrapProtectionEnabled: true,
    turnAssistEnabled: true,
    dribblePrepEnabled: false,
  },
  'v3-dribble': {
    profile: 'v3-dribble',
    wallRestitution: BALL_WALL_RESTITUTION,
    playerBallRestitution: 0,
    kickEnabled: true,
    ballControlEnabled: true,
    ballRetentionEnabled: true,
    teammateReceiveEnabled: true,
    kickSelfTrapProtectionEnabled: true,
    turnAssistEnabled: false,
    dribblePrepEnabled: true,
  },
};

export const DEFAULT_GAMEPLAY_PROFILE: GameplayProfile = 'classic';

// What the live game plays: /hra/bot passes it to the match, and the
// physics contract compares it against the server engine.
export const LIVE_GAMEPLAY_PROFILE: GameplayProfile = 'v3-dribble';

// Parses a `?profile=` query value; any unrecognized value falls back to
// the default profile rather than erroring.
export function resolveGameplayProfile(value: string | undefined | null): GameplayProfile {
  if (value === 'classic' || value === 'v2' || value === 'bounce' || value === 'v2-shot' || value === 'v2-turn' || value === 'v3-dribble') return value;
  return DEFAULT_GAMEPLAY_PROFILE;
}

// ── Temporary modifier: "Bounce Time!" ──────────────────────────────────────
// A short in-match event that temporarily overrides the active profile's
// ball knobs with a more pinball-like set, then restores the profile when
// it expires. Independent of which profile is active.
export type GameplayModifier = 'none' | 'bounceTime';

export const BOUNCE_TIME_DURATION_SECONDS = 12;
export const BOUNCE_TIME_WALL_RESTITUTION = 1.08;
export const BOUNCE_TIME_BALL_CONTROL_ENABLED = false;
export const BOUNCE_TIME_BALL_RETENTION_ENABLED = false;
export const BOUNCE_TIME_TEAMMATE_RECEIVE_ENABLED = false;

// Resolves the config updateGame() should actually use this tick: the active
// profile, or — while Bounce Time is running — the profile with its ball
// knobs overridden by the Bounce Time constants above.
export function resolveEffectiveGameplayConfig(
  profile: GameplayProfile,
  activeModifier: GameplayModifier,
): GameplayProfileConfig {
  const base = GAMEPLAY_PROFILES[profile];
  if (activeModifier !== 'bounceTime') return base;
  return {
    ...base,
    wallRestitution: BOUNCE_TIME_WALL_RESTITUTION,
    ballControlEnabled: BOUNCE_TIME_BALL_CONTROL_ENABLED,
    ballRetentionEnabled: BOUNCE_TIME_BALL_RETENTION_ENABLED,
    teammateReceiveEnabled: BOUNCE_TIME_TEAMMATE_RECEIVE_ENABLED,
  };
}
