import { BALL_WALL_RESTITUTION } from './constants';

// Named gameplay profiles — a config layer on top of the single shared
// engine (updateGame.ts), not a second engine. `classic` reproduces today's
// behavior exactly; `v2`/`bounce` are alternate parameter sets for the same
// code paths. Currently only reachable via /hra/bot-dis (?profile=...) and
// the /hra/bot-test physics switch — /hra/bot, multiplayer and training
// challenge always resolve to `classic`.
//
// `v2-shot` / `v2-turn` are EXPERIMENTAL ball-control variants (see
// docs/gameplay-physics-contract.md) — test-only, never a production default:
//   v2-shot = classic + kickSelfTrapProtection
//   v2-turn = v2-shot + turnAssist
export type GameplayProfile = 'classic' | 'v2' | 'bounce' | 'v2-shot' | 'v2-turn';

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
}

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
  },
};

export const DEFAULT_GAMEPLAY_PROFILE: GameplayProfile = 'classic';

// Parses a `?profile=` query value; any unrecognized value falls back to
// the default profile rather than erroring.
export function resolveGameplayProfile(value: string | undefined | null): GameplayProfile {
  if (value === 'classic' || value === 'v2' || value === 'bounce' || value === 'v2-shot' || value === 'v2-turn') return value;
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
