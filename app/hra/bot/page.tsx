import type { Metadata } from 'next';
import Link from 'next/link';
import MatchPageClient from '@/components/game/MatchPageClient';

export const metadata: Metadata = {
  title: 'Zápas proti botovi — Osmá liga',
};

export default function HraBotPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 py-8"
      style={{ background: '#041f14' }}
    >
      <div className="text-center">
        <h1 className="text-xl font-black text-white">
          Náhoda FC{' '}
          <span style={{ color: '#d6a94a' }}>vs</span>{' '}
          FK Pařezov
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(209,250,229,0.45)' }}>
          První testovací zápas Osmé ligy
        </p>
      </div>

      <MatchPageClient />

      <p className="hidden sm:block text-xs text-center" style={{ color: 'rgba(209,250,229,0.38)' }}>
        WASD / šipky &mdash; pohyb &nbsp;&middot;&nbsp; Space &mdash; kopnout &nbsp;&middot;&nbsp; R &mdash; restart
      </p>
      <p className="sm:hidden text-xs text-center max-w-xs" style={{ color: 'rgba(209,250,229,0.38)' }}>
        Hra vyžaduje klávesnici. Na mobilu doporučujeme hrát na větší obrazovce.
      </p>

      <div className="flex flex-col items-center gap-2">
        <Link
          href="/hra/multiplayer"
          className="text-xs transition hover:opacity-80"
          style={{ color: 'rgba(214,169,74,0.65)' }}
        >
          &#8594; Online zápas <span style={{ color: 'rgba(214,169,74,0.4)' }}>(beta)</span>
        </Link>
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
