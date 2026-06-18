import type { Metadata } from 'next';
import Link from 'next/link';
import SatnaJoinForm from '@/components/game/SatnaJoinForm';
import { getSession } from '@/lib/auth/session';
import GameNavLink from '@/components/ui/GameNavLink';

export const metadata: Metadata = {
  title: 'Šatna | Osmá liga',
  description: 'Vyber si zápas v Osmé lize — proti botovi, online s druhým hráčem nebo se připoj pomocí kódu.',
};

const cardBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(214,169,74,0.18)',
  borderRadius: 16,
};

export default async function SatnaPage() {
  const session = await getSession();

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 py-12"
      style={{ background: '#041f14' }}
    >
      <GameNavLink />

      {/* Nadpis */}
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-black text-white mb-2">Šatna</h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(209,250,229,0.55)' }}>
          Než vyběhneš na hřiště, vyber si, jak dneska utrpíš slávu.
        </p>
      </div>

      {/* Karty */}
      <div className="w-full max-w-md flex flex-col gap-4">

        {/* 0. Auth */}
        {session ? (
          <div className="p-6 flex flex-col gap-2" style={cardBase}>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#d6a94a' }}>
              Hráč
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(209,250,229,0.7)' }}>
              Vítej, <span className="font-bold text-white">{session.globalName ?? session.username}</span>. Jsi připraven na hru?
            </p>
            <form method="POST" action="/api/auth/logout" className="mt-1">
              <button type="submit" className="text-xs transition hover:opacity-80" style={{ color: 'rgba(209,250,229,0.35)' }}>
                Odhlásit se
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-4" style={cardBase}>
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#d6a94a' }}>
                Přihlášení
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(209,250,229,0.7)' }}>
                Bez přihlášení přes Discord se ti statistiky zápasů nebudou ukládat na účet.
              </p>
            </div>
            <a
              href="/api/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition hover:opacity-90"
              style={{ background: '#d6a94a', color: '#041f14' }}
            >
              <svg width="16" height="12" viewBox="0 0 71 55" fill="currentColor" aria-hidden="true">
                <path d="M60.1 4.9A58.6 58.6 0 0 0 45.5.5a40.4 40.4 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.2 0A39.4 39.4 0 0 0 25.7.5 58.4 58.4 0 0 0 11.1 4.9C1.6 19.4-.9 33.4.3 47.2a58.8 58.8 0 0 0 17.9 9.1 43.4 43.4 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 36 0l1.5 1.1a38.6 38.6 0 0 1-6 2.9 43.3 43.3 0 0 0 3.8 6.2 58.6 58.6 0 0 0 17.9-9.1c1.5-15.4-2.4-29.3-10.5-41.2ZM23.8 37.9a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Zm23.3 0a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Z" />
              </svg>
              Přihlásit přes Discord
            </a>
          </div>
        )}

        {/* 1. Bot */}
        <div className="p-6 flex flex-col gap-4" style={cardBase}>
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#d6a94a' }}>
              Proti botovi
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(209,250,229,0.7)' }}>
              Rychlý zápas proti okresní umělé inteligenci. Ideální, když soupeř ještě nedorazil nebo tvrdí, že má výron.
            </p>
          </div>
          <Link
            href="/hra/bot"
            className="inline-block text-center rounded-lg py-2.5 text-sm font-bold transition hover:opacity-90"
            style={{ background: '#d6a94a', color: '#041f14' }}
          >
            Hrát proti botovi
          </Link>
        </div>

        {/* 2. Online */}
        <div className="p-6 flex flex-col gap-4" style={cardBase}>
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#d6a94a' }}>
              Online zápas
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(209,250,229,0.7)' }}>
              Vytvoř zápas, pošli odkaz druhému hráči a uvidíte, komu dřív dojde taktika.
            </p>
          </div>
          <Link
            href="/hra/multiplayer"
            className="inline-block text-center rounded-lg py-2.5 text-sm font-bold transition hover:opacity-90"
            style={{ background: 'rgba(214,169,74,0.14)', color: '#d6a94a', border: '1px solid rgba(214,169,74,0.35)' }}
          >
            Založit online zápas
          </Link>
        </div>

        {/* 3. Připojit kódem */}
        <div className="p-6 flex flex-col gap-4" style={cardBase}>
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#d6a94a' }}>
              Připojit se kódem
            </p>
            <p className="text-sm leading-relaxed mb-1" style={{ color: 'rgba(209,250,229,0.7)' }}>
              Máš kód od soupeře? Zadej ho sem. Pokud si ho opsal špatně, rozhodčí za to neručí.
            </p>
          </div>
          <SatnaJoinForm />
        </div>

      </div>

      {/* Zpět */}
      <Link
        href="/"
        className="text-xs transition hover:opacity-80"
        style={{ color: 'rgba(209,250,229,0.35)' }}
      >
        &#8592; Zpět na web Osmé ligy
      </Link>
    </main>
  );
}
