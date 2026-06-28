import type { GameplayProfile, GameplayModifier } from './gameplayProfiles';

export type Team = 'home' | 'away';
export type GamePhase = 'playing' | 'goal' | 'ended';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  team: Team;
  pos: Vec2;
  vel: Vec2;
  basePos: Vec2;
  label: string;
  kickCooldown: number;
}

export interface Ball {
  pos: Vec2;
  vel: Vec2;
}

// Generic temporary-removal state — MVP is "randomSubstitution" only, but the
// shape is reused later for stamina/cards/injuries (see temporaryRemoval.ts).
export type TemporaryRemovalReason = 'randomSubstitution' | 'stamina' | 'card' | 'injury' | 'event';
export type TemporaryRemovalPhase = 'leaving' | 'bench' | 'returning';

export interface TemporaryPlayerRemoval {
  playerId: string;
  team: Team;
  reason: TemporaryRemovalReason;
  phase: TemporaryRemovalPhase;
  // Counts down only during the 'bench' phase.
  remainingSeconds: number;
  benchDurationSeconds: number;
  // Recomputed (with occupancy avoidance) right when the bench phase ends.
  returnPosition: Vec2;
}

export interface GameState {
  players: Player[];
  ball: Ball;
  score: { home: number; away: number };
  timeLeft: number;
  phase: GamePhase;
  goalMessage: string;
  goalTimer: number;
  activePlayerId: string;
  // Automatic (distance + hysteresis) pick, tracked independently of manual
  // override so the automatic algorithm keeps running in the background
  // while a manual lock is active and resumes smoothly once it expires.
  autoActivePlayerId: string;
  // Cooldown (seconds) before the automatic pick is allowed to switch again —
  // see AUTO_PLAYER_SWITCH_COOLDOWN_MS.
  autoSwitchCooldownRemaining: number;
  // Manual active-player override (Q / PŘEP.) — see MANUAL_SWITCH_LOCK_DURATION.
  manualActivePlayerId: string | null;
  manualLockRemaining: number;
  switchKeyWasDown: boolean;
  // Charged kick (tap = weaker, hold = stronger up to KICK_MAX_CHARGE_MS) —
  // the shot fires on release, scaled by how long it was held.
  kickWasDown: boolean;
  kickHeldSeconds: number;
  // Last touch tracking — used for own goal detection
  lastTouchTeam: Team | null;
  lastTouchPlayerId: string | null;
  isOwnGoal: boolean;
  // Short extra line shown under the main goal message when the human
  // (home) team just conceded — empty when home scored.
  isConceded: boolean;
  concededMessage: string;
  // Corner zone timer
  cornerTimer: number;
  cornerKickCount: number;
  cornerClearCooldown: number;
  // Temporary player removal (see temporaryRemoval.ts) — MVP: random substitution.
  temporaryRemovals: TemporaryPlayerRemoval[];
  randomSubstitutionTriggerSecond: { home: number; away: number };
  randomSubstitutionTriggered: { home: boolean; away: boolean };
  // Gameplay profile selected at match start (see gameplayProfiles.ts) — only
  // ever non-'classic' in /hra/bot-dis today. A temporary modifier (e.g.
  // "Bounce Time!") can override the profile's ball knobs for a short window.
  gameplayProfile: GameplayProfile;
  activeGameplayModifier: GameplayModifier;
  gameplayModifierRemainingSeconds: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
  restart: boolean;
  switchPlayer: boolean;
}

export interface TouchInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
  switchPlayer: boolean;
}
