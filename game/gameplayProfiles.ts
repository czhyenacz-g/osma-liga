import { BALL_WALL_RESTITUTION } from './constants';

// Named gameplay profiles — a config layer on top of the single shared
// engine (updateGame.ts), not a second engine. `classic` reproduces today's
// behavior exactly; `v2`/`bounce` are alternate parameter sets for the same
// code paths. Currently only reachable via /hra/bot-dis (?profile=...) —
// /hra/bot, multiplayer and training challenge always resolve to `classic`.
export type GameplayProfile = 'classic' | 'v2' | 'bounce';

export interface GameplayProfileConfig {
  profile: GameplayProfile;
  wallRestitution: number;
  ballControlEnabled: boolean;
  ballRetentionEnabled: boolean;
  teammateReceiveEnabled: boolean;
}

export const GAMEPLAY_PROFILES: Record<GameplayProfile, GameplayProfileConfig> = {
  classic: {
    profile: 'classic',
    wallRestitution: BALL_WALL_RESTITUTION,
    ballControlEnabled: true,
    ballRetentionEnabled: true,
    teammateReceiveEnabled: true,
  },
  // Placeholder for a future simpler/fairer engine tune — intentionally
  // identical to classic for now. Exists so /hra/bot-dis?profile=v2 already
  // exercises the profile-selection plumbing before any real values change.
  v2: {
    profile: 'v2',
    wallRestitution: BALL_WALL_RESTITUTION,
    ballControlEnabled: true,
    ballRetentionEnabled: true,
    teammateReceiveEnabled: true,
  },
  // Pongier/pinball-ier: near-elastic wall bounces, no soft ball-control trap,
  // no stop/turn retention, no teammate ball-receive — the ball just bounces.
  bounce: {
    profile: 'bounce',
    wallRestitution: 1.05,
    ballControlEnabled: false,
    ballRetentionEnabled: false,
    teammateReceiveEnabled: false,
  },
};

export const DEFAULT_GAMEPLAY_PROFILE: GameplayProfile = 'classic';

// Parses a `?profile=` query value; any unrecognized value falls back to
// the default profile rather than erroring.
export function resolveGameplayProfile(value: string | undefined | null): GameplayProfile {
  if (value === 'classic' || value === 'v2' || value === 'bounce') return value;
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
