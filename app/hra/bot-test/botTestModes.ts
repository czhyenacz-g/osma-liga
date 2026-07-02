import type { GameplayProfile } from '@/game/gameplayProfiles';

export type BotTestMode = 'test-1' | 'bot' | 'bot-team' | 'test-bounce';

export const VALID_MODES: BotTestMode[] = ['test-1', 'bot', 'bot-team', 'test-bounce'];

export interface ModeConfig {
  description: string;
  disableOpponentAI: boolean;
  matchDurationSeconds: number;
  gameplayProfile: GameplayProfile;
  enableBounceTimeDebug: boolean;
}

export const MODE_CONFIG: Record<BotTestMode, ModeConfig> = {
  'test-1': {
    description: 'Trénink bez soupeře · classic pravidla',
    disableOpponentAI: true,
    matchDurationSeconds: 600,
    gameplayProfile: 'classic',
    enableBounceTimeDebug: true,
  },
  'bot': {
    description: 'Klasický bot · standard délka',
    disableOpponentAI: false,
    matchDurationSeconds: 90,
    gameplayProfile: 'classic',
    enableBounceTimeDebug: false,
  },
  'bot-team': {
    description: 'Team challenge (placeholder)',
    disableOpponentAI: false,
    matchDurationSeconds: 90,
    gameplayProfile: 'classic',
    enableBounceTimeDebug: false,
  },
  'test-bounce': {
    description: 'Bounce / pinball fyzika · bez AI',
    disableOpponentAI: true,
    matchDurationSeconds: 600,
    gameplayProfile: 'bounce',
    enableBounceTimeDebug: true,
  },
};

export function resolveMode(value: string | undefined | null): BotTestMode {
  if (value && (VALID_MODES as string[]).includes(value)) return value as BotTestMode;
  return 'test-1';
}
