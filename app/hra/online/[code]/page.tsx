'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';
import dynamic from 'next/dynamic';

// Lazy-load game client — only mounted when we have a token and game is ready
const OnlineGameClient = dynamic(
  () => import('../../../../components/online/OnlineGameClient'),
  { ssr: false },
);

type GameRoom = {
  code: string;
  status: 'waiting' | 'full' | 'expired';
  players: number;
  maxPlayers: number;
  expiresAt: string;
};

type JoinResponse = {
  code: string;
  role: string;
  status: string;
  players: number;
  maxPlayers: number;
  playerToken: string;
  expiresAt: string;
};

export default function OnlineRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const upperCode = code.toUpperCase();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [myToken, setMyToken] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [enterGame, setEnterGame] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem(`osma-lobby-token-${upperCode}`);
      if (token) {
        setMyToken(token);
        setIsHost(true);
      }
    }
  }, [upperCode]);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/online-games/${upperCode}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data = await res.json() as GameRoom;
        setRoom(data);
        if (data.status === 'full' && myToken) {
          setIsHost(true);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [upperCode, myToken]);

  useEffect(() => {
    void fetchRoom();
    const interval = setInterval(() => { void fetchRoom(); }, 5000);
    return () => clearInterval(interval);
  }, [fetchRoom]);

  async function handleJoin() {
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/online-games/${upperCode}/join`, { method: 'POST' });
      if (res.status === 409) {
        setJoinError('Zápas je already plný. Asi tě někdo předběhl.');
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        setJoinError('Nepodařilo se připojit. Zkus to znovu.');
        return;
      }
      const data = await res.json() as JoinResponse;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`osma-lobby-token-${upperCode}`, data.playerToken);
      }
      setMyToken(data.playerToken);
      setIsHost(false);
      setRoom({ ...data, status: data.status as GameRoom['status'] });
    } catch {
      setJoinError('Nepodařilo se připojit. Zkus to znovu.');
    } finally {
      setJoining(false);
    }
  }

  // If we have a token and both players are ready, show the game client
  const isFull = room?.status === 'full';
  if (enterGame && myToken && isFull) {
    return <OnlineGameClient gameCode={upperCode} playerToken={myToken} />;
  }

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#041f14' }}
      >
        <p className="text-sm" style={{ color: 'rgba(209,250,229,0.45)' }}>Načítám šatnu...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-5 px-4"
        style={{ background: '#041f14' }}
      >
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚽</p>
          <h1 className="text-lg font-bold text-white mb-2">Kód nenalezen</h1>
          <p className="text-sm" style={{ color: 'rgba(209,250,229,0.5)' }}>
            Tenhle kód už vypršel nebo nikdy neexistoval. Asi ho odnesl vítr z hřiště.
          </p>
        </div>
        <Link
          href="/hra/online"
          className="text-sm font-semibold transition hover:opacity-80"
          style={{ color: '#d6a94a' }}
        >
          ← Zpět do lobby
        </Link>
      </main>
    );
  }

  if (!room) return null;

  const hasToken = !!myToken;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-10"
      style={{ background: '#041f14' }}
    >
      <div className="text-center">
        <p className="text-xs mb-1" style={{ color: 'rgba(209,250,229,0.4)' }}>Kód zápasu</p>
        <span className="text-5xl font-black tracking-widest" style={{ color: '#d6a94a' }}>
          {room.code}
        </span>
      </div>

      <div
        className="w-full max-w-sm rounded-xl p-6 flex flex-col gap-4 text-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(214,169,74,0.2)' }}
      >
        {/* Stav hráčů */}
        <div className="flex justify-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">👤</span>
            <span className="text-xs text-white font-semibold">Hostitel</span>
            <span className="text-xs" style={{ color: '#86efac' }}>připojen</span>
          </div>
          <div className="flex items-center text-2xl" style={{ color: 'rgba(209,250,229,0.2)' }}>vs</div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">{isFull ? '👤' : '👻'}</span>
            <span className="text-xs text-white font-semibold">Host</span>
            <span className="text-xs" style={{ color: isFull ? '#86efac' : 'rgba(209,250,229,0.35)' }}>
              {isFull ? 'připojen' : 'čeká se...'}
            </span>
          </div>
        </div>

        {/* Stavy */}
        {isFull && hasToken && isHost && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold" style={{ color: '#86efac' }}>
              Soupeř dorazil. Jdeme hrát?
            </p>
            <button
              onClick={() => setEnterGame(true)}
              className="w-full py-3 rounded-lg font-bold text-sm transition hover:opacity-90"
              style={{ background: '#d6a94a', color: '#041f14' }}
            >
              Vstoupit do zápasu
            </button>
          </div>
        )}

        {isFull && hasToken && !isHost && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold" style={{ color: '#86efac' }}>
              Jsi v šatně jako host. Jdeme?
            </p>
            <button
              onClick={() => setEnterGame(true)}
              className="w-full py-3 rounded-lg font-bold text-sm transition hover:opacity-90"
              style={{ background: '#d6a94a', color: '#041f14' }}
            >
              Vstoupit do zápasu
            </button>
          </div>
        )}

        {!isFull && hasToken && isHost && (
          <p className="text-sm" style={{ color: 'rgba(209,250,229,0.6)' }}>
            Čekáme na soupeře...
          </p>
        )}

        {isFull && !hasToken && (
          <p className="text-sm" style={{ color: 'rgba(209,250,229,0.6)' }}>
            Zápas už má dva hráče. Tribuna zatím není otevřená.
          </p>
        )}

        {!isFull && !hasToken && (
          <>
            <p className="text-sm" style={{ color: 'rgba(209,250,229,0.6)' }}>
              Hostitel čeká na soupeře. Připoj se!
            </p>
            <button
              onClick={() => { void handleJoin(); }}
              disabled={joining}
              className="w-full py-3 rounded-lg font-bold text-sm transition disabled:opacity-50"
              style={{ background: '#d6a94a', color: '#041f14' }}
            >
              {joining ? 'Připojuji...' : 'Připojit se jako host'}
            </button>
            {joinError && (
              <p className="text-xs" style={{ color: '#f87171' }}>{joinError}</p>
            )}
          </>
        )}

        <p className="text-xs" style={{ color: 'rgba(209,250,229,0.25)' }}>
          Platnost vyprší: {new Date(room.expiresAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <Link
        href="/hra/online"
        className="text-xs transition hover:opacity-80"
        style={{ color: 'rgba(209,250,229,0.38)' }}
      >
        ← Zpět do lobby
      </Link>
    </main>
  );
}
