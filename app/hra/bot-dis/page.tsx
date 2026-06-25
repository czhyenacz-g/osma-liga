import type { Metadata } from 'next';
import Link from 'next/link';
import MatchPageClient from '@/components/game/MatchPageClient';
import GameNavLink from '@/components/ui/GameNavLink';
import { CLUBS } from '@/data/clubs';

// Hidden training variant — reachable only via direct URL (not linked from
// /hra/bot or any nav). Opponent AI is disabled (away team stays put, no
// chase/kick) and the match runs 10 minutes instead of the usual 90s, so a
// player can practice ball control/shooting without pressure.
const MATCH_DURATION_SECONDS = 600;

export const metadata: Metadata = {
  title: 'Trénink bez soupeře',
};

export default async function HraBotDisPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string }>;
}) {
  const { club: clubSlug } = await searchParams;
  const homeTeamName = (clubSlug && CLUBS.find((c) => c.slug === clubSlug)?.name) || 'Náhoda FC';

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 py-8"
      style={{ background: '#041f14' }}
    >
      <GameNavLink />

      <div className="text-center">
        <h1 className="text-xl font-black text-white">
          {homeTeamName}{' '}
          <span style={{ color: '#d6a94a' }}>—</span>{' '}
          trénink bez soupeře
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(209,250,229,0.45)' }}>
          Soupeř stojí na místě, 10 minut volné hry
        </p>
      </div>

      <MatchPageClient
        homeClubSlug={clubSlug}
        disableOpponentAI
        matchDurationSeconds={MATCH_DURATION_SECONDS}
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
