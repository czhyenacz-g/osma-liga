import { PLAYER_RADIUS, PLAYER_SPEED, GOALKEEPER_SPEED } from './constants';

// Parametric per-player capability profile. `role` (see types.ts) still
// decides UNIQUE role behavior (goalkeeper zone/AI, exclusion from the
// field-player active/bot-chase pools) — but a player's physical
// capabilities live here instead of scattered role-conditional constants,
// so two players sharing a role can differ (a fast goalkeeper vs a slow
// one, a strong defender vs a weak one) once real per-player data exists.
export interface PlayerStats {
  // Movement speed in px/s — read directly wherever a specific player's own
  // movement is computed (the active player in updateGame.ts, goalkeepers in
  // goalkeeperAI.ts). NOT used by the single-player away-bot's own chase/
  // return algorithm (see ai.ts BOT_SPEED/SUPPORT_PLAYER_SPEED) — those are
  // shared AI-difficulty/formation tuning constants applied uniformly to
  // whichever player the algorithm is currently moving, not a capability of
  // one specific player, and are intentionally left untouched by this
  // refactor to avoid changing bot difficulty/feel.
  speed: number;
  // Multiplier applied on top of whichever kick force constant is already
  // in play at a given kick site (KICK_FORCE for a normal shot,
  // BOT_KICK_FORCE for the away bot, SUPPORT_KICK_FORCE for a passive
  // support kick) — those constants differ by KICK TYPE/mechanic, not
  // player identity, and stay as-is. 1 = today's baseline (no change).
  shotPower: number;
  // How strongly this player damps/absorbs the ball's velocity on contact
  // instead of just bumping it away — see resolvePlayerBallCollisions() in
  // physics.ts. 0 = today's field-player baseline (no damping, standard
  // bump). 1 = today's goalkeeper baseline (heavy damping, reduced bump).
  // The physics formula interpolates/extrapolates linearly from these two
  // calibration points for any future in-between (or beyond) value.
  stoppingPower: number;
  // Visual size in px, relative to the real PLAYER_RADIUS collision hitbox
  // (which stays a single global physical constant — see constants.ts and
  // PlayerVisualContainer.tsx). Drives the renderer's visual scale only;
  // never the actual collision radius, so gameplay geometry is untouched.
  size: number;
}

// No `turnSpeed`: the engine has no turning/acceleration model today
// (movement is an instantly-applied velocity in the input direction), so
// there is nothing for a turn-speed stat to drive yet — adding one now
// would be a dead field. Add it here if/when a turn/acceleration mechanic
// is introduced.

// No `stamina`/`maxStamina` here yet (deliberately, per task scope): those
// represent *current, depletable* state rather than a fixed capability like
// the fields above, so they belong alongside (not inside) PlayerStats —
// most likely as their own fields on Player once a stamina system exists,
// read/written every tick the same way `speed` is read now. Not modeled or
// implemented in this iteration.

// No `position` (defender/midfielder/attacker) here yet: with no
// position-specific behavior implemented, it would be a dead field on
// Player. Add it once real position-dependent gameplay exists to read it.

export const DEFAULT_FIELD_PLAYER_STATS: PlayerStats = {
  speed: PLAYER_SPEED,
  shotPower: 1,
  stoppingPower: 0,
  size: PLAYER_RADIUS,
};

export const DEFAULT_GOALKEEPER_STATS: PlayerStats = {
  speed: GOALKEEPER_SPEED,
  shotPower: 1,
  stoppingPower: 1,
  // Reproduces the pre-refactor goalkeeper visual bump (PLAYER_RADIUS * 1.15).
  size: PLAYER_RADIUS * 1.15,
};
