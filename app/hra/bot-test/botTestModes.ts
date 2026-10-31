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

// Physics variant picked in the bot-test switch. Applies to every mode whose
// own profile is `classic`; test-bounce keeps its bounce profile. The V2
// variants are EXPERIMENTAL and exist only here (see gameplayProfiles.ts).
export type BotTestPhysics = 'classic' | 'v2-shot' | 'v2-turn' | 'v3-dribble';

export const PHYSICS_OPTIONS: { value: BotTestPhysics; label: string }[] = [
  { value: 'classic', label: 'Původní fyzika' },
  { value: 'v2-shot', label: 'V2: střela' },
  { value: 'v2-turn', label: 'V2: střela + otočka' },
  { value: 'v3-dribble', label: 'V3: Příprava míče' },
];

export function resolvePhysics(value: string | undefined | null): BotTestPhysics {
  return PHYSICS_OPTIONS.some((o) => o.value === value) ? (value as BotTestPhysics) : 'classic';
}

export function resolveBotTestProfile(mode: BotTestMode, physics: BotTestPhysics): GameplayProfile {
  const own = MODE_CONFIG[mode].gameplayProfile;
  return own === 'classic' ? physics : own;
}

export function resolveMode(value: string | undefined | null): BotTestMode {
  if (value && (VALID_MODES as string[]).includes(value)) return value as BotTestMode;
  return 'test-1';
}
