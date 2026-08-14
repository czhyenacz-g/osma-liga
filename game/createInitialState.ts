import type { GameState, Player } from './types';
import {
  FIELD_CX, FIELD_CY, FIELD_L, FIELD_R, FIELD_T, GOALKEEPER_DEFAULT_DEPTH, MATCH_DURATION,
  DEFAULT_BENCH_SIZE,
} from './constants';
import { DEFAULT_TEMPORARY_REMOVAL_CONFIG, TemporaryRemovalConfig, pickRandomTriggerSecond } from './temporaryRemoval';
import { DEFAULT_GAMEPLAY_PROFILE, GameplayProfile } from './gameplayProfiles';
import { DEFAULT_FIELD_PLAYER_STATS, DEFAULT_GOALKEEPER_STATS } from './playerStats';

function makePlayer(
  id: string,
  team: 'home' | 'away',
  x: number,
  y: number,
  label: string,
): Player {
  return {
    id,
    team,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    basePos: { x, y },
    label,
    kickCooldown: 0,
    role: 'field_player',
    // Own copy — never shared with other players' stats objects.
    stats: { ...DEFAULT_FIELD_PLAYER_STATS },
    matchStatus: 'field',
    benchUsed: false,
  };
}

function makeGoalkeeper(
  id: string,
  team: 'home' | 'away',
  y: number,
  label: string,
): Player {
  const x = team === 'home' ? FIELD_L + GOALKEEPER_DEFAULT_DEPTH : FIELD_R - GOALKEEPER_DEFAULT_DEPTH;
  return {
    id,
    team,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    basePos: { x, y },
    label,
    kickCooldown: 0,
    role: 'goalkeeper',
    stats: { ...DEFAULT_GOALKEEPER_STATS },
    matchStatus: 'field',
    benchUsed: false,
  };
}

// Bench holding spot, above the field like temporaryRemoval.ts's bench zone
// but on the opposite (non-overlapping) side, with extra bench slots offset
// vertically so DEFAULT_BENCH_SIZE > 1 doesn't stack players exactly on top
// of each other.
function makeBenchPlayer(
  id: string,
  team: 'home' | 'away',
  index: number,
  label: string,
): Player {
  const x = team === 'home' ? FIELD_CX - 100 : FIELD_CX + 100;
  const y = FIELD_T - 25 - index * 20;
  const player = makePlayer(id, team, x, y, label);
  player.matchStatus = 'bench';
  return player;
}

export function createInitialState(
  temporaryRemovalConfig: TemporaryRemovalConfig = DEFAULT_TEMPORARY_REMOVAL_CONFIG,
  matchDurationSeconds: number = MATCH_DURATION,
  gameplayProfile: GameplayProfile = DEFAULT_GAMEPLAY_PROFILE,
  benchSize: number = DEFAULT_BENCH_SIZE,
): GameState {
  const cx = FIELD_CX;
  const cy = FIELD_CY;

  const homeBench: Player[] = [];
  const awayBench: Player[] = [];
  for (let i = 0; i < benchSize; i++) {
    homeBench.push(makeBenchPlayer(`n-bench-${i}`, 'home', i, `B${i + 1}`));
    awayBench.push(makeBenchPlayer(`p-bench-${i}`, 'away', i, `B${i + 1}`));
  }

  return {
    players: [
      // Náhoda FC — left half
      makePlayer('n1', 'home', cx - 150, cy,       'N1'),
      makePlayer('n2', 'home', cx - 300, cy - 110, 'N2'),
      makePlayer('n3', 'home', cx - 300, cy + 110, 'N3'),
      // FK Pařezov — right half
      makePlayer('p1', 'away', cx + 150, cy,       'P1'),
      makePlayer('p2', 'away', cx + 300, cy - 110, 'P2'),
      makePlayer('p3', 'away', cx + 300, cy + 110, 'P3'),
      // Goalkeepers — one per team, not counted among the 3 field players.
      makeGoalkeeper('n-gk', 'home', cy, 'GK'),
      makeGoalkeeper('p-gk', 'away', cy, 'GK'),
      // Bench — see benchDeployment.ts. DEFAULT_BENCH_SIZE per team by default.
      ...homeBench,
      ...awayBench,
    ],
    ball: {
      pos: { x: cx, y: cy },
      vel: { x: 0, y: 0 },
    },
    score: { home: 0, away: 0 },
    timeLeft: matchDurationSeconds,
    phase: 'playing',
    goalMessage: '',
    goalTimer: 0,
    activePlayerId: 'n1',
    autoActivePlayerId: 'n1',
    autoSwitchCooldownRemaining: 0,
    autoSwitchInputLockRemaining: 0,
    manualActivePlayerId: null,
    manualLockRemaining: 0,
    switchKeyWasDown: false,
    kickWasDown: false,
    kickHeldSeconds: 0,
    lastTouchTeam: null,
    lastTouchPlayerId: null,
    isOwnGoal: false,
    isConceded: false,
    concededMessage: '',
    cornerTimer: 0,
    cornerKickCount: 0,
    cornerClearCooldown: 0,
    temporaryRemovals: [],
    benchDeployments: [],
    randomSubstitutionTriggerSecond: {
      home: pickRandomTriggerSecond(temporaryRemovalConfig),
      away: pickRandomTriggerSecond(temporaryRemovalConfig),
    },
    randomSubstitutionTriggered: { home: false, away: false },
    gameplayProfile,
    activeGameplayModifier: 'none',
    gameplayModifierRemainingSeconds: 0,
  };
}
