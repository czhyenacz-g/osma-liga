import type { Metadata } from 'next';
import Link from 'next/link';
import GameCanvas from '@/components/game/GameCanvas';

export const metadata: Metadata = {
  title: 'Zápas — Osmá liga',
};

export default function HraPage() {
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

      <div style={{ width: '100%', maxWidth: 960 }}>
        <GameCanvas />
      </div>

      <p className="text-xs text-center" style={{ color: 'rgba(209,250,229,0.38)' }}>
        WASD / šipky &mdash; pohyb &nbsp;&middot;&nbsp; Space &mdash; kopnout &nbsp;&middot;&nbsp; R &mdash; restart
      </p>

      <Link
        href="/"
        className="text-xs transition hover:opacity-80"
        style={{ color: 'rgba(209,250,229,0.38)' }}
      >
        &#8592; Zpět na web Osmé ligy
      </Link>
    </main>
  );
}
