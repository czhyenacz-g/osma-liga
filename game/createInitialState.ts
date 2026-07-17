import type { GameState, Player } from './types';
import { FIELD_CX, FIELD_CY, MATCH_DURATION } from './constants';
import { DEFAULT_TEMPORARY_REMOVAL_CONFIG, TemporaryRemovalConfig, pickRandomTriggerSecond } from './temporaryRemoval';
import { DEFAULT_GAMEPLAY_PROFILE, GameplayProfile } from './gameplayProfiles';

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
  };
}

export function createInitialState(
  temporaryRemovalConfig: TemporaryRemovalConfig = DEFAULT_TEMPORARY_REMOVAL_CONFIG,
  matchDurationSeconds: number = MATCH_DURATION,
  gameplayProfile: GameplayProfile = DEFAULT_GAMEPLAY_PROFILE,
): GameState {
  const cx = FIELD_CX;
  const cy = FIELD_CY;

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
