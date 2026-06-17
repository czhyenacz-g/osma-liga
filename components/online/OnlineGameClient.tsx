'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useOnlineGame } from './useOnlineGame';
import OnlineGameCanvas from './OnlineGameCanvas';

interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
}

export default function OnlineGameClient({
  gameCode,
  playerToken,
}: {
  gameCode: string;
  playerToken: string;
}) {
  const { snapshot, role, gameStatus, errorMsg, sendInput, startGame } =
    useOnlineGame(gameCode, playerToken);

  const keysRef = useRef<KeyState>({
    up: false,
    down: false,
    left: false,
    right: false,
    kick: false,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) keysRef.current.up = true;
      if (['ArrowDown', 's', 'S'].includes(e.key)) keysRef.current.down = true;
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) keysRef.current.left = true;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) keysRef.current.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        keysRef.current.kick = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) keysRef.current.up = false;
      if (['ArrowDown', 's', 'S'].includes(e.key)) keysRef.current.down = false;
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) keysRef.current.left = false;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) keysRef.current.right = false;
      if (e.code === 'Space') keysRef.current.kick = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Send input to server at ~30Hz
    const interval = setInterval(() => {
      sendInput({ ...keysRef.current });
    }, 33);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      clearInterval(interval);
    };
  }, [sendInput]);

  const bg: React.CSSProperties = { background: '#041f14' };
  const centerClass = 'min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-10';
  const subtleText: React.CSSProperties = { color: 'rgba(209,250,229,0.5)' };

  if (gameStatus === 'connecting') {
    return (
      <main className="min-h-screen flex items-center justify-center" style={bg}>
        <p className="text-sm" style={subtleText}>Připojování...</p>
      </main>
    );
  }

  if (gameStatus === 'error') {
    return (
      <main className={centerClass} style={bg}>
        <p className="text-base font-semibold" style={{ color: '#f87171' }}>
          Chyba: {errorMsg ?? 'Neznámá chyba'}
        </p>
        <Link href="/hra/online" className="text-sm" style={{ color: '#d6a94a' }}>
          ← Zpět do lobby
        </Link>
      </main>
    );
  }

  if (gameStatus === 'waiting') {
    return (
      <main className={centerClass} style={bg}>
        <div className="text-center max-w-sm flex flex-col gap-4">
          <p className="text-lg font-bold text-white">Šatna připravena</p>
          <p className="text-sm" style={subtleText}>
            Hraješ jako: <span className="font-bold text-white">{role === 'home' ? 'Hostitel (domácí)' : 'Host (hosté)'}</span>
          </p>

          {role === 'home' && (
            <button
              onClick={startGame}
              className="w-full py-3 rounded-lg font-bold text-sm transition hover:opacity-90"
              style={{ background: '#d6a94a', color: '#041f14' }}
            >
              Spustit zápas
            </button>
          )}

          {role === 'guest' && (
            <p className="text-sm" style={subtleText}>
              Čekáme, až hostitel spustí zápas...
            </p>
          )}
        </div>
        <Link href="/hra/online" className="text-xs" style={{ color: 'rgba(209,250,229,0.38)' }}>
          ← Zpět do lobby
        </Link>
      </main>
    );
  }

  if (gameStatus === 'finished') {
    return (
      <main className={centerClass} style={bg}>
        <div className="text-center flex flex-col gap-4">
          <p className="text-3xl font-black text-white">Konec zápasu</p>
          {snapshot && (
            <p className="text-5xl font-black" style={{ color: '#d6a94a' }}>
              {snapshot.score.home} : {snapshot.score.away}
            </p>
          )}
          <p className="text-sm" style={subtleText}>Náhoda FC vs FK Pařezov</p>
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

  // playing
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-2 py-4" style={bg}>
      <div className="w-full" style={{ maxWidth: 960 }}>
        {snapshot ? (
          <OnlineGameCanvas snapshot={snapshot} role={role} />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ width: '100%', aspectRatio: '960/540', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}
          >
            <p className="text-sm" style={subtleText}>Načítám hru...</p>
          </div>
        )}
      </div>
      <p className="text-xs" style={{ color: 'rgba(209,250,229,0.3)' }}>
        WASD / šipky = pohyb &nbsp;·&nbsp; Mezerník = kop
      </p>
    </main>
  );
}
