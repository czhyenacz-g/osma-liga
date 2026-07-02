import type { Metadata } from 'next';
import Link from 'next/link';
import GameNavLink from '@/components/ui/GameNavLink';
import { CLUBS } from '@/data/clubs';
import BotTestClient from './BotTestClient';
import { resolveMode } from './botTestModes';

export const metadata: Metadata = {
  title: 'Bot test',
};

export default async function HraBotTestPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; mode?: string }>;
}) {
  const { club: clubSlug, mode: modeParam } = await searchParams;
  const initialMode = resolveMode(modeParam);

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

      <BotTestClient initialMode={initialMode} homeClubSlug={clubSlug} />

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
