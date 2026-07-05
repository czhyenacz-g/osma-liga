// Konfigurace zvuků pro dynamickou audio vrstvu zápasu (game/audio/inMatchAudio.ts).
// Cesty ukazují do /public/sounds/osmaliga/ — soubory nemusí existovat, viz
// public/sounds/osmaliga/kenney/SOURCE.md a pravidlo "chybějící asset nesmí spadnout"
// v inMatchAudio.ts.

export type InMatchSoundKey =
  | 'kickSoft'
  | 'kickHard'
  | 'playerSwitch'
  | 'ballBounce'
  | 'pongBounce'
  | 'nearGoalOoh'
  | 'buttonClick';

export type InMatchLoopKey = 'ambientBase' | 'crowdPressure';

// Sound pools — a "logical event" maps to a list of file variants, one of
// which is picked at random each time (see inMatchAudio.ts playRandomFromPool).
// Adding e.g. after-goal-02.mp3 later only means pushing a path into the
// array below — no changes needed to the audio helper or call sites.
// nearGoalStings is intentionally empty for now — prepared for future short
// (2-4s) one-shot reactions layered on top of the nearGoalPressureBed below;
// an empty pool is a safe no-op in playRandomFromPool.
export type InMatchPoolKey = 'afterGoalCrowd' | 'nearGoalStings';

// Bed keys — a "logical event" maps to a list of long file variants, one of
// which is picked at random and played as a controlled, volume-faded loop
// (see inMatchAudio.ts startRandomBedFromPool/setBedVolume/stopBed). Unlike
// InMatchPoolKey, only ONE instance of a bed ever plays at a time.
export type InMatchBedKey = 'nearGoalPressureBed';

export const KICK_SOUND_COOLDOWN_MS = 80;
export const PLAYER_SWITCH_SOUND_COOLDOWN_MS = 100;
export const BOUNCE_SOUND_COOLDOWN_MS = 100;
export const PONG_BOUNCE_SOUND_COOLDOWN_MS = 100;
export const NEAR_GOAL_OOH_COOLDOWN_MS = 4000;
export const AFTER_GOAL_CROWD_COOLDOWN_MS = 1500;
// Placeholder cooldown for the (currently empty) nearGoalStings pool.
export const NEAR_GOAL_STINGS_COOLDOWN_MS = 3500;

// Crowd pressure loop: how "close to a goal" the ball needs to be for the
// crowd to start reacting, and how loud that gets at maximum.
export const PRESSURE_DISTANCE = 320;
export const CROWD_PRESSURE_MAX_VOLUME = 0.28;

// Near-goal "ooh": only fires above this pressure, and only while the ball is
// actually moving (not just resting near the goal mouth).
export const NEAR_GOAL_OOH_PRESSURE_THRESHOLD = 0.75;
export const NEAR_GOAL_OOH_MIN_BALL_SPEED = 40;

// Near-goal pressure bed: a long crowd-reaction file played as a controlled,
// volume-faded loop (not a repeated one-shot) while pressure near either
// goal stays elevated. Symmetric — triggers near EITHER goal (same
// nearest-goal distance the ambient crowdPressure loop already uses in
// GameCanvas.tsx), regardless of which team is attacking/defending.
// Only starts once smoothed pressure crosses this threshold...
export const NEAR_GOAL_PRESSURE_THRESHOLD = 0.45;
// ...and is told to stop (with its own fade-out) once smoothed pressure
// drops back below this much lower threshold — everything in between is
// just the bed's volume continuously tracking smoothedPressure.
export const NEAR_GOAL_PRESSURE_BED_STOP_THRESHOLD = 0.05;
// Smoothed pressure ramps toward the raw target over ~2s in both directions,
// so the bed never snaps instantly to loud/silent.
export const NEAR_GOAL_PRESSURE_FADE_IN_MS = 2000;
export const NEAR_GOAL_PRESSURE_FADE_OUT_MS = 2000;
// volume = clamp(BASE + smoothedPressure * RANGE, 0, MAX)
export const NEAR_GOAL_PRESSURE_BED_VOLUME_BASE = 0.05;
export const NEAR_GOAL_PRESSURE_BED_VOLUME_MAX = 0.50;
export const NEAR_GOAL_PRESSURE_BED_VOLUME_RANGE = 0.45;

interface OneShotConfig {
  src: string;
  volume: number;
  cooldownMs: number;
}

interface LoopConfig {
  src: string;
  /** Výchozí hlasitost při startu smyčky; crowdPressure se dál řídí za běhu setLoopVolume(). */
  volume: number;
}

export const IN_MATCH_SOUNDS: Record<InMatchSoundKey, OneShotConfig> = {
  kickSoft: { src: '/sounds/osmaliga/kenney/ball-kick-soft.wav', volume: 0.5, cooldownMs: KICK_SOUND_COOLDOWN_MS },
  kickHard: { src: '/sounds/osmaliga/kenney/ball-kick-hard.wav', volume: 0.6, cooldownMs: KICK_SOUND_COOLDOWN_MS },
  playerSwitch: { src: '/sounds/osmaliga/kenney/player-switch.wav', volume: 0.22, cooldownMs: PLAYER_SWITCH_SOUND_COOLDOWN_MS },
  ballBounce: { src: '/sounds/osmaliga/kenney/ball-bounce.wav', volume: 0.35, cooldownMs: BOUNCE_SOUND_COOLDOWN_MS },
  pongBounce: { src: '/sounds/osmaliga/kenney/pong-bounce.wav', volume: 0.4, cooldownMs: PONG_BOUNCE_SOUND_COOLDOWN_MS },
  nearGoalOoh: { src: '/sounds/osmaliga/crowd/crowd-near-goal-ooh-01.mp3', volume: 0.28, cooldownMs: NEAR_GOAL_OOH_COOLDOWN_MS },
  buttonClick: { src: '/sounds/osmaliga/kenney/button-click.wav', volume: 0.3, cooldownMs: KICK_SOUND_COOLDOWN_MS },
};

export const IN_MATCH_LOOPS: Record<InMatchLoopKey, LoopConfig> = {
  ambientBase: { src: '/sounds/osmaliga/ambient/ambient-base-loop.mp3', volume: 0.14 },
  crowdPressure: { src: '/sounds/osmaliga/crowd/crowd-pressure-loop.mp3', volume: 0 },
};

interface PoolConfig {
  /** File variants — add more paths here to grow the pool, no code changes needed. */
  files: string[];
  /** Default volume when the caller doesn't pass an explicit one. */
  volume: number;
  /** Default per-pool cooldown when the caller doesn't pass an explicit one. */
  cooldownMs: number;
}

export const IN_MATCH_POOLS: Record<InMatchPoolKey, PoolConfig> = {
  afterGoalCrowd: {
    files: [
      '/sounds/osmaliga/crowd/after-goal-01.mp3',
      // after-goal-02.mp3, after-goal-03.mp3, ... — just add more paths here.
    ],
    volume: 0.45,
    cooldownMs: AFTER_GOAL_CROWD_COOLDOWN_MS,
  },
  // Empty for now — future short (2-4s) near-goal reactions layered on top
  // of nearGoalPressureBed. Add file paths here when they exist; an empty
  // pool is already a safe no-op in playRandomFromPool.
  nearGoalStings: {
    files: [],
    volume: 0.35,
    cooldownMs: NEAR_GOAL_STINGS_COOLDOWN_MS,
  },
};

interface BedConfig {
  /** File variants — add more paths here to grow the pool, no code changes needed. */
  files: string[];
  /** Default volume when the caller doesn't pass an explicit one. */
  volume: number;
}

export const IN_MATCH_BEDS: Record<InMatchBedKey, BedConfig> = {
  // File names say "enemy-near-goal" (original recording intent — long crowd
  // cheer/reaction clips, ~20-39s), but the bed is played symmetrically for
  // pressure near either goal — see GameCanvas.tsx.
  nearGoalPressureBed: {
    files: [
      '/sounds/osmaliga/crowd/enemy-near-goal-01.mp3',
      '/sounds/osmaliga/crowd/enemy-near-goal-02.mp3',
      '/sounds/osmaliga/crowd/enemy-near-goal-03.mp3',
      // enemy-near-goal-04.mp3, ..., enemy-near-goal-10.mp3 — just add more paths here.
    ],
    volume: NEAR_GOAL_PRESSURE_BED_VOLUME_BASE,
  },
};

// Připraveno pro budoucí powerupy/eventy — žádné assety ani logika zatím,
// jen aby klíče existovaly a šlo je snadno doplnit (viz TODO v inMatchAudio.ts).
export type FutureInMatchSoundKey =
  | 'powerupAppear'
  | 'powerupPickup'
  | 'modifierStart'
  | 'modifierEnd';
