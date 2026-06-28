import type { Metadata } from 'next';
import Link from 'next/link';
import MatchPageClient from '@/components/game/MatchPageClient';
import GameNavLink from '@/components/ui/GameNavLink';
import { CLUBS } from '@/data/clubs';
import type { GameplayProfile } from '@/game/gameplayProfiles';

export const metadata: Metadata = {
  title: 'Bot test',
};

export type BotTestMode = 'test-1' | 'bot' | 'bot-team' | 'test-bounce';

const VALID_MODES: BotTestMode[] = ['test-1', 'bot', 'bot-team', 'test-bounce'];

interface ModeConfig {
  label: string;
  description: string;
  disableOpponentAI: boolean;
  matchDurationSeconds: number;
  gameplayProfile: GameplayProfile;
  enableBounceTimeDebug: boolean;
}

const MODE_CONFIG: Record<BotTestMode, ModeConfig> = {
  'test-1': {
    label: 'test-1',
    description: 'Trénink bez soupeře · classic pravidla',
    disableOpponentAI: true,
    matchDurationSeconds: 600,
    gameplayProfile: 'classic',
    enableBounceTimeDebug: true,
  },
  'bot': {
    label: 'bot',
    description: 'Klasický bot · standard délka',
    disableOpponentAI: false,
    matchDurationSeconds: 90,
    gameplayProfile: 'classic',
    enableBounceTimeDebug: false,
  },
  'bot-team': {
    label: 'bot-team',
    description: 'Team challenge (placeholder)',
    disableOpponentAI: false,
    matchDurationSeconds: 90,
    gameplayProfile: 'classic',
    enableBounceTimeDebug: false,
  },
  'test-bounce': {
    label: 'test-bounce',
    description: 'Bounce / pinball fyzika · bez AI',
    disableOpponentAI: true,
    matchDurationSeconds: 600,
    gameplayProfile: 'bounce',
    enableBounceTimeDebug: true,
  },
};

function resolveMode(value: string | undefined | null): BotTestMode {
  if (value && (VALID_MODES as string[]).includes(value)) return value as BotTestMode;
  return 'test-1';
}

export default async function HraBotTestPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; mode?: string }>;
}) {
  const { club: clubSlug, mode: modeParam } = await searchParams;
  const mode = resolveMode(modeParam);
  const config = MODE_CONFIG[mode];
  const baseUrl = clubSlug ? `/hra/bot-test?club=${clubSlug}&mode=` : '/hra/bot-test?mode=';

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 py-8"
      style={{ background: '#041f14' }}
    >
      <GameNavLink />

      <div className="text-center">
        <h1 className="text-xl font-black text-white">
          {(clubSlug && CLUBS.find((c) => c.slug === clubSlug)?.name) || 'Náhoda FC'}{' '}
          <span style={{ color: '#d6a94a' }}>—</span>{' '}
          bot test
        </h1>
      </div>

      {/* Mode switcher */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1">
          {VALID_MODES.map((m) => {
            const active = m === mode;
            return (
              <Link
                key={m}
                href={`${baseUrl}${m}`}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: `1px solid ${active ? 'rgba(109,191,138,0.7)' : 'rgba(109,191,138,0.2)'}`,
                  background: active ? 'rgba(109,191,138,0.15)' : 'transparent',
                  color: active ? '#6dbf8a' : 'rgba(209,250,229,0.4)',
                  textDecoration: 'none',
                  fontFamily: 'monospace',
                  transition: 'all 0.15s',
                }}
              >
                {m}
              </Link>
            );
          })}
        </div>
        <p style={{ fontSize: 10, color: 'rgba(209,250,229,0.3)', fontFamily: 'monospace' }}>
          {config.description}
        </p>
      </div>

      <MatchPageClient
        homeClubSlug={clubSlug}
        disableOpponentAI={config.disableOpponentAI}
        matchDurationSeconds={config.matchDurationSeconds}
        gameplayProfile={config.gameplayProfile}
        enableBounceTimeDebug={config.enableBounceTimeDebug}
      />

      <p className="hidden sm:block text-sm text-center font-semibold" style={{ color: 'rgba(209,250,229,0.65)' }}>
        <span style={{ color: '#d6a94a' }}>WASD</span> / šipky &mdash; pohyb
        &nbsp;&nbsp;·&nbsp;&nbsp;
        <span style={{ color: '#d6a94a' }}>Space</span> &mdash; kopnout (podrž = silnější)
        &nbsp;&nbsp;·&nbsp;&nbsp;
        <span style={{ color: '#d6a94a' }}>Q</span> &mdash; přepnout / přihrát
        &nbsp;&nbsp;·&nbsp;&nbsp;
        R &mdash; restart
      </p>
      <p className="sm:hidden text-xs text-center max-w-xs" style={{ color: 'rgba(209,250,229,0.38)' }}>
        Hra vyžaduje klávesnici. Na mobilu doporučujeme hrát na větší obrazovce.
      </p>

      <div className="flex flex-col items-center gap-2">
        <Link
          href="/satna"
          className="text-xs transition hover:opacity-80"
          style={{ color: 'rgba(209,250,229,0.38)' }}
        >
          &#8592; Šatna
        </Link>
      </div>
    </main>
  );
}
