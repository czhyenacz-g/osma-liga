'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CLUBS } from '@/data/clubs';
import GameNavLink from '@/components/ui/GameNavLink';

type GameRoom = {
  code: string;
  status: 'waiting' | 'full' | 'playing' | 'finished' | 'expired';
  players: number;
  maxPlayers: number;
  createdAt: string;
  expiresAt: string;
  onlineMatchId?: string | null;
};

type CreatedGame = {
  code: string;
  joinUrlPath: string;
  playerToken: string;
  expiresAt: string;
};

export default function OnlineLobbyPage() {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedGame | null>(null);
  const [copied, setCopied] = useState(false);
  const [games, setGames] = useState<GameRoom[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string>(CLUBS[0]?.slug ?? 'nahoda-fc');

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/online-games?limit=10');
      if (res.ok) {
        const data = await res.json() as GameRoom[];
        setGames(data);
      }
    } catch {
      // tiché selhání — seznam her není kritický
    } finally {
      setLoadingGames(false);
    }
  }, []);

  useEffect(() => {
    void fetchGames();
    const interval = setInterval(() => { void fetchGames(); }, 10000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/online-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId: selectedClubId }),
      });
      if (!res.ok) {
        setError('Nepodařilo se vytvořit zápas. Zkus to znovu.');
        return;
      }
      const data = await res.json() as CreatedGame;
      setCreated(data);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`osma-lobby-token-${data.code}`, data.playerToken);
      }
      void fetchGames();
    } catch {
      setError('Nepodařilo se vytvořit zápas. Zkus to znovu.');
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — nelze kopírovat
    }
  }

  const inviteUrl = created
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/hra/online/${created.code}`
    : '';

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-10 gap-8"
      style={{ background: '#041f14' }}
    >
      <GameNavLink />

      <div className="text-center max-w-md">
        <h1 className="text-2xl font-black text-white mb-2">Online zápas</h1>
        <p className="text-sm" style={{ color: 'rgba(209,250,229,0.55)' }}>
          Založ zápas, pošli odkaz druhému hráči a počkejte v šatně.
          Třetí hráč má zatím smůlu.
        </p>
      </div>

      {/* Create game section */}
      <div
        className="w-full max-w-md rounded-xl p-6 flex flex-col gap-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(214,169,74,0.2)' }}
      >
        {!created ? (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'rgba(209,250,229,0.5)' }}>
                Tvůj klub
              </label>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-semibold text-white bg-transparent border outline-none"
                style={{ borderColor: 'rgba(214,169,74,0.3)', background: 'rgba(255,255,255,0.06)' }}
              >
                {CLUBS.map((c) => (
                  <option key={c.slug} value={c.slug} style={{ background: '#041f14' }}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { void handleCreate(); }}
              disabled={creating}
              className="w-full py-3 rounded-lg font-bold text-sm transition disabled:opacity-50"
              style={{ background: '#d6a94a', color: '#041f14' }}
            >
              {creating ? 'Zakládám...' : 'Založit online zápas'}
            </button>
            {error && (
              <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <p className="text-xs mb-1" style={{ color: 'rgba(209,250,229,0.45)' }}>Kód zápasu</p>
              <span
                className="text-4xl font-black tracking-widest"
                style={{ color: '#d6a94a' }}
              >
                {created.code}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs" style={{ color: 'rgba(209,250,229,0.45)' }}>Odkaz pro soupeře</p>
              <div className="flex gap-2 min-w-0">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg bg-transparent border text-white truncate"
                  style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                />
                <button
                  onClick={() => { void handleCopy(inviteUrl); }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold transition"
                  style={{ background: copied ? '#166534' : 'rgba(214,169,74,0.15)', color: '#d6a94a', border: '1px solid rgba(214,169,74,0.3)' }}
                >
                  {copied ? 'Zkopírováno' : 'Kopírovat'}
                </button>
              </div>
            </div>

            <Link
              href={`/hra/online/${created.code}`}
              className="w-full text-center py-2 rounded-lg text-sm font-bold transition hover:opacity-80"
              style={{ background: 'rgba(214,169,74,0.12)', color: '#d6a94a', border: '1px solid rgba(214,169,74,0.25)' }}
            >
              Vstoupit do šatny →
            </Link>

            <p className="text-xs text-center" style={{ color: 'rgba(209,250,229,0.3)' }}>
              Platnost vyprší: {new Date(created.expiresAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>

      {/* Active games list */}
      <div className="w-full max-w-md flex flex-col gap-3">
        <h2 className="text-sm font-bold text-white">Aktivní hry</h2>
        {loadingGames ? (
          <p className="text-xs" style={{ color: 'rgba(209,250,229,0.35)' }}>Načítám...</p>
        ) : games.length === 0 ? (
          <p className="text-xs" style={{ color: 'rgba(209,250,229,0.35)' }}>Žádné aktivní hry. Založ první!</p>
        ) : (
          <div className="flex flex-col gap-2">
            {games.map((g) => (
              <div
                key={g.code}
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono font-bold text-sm text-white">{g.code}</span>
                  <span className="text-xs" style={{ color: 'rgba(209,250,229,0.4)' }}>
                    {g.players}/{g.maxPlayers} hráčů &middot;{' '}
                    <span style={{
                      color: g.status === 'waiting' ? '#86efac'
                           : g.status === 'finished' ? 'rgba(209,250,229,0.35)'
                           : '#fca5a5',
                    }}>
                      {g.status === 'waiting' ? 'čeká na hráče'
                       : g.status === 'playing' ? 'probíhá'
                       : g.status === 'finished' ? 'dohráno'
                       : 'plno'}
                    </span>
                  </span>
                </div>
                {g.status === 'waiting' && (
                  <Link
                    href={`/hra/online/${g.code}`}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                    style={{ background: 'rgba(214,169,74,0.15)', color: '#d6a94a', border: '1px solid rgba(214,169,74,0.25)' }}
                  >
                    Připojit se
                  </Link>
                )}
                {g.status === 'finished' && g.onlineMatchId && (
                  <Link
                    href={`/zapasy/${g.onlineMatchId}`}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition hover:opacity-80"
                    style={{ background: 'rgba(209,250,229,0.06)', color: 'rgba(209,250,229,0.5)', border: '1px solid rgba(209,250,229,0.12)' }}
                  >
                    Detail →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/satna"
        className="text-xs transition hover:opacity-80"
        style={{ color: 'rgba(209,250,229,0.38)' }}
      >
        &#8592; Šatna
      </Link>
    </main>
  );
}
