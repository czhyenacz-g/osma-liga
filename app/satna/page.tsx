import type { Metadata } from 'next';
import Link from 'next/link';
import SatnaJoinForm from '@/components/game/SatnaJoinForm';

export const metadata: Metadata = {
  title: 'Šatna | Osmá liga',
  description: 'Vyber si zápas v Osmé lize — proti botovi, online s druhým hráčem nebo se připoj pomocí kódu.',
};

const cardBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(214,169,74,0.18)',
  borderRadius: 16,
};

export default function SatnaPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 py-12"
      style={{ background: '#041f14' }}
    >
      {/* Nadpis */}
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-black text-white mb-2">Šatna</h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(209,250,229,0.55)' }}>
          Než vyběhneš na hřiště, vyber si, jak dneska utrpíš slávu.
        </p>
      </div>

      {/* Tři karty */}
      <div className="w-full max-w-md flex flex-col gap-4">

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
