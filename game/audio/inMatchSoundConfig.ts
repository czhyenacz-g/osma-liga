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
export type InMatchPoolKey = 'afterGoalCrowd' | 'nearGoalPressureCrowd';

export const KICK_SOUND_COOLDOWN_MS = 80;
export const PLAYER_SWITCH_SOUND_COOLDOWN_MS = 100;
export const BOUNCE_SOUND_COOLDOWN_MS = 100;
export const PONG_BOUNCE_SOUND_COOLDOWN_MS = 100;
export const NEAR_GOAL_OOH_COOLDOWN_MS = 4000;
export const AFTER_GOAL_CROWD_COOLDOWN_MS = 1500;
export const NEAR_GOAL_PRESSURE_CROWD_COOLDOWN_MS = 3500;
// The actual per-play cooldown is randomized in this range (see GameCanvas.tsx)
// so repeated near-goal pressure doesn't sound mechanically regular.
export const NEAR_GOAL_PRESSURE_COOLDOWN_MIN_MS = 3000;
export const NEAR_GOAL_PRESSURE_COOLDOWN_MAX_MS = 5500;

// Crowd pressure loop: how "close to a goal" the ball needs to be for the
// crowd to start reacting, and how loud that gets at maximum.
export const PRESSURE_DISTANCE = 320;
export const CROWD_PRESSURE_MAX_VOLUME = 0.28;

// Near-goal "ooh": only fires above this pressure, and only while the ball is
// actually moving (not just resting near the goal mouth).
export const NEAR_GOAL_OOH_PRESSURE_THRESHOLD = 0.75;
export const NEAR_GOAL_OOH_MIN_BALL_SPEED = 40;

// Near-goal pressure crowd reaction: only fires once the (smoothed) pressure
// crosses this threshold. Symmetric — triggers near EITHER goal (same
// nearest-goal distance the ambient crowdPressure loop already uses in
// GameCanvas.tsx), regardless of which team is attacking/defending.
export const NEAR_GOAL_PRESSURE_THRESHOLD = 0.45;
// Smoothed pressure ramps toward the raw target over ~2s in both directions,
// so the crowd never snaps instantly to loud/silent.
export const NEAR_GOAL_PRESSURE_FADE_IN_MS = 2000;
export const NEAR_GOAL_PRESSURE_FADE_OUT_MS = 2000;
export const NEAR_GOAL_PRESSURE_MIN_VOLUME = 0.15;
export const NEAR_GOAL_PRESSURE_MAX_VOLUME = 0.60;
// volume = clamp(MIN + smoothedPressure * RANGE, MIN, MAX)
export const NEAR_GOAL_PRESSURE_VOLUME_RANGE = 0.45;

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
  // File names say "enemy-near-goal" (original recording intent), but the
  // pool is played symmetrically for pressure near either goal — see
  // GameCanvas.tsx.
  nearGoalPressureCrowd: {
    files: [
      '/sounds/osmaliga/crowd/enemy-near-goal-01.mp3',
      '/sounds/osmaliga/crowd/enemy-near-goal-02.mp3',
      '/sounds/osmaliga/crowd/enemy-near-goal-03.mp3',
      // enemy-near-goal-04.mp3, ..., enemy-near-goal-10.mp3 — just add more paths here.
    ],
    volume: 0.35,
    cooldownMs: NEAR_GOAL_PRESSURE_CROWD_COOLDOWN_MS,
  },
};

// Připraveno pro budoucí powerupy/eventy — žádné assety ani logika zatím,
// jen aby klíče existovaly a šlo je snadno doplnit (viz TODO v inMatchAudio.ts).
export type FutureInMatchSoundKey =
  | 'powerupAppear'
  | 'powerupPickup'
  | 'modifierStart'
  | 'modifierEnd';
