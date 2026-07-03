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

export const KICK_SOUND_COOLDOWN_MS = 80;
export const PLAYER_SWITCH_SOUND_COOLDOWN_MS = 100;
export const BOUNCE_SOUND_COOLDOWN_MS = 100;
export const PONG_BOUNCE_SOUND_COOLDOWN_MS = 100;
export const NEAR_GOAL_OOH_COOLDOWN_MS = 4000;

// Crowd pressure loop: how "close to a goal" the ball needs to be for the
// crowd to start reacting, and how loud that gets at maximum.
export const PRESSURE_DISTANCE = 320;
export const CROWD_PRESSURE_MAX_VOLUME = 0.28;

// Near-goal "ooh": only fires above this pressure, and only while the ball is
// actually moving (not just resting near the goal mouth).
export const NEAR_GOAL_OOH_PRESSURE_THRESHOLD = 0.75;
export const NEAR_GOAL_OOH_MIN_BALL_SPEED = 40;

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

// Připraveno pro budoucí powerupy/eventy — žádné assety ani logika zatím,
// jen aby klíče existovaly a šlo je snadno doplnit (viz TODO v inMatchAudio.ts).
export type FutureInMatchSoundKey =
  | 'powerupAppear'
  | 'powerupPickup'
  | 'modifierStart'
  | 'modifierEnd';
