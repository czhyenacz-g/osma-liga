import type { GameplayProfile, GameplayModifier } from './gameplayProfiles';
import type { ShotAimState } from './shotAim';
import type { GoalkeeperHold } from './goalkeeperSave';
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
// Role a bench substitute ("žolík") is called up with — decides where it
// positions itself while it is not the controlled player (benchDeployment.ts
// computeBenchRoleTarget). Mirrors project-hub-api's gameEngine BenchRole.
export type BenchRole = 'attacker' | 'defender';

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
  // Set when deployed from the bench (deployBenchPlayer); unset otherwise.
  benchRole?: BenchRole;
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
  // Last player the ball touched, actively or passively (bookkeeping only).
  lastTouchTeam: Team | null;
  lastTouchPlayerId: string | null;
  // Last ACTIVE play — kick or pass, human or bot. Decides own goals, see
  // goalAttribution.ts; passive contacts never change it.
  lastKickTeam: Team | null;
  lastKickPlayerId: string | null;
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
  // EXPERIMENTAL V2 ball physics bookkeeping (gameplayProfiles.ts) — only
  // read when the matching profile flag is on; classic never looks at it.
  // Who fired the last real shot and how long its self-trap protection
  // still runs (s).
  kickSelfTrapPlayerId: string | null;
  kickSelfTrapRemaining: number;
  // Last non-zero held direction (unit vector) and the remaining turn
  // assist (s) for the active player.
  lastMoveDir: Vec2 | null;
  turnAssistRemaining: number;
  // EXPERIMENTAL V3 prepared turn (dribblePrep.ts) — only read when
  // dribblePrepEnabled.
  dribblePrep: DribblePrepState;
  // Aimed charged shot (shotAim.ts) — only set while shotAimEnabled and the
  // active player charges with the ball at its feet.
  shotAim: ShotAimState | null;
  // Ball caught by a goalkeeper (goalkeeperSave.ts) — pinned in front of
  // him until `remaining` runs out, then he passes or clears it.
  goalkeeperHold: GoalkeeperHold | null;
  // Next save's sequence number (goalkeeperSave.ts); null until the first save.
  goalkeeperSaveSeq: number | null;
}

export interface DribblePrepState {
  // Active player this bookkeeping belongs to — a player switch resets it.
  playerId: string | null;
  // How long the active player has had the ball under control (s).
  controlSeconds: number;
  phase: 'none' | 'prep' | 'recover';
  // Remaining time of the current phase (s).
  remaining: number;
  recoverTotal: number;
  // Arc side chosen at prep start (+1/-1) — fixed so the ball can't flip
  // back and forth around the player.
  side: number;
  // Direction the current prep is aiming for (re-aimed on a new turn).
  prepDir: Vec2 | null;
  // Prep time spent in the current chain of turns, and how long no prep
  // has run (a long enough gap resets the chain) — bounds the assist.
  chainSeconds: number;
  idleSeconds: number;
  // Current prep is a sharp turn (≥ BALL_PHYSICS_V3.shieldTurnMinAngleDeg)
  // — a drag-back that may run under the shield rules (opponent off the
  // ball and behind) instead of the plain no-opponent rule.
  shield: boolean;
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
  // Finger dragged up/down on the held kick button — merged into up/down
  // (aims an aimed charged shot, see game/shotAim.ts).
  aimUp: boolean;
  aimDown: boolean;
}
