import type { GameplayProfile, GameplayModifier } from './gameplayProfiles';
import type { PlayerStats } from './playerStats';
import type { BenchDeployment } from './benchDeployment';

export type Team = 'home' | 'away';
export type GamePhase = 'playing' | 'goal' | 'ended';

// General player role — kept intentionally minimal (KISS) but reserved as
// the extension point for future roles/stats (varying goalkeeper stats,
// substitutes, bench, temporary reinforcements) instead of scattering
// role-specific booleans/ifs across the engine.
export type PlayerRole = 'field_player' | 'goalkeeper';

// Bench + temporary substitute (see benchDeployment.ts). 'field' — normal,
// always-on-pitch player (every goalkeeper, and the 3 original field players
// per team). 'bench' — parked, not rendered/collided, eligible for a single
// deploy (unless benchUsed). 'temporarily_deployed' — currently on the pitch
// for a limited window (BENCH_DEPLOY_DURATION_MS), behaves exactly like a
// normal field player everywhere except it reverts to 'bench' on expiry.
export type PlayerMatchStatus = 'field' | 'bench' | 'temporarily_deployed';

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
  // Defaults to 'field_player' semantics wherever unset is impossible (all
  // player-creation goes through createInitialState.ts, which always sets
  // this explicitly). See goalkeeperAI.ts for role-driven behavior (zone,
  // AI, active-player pool exclusion) — physical capabilities live in
  // `stats` instead (see playerStats.ts).
  role: PlayerRole;
  // Parametric capability profile (speed/shotPower/stoppingPower/size) —
  // see playerStats.ts. Each player owns its own copy (createInitialState.ts
  // clones from DEFAULT_FIELD_PLAYER_STATS/DEFAULT_GOALKEEPER_STATS), so
  // future per-player variation never mutates a shared default object.
  stats: PlayerStats;
  // Bench/temporary-substitute status — see benchDeployment.ts. Goalkeepers
  // and the 3 original field players always stay 'field'/benchUsed=false.
  matchStatus: PlayerMatchStatus;
  // Once true, this bench player can never be deployed again this match —
  // the 30s window is a single-use boost, not a repeatable swap.
  benchUsed: boolean;
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
  // Counts down from AUTO_SWITCH_INPUT_LOCK_MS/1000 (seconds) whenever the
  // player holds movement input, refreshed every tick input is held. While
  // > 0, the automatic distance-based pick may not switch — see
  // AUTO_SWITCH_INPUT_LOCK_MS.
  autoSwitchInputLockRemaining: number;
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
  // Bench + 30s temporary substitute (see benchDeployment.ts) — separate
  // mechanic from temporaryRemovals above: this tracks players the human/bot
  // deliberately brought ON from the bench, not players being taken off.
  benchDeployments: BenchDeployment[];
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
