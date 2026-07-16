import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import GameNavLink from '@/components/ui/GameNavLink';
import CreateTournamentForm from '@/components/tournament/CreateTournamentForm';

export const metadata: Metadata = {
  title: 'Založit turnaj',
};

const cardBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(214,169,74,0.18)',
  borderRadius: 16,
};

const gold = { color: '#d6a94a' };
const subtle = { color: 'rgba(209,250,229,0.55)' };

export default async function TurnajPage() {
  const session = await getSession();

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12 gap-8"
      style={{ background: '#041f14' }}
    >
      <GameNavLink />

      <div className="text-center max-w-md">
        <h1 className="text-3xl font-black text-white mb-2">Založit turnaj</h1>
        <p className="text-sm leading-relaxed" style={subtle}>
          Okresní derby, liga každý s každým, nebo playoff top 4 — podle počtu hráčů.
          Postupová matematika začíná hned po založení.
        </p>
      </div>

      {!session ? (
        <LoginPrompt />
      ) : !session.osmaUserId ? (
        <ErrorCard message="Tvůj hráčský účet se ještě nepropojil s Osmou ligou. Zkus se znovu přihlásit přes Discord." />
      ) : (
        <CreateTournamentForm />
      )}
    </main>
  );
}

function LoginPrompt() {
  return (
    <div className="w-full max-w-md p-6 flex flex-col gap-4" style={cardBase}>
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={gold}>
          Přihlášení
        </p>
        <p className="text-sm leading-relaxed" style={subtle}>
          Turnaj může založit jen přihlášený hráč. Přihlas se přes Discord a jdeme na to.
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
        Přihlásit se přes Discord
      </a>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="w-full max-w-md p-6 text-center" style={cardBase}>
      <p className="text-sm leading-relaxed" style={{ color: '#f87171' }}>{message}</p>
    </div>
  );
}
