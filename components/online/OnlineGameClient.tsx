'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useOnlineGame } from './useOnlineGame';
import OnlineGameCanvas from './OnlineGameCanvas';
import MobileTouchControls from '@/components/game/MobileTouchControls';
import type { TouchInput } from '@/game/types';

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

  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      setIsMobile(
        window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768,
      );
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  const keysRef = useRef<KeyState>({
    up: false,
    down: false,
    left: false,
    right: false,
    kick: false,
  });

  const touchRef = useRef<TouchInput>({ up: false, down: false, left: false, right: false, kick: false });

  // Reset touch on blur / tab switch / orientation change
  useEffect(() => {
    const reset = () => {
      const t = touchRef.current;
      t.up = false; t.down = false; t.left = false; t.right = false; t.kick = false;
    };
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    window.addEventListener('orientationchange', reset);
    return () => {
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      window.removeEventListener('orientationchange', reset);
    };
  }, []);

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

    // Send input to server at ~30Hz (merge keyboard + touch)
    const interval = setInterval(() => {
      const k = keysRef.current;
      const t = touchRef.current;
      sendInput({
        up: k.up || t.up,
        down: k.down || t.down,
        left: k.left || t.left,
        right: k.right || t.right,
        kick: k.kick || t.kick,
      });
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
        <div className="flex gap-3">
          <Link
            href="/satna"
            className="rounded-xl px-6 py-2.5 text-sm font-bold transition hover:opacity-90"
            style={{ background: '#d6a94a', color: '#041f14' }}
          >
            Zpět do šatny
          </Link>
          <Link
            href="/hra/online"
            className="rounded-xl px-6 py-2.5 text-sm font-bold transition hover:opacity-80"
            style={{ background: 'rgba(209,250,229,0.12)', border: '1px solid rgba(209,250,229,0.25)', color: 'white' }}
          >
            Nový zápas
          </Link>
        </div>
      </main>
    );
  }

  // playing
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-2 py-4" style={bg}>
      {isMobile && isPortrait && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: '#041f14',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 52, lineHeight: 1 }}>↻</span>
          <p className="text-xl font-bold text-white">Otoč telefon na šířku.</p>
          <p className="text-sm" style={subtleText}>
            Okresní fotbal se na výšku nevejde.
          </p>
        </div>
      )}
      <div
        className="w-full"
        style={{
          maxWidth: 960,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overscrollBehavior: 'contain',
        }}
      >
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
      {!isMobile && (
        <p className="text-xs" style={{ color: 'rgba(209,250,229,0.3)' }}>
          WASD / šipky = pohyb &nbsp;·&nbsp; Mezerník = kop
        </p>
      )}
      {isMobile && !isPortrait && <MobileTouchControls touchRef={touchRef} />}
    </main>
  );
}
