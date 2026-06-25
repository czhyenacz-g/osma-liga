'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useOnlineGame } from './useOnlineGame';
import OnlineGameCanvas from './OnlineGameCanvas';
import MobileTouchControls from '@/components/game/MobileTouchControls';
import MobileOrientationOverlay from '@/components/game/MobileOrientationOverlay';
import MatchCommentaryToast from '@/components/game/MatchCommentaryToast';
import SoundToggleButton from '@/components/game/SoundToggleButton';
import { playGoalSound } from '@/lib/audio/whistleEngine';
import type { TouchInput } from '@/game/types';
import { firstGoalMessages, fullTimeMessages, substitutionMessages, pickRandomMessage } from '@/lib/game/matchCommentaryMessages';

interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
  switchPlayer: boolean;
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
  const [firstGoalMessage, setFirstGoalMessage] = useState<string | null>(null);
  const [substitutionMessage, setSubstitutionMessage] = useState<string | null>(null);
  const [fullTimeMessage, setFullTimeMessage] = useState<string | null>(null);

  // Play goal-restart whistle when goalMessage appears (tracks previous to fire only once per goal)
  const prevGoalMsgRef = useRef('');
  useEffect(() => {
    const msg = snapshot?.goalMessage ?? '';
    if (msg && msg !== prevGoalMsgRef.current) {
      playGoalSound();
    }
    prevGoalMsgRef.current = msg;
  }, [snapshot?.goalMessage]);

  // Reset commentary state whenever a new game room is joined
  const firstGoalShownRef = useRef(false);
  const fullTimeShownRef = useRef(false);
  const firstGoalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const substitutionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRemovedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    firstGoalShownRef.current = false;
    fullTimeShownRef.current = false;
    if (firstGoalTimeoutRef.current) clearTimeout(firstGoalTimeoutRef.current);
    setFirstGoalMessage(null);
    if (substitutionTimeoutRef.current) clearTimeout(substitutionTimeoutRef.current);
    setSubstitutionMessage(null);
    prevRemovedIdsRef.current = new Set();
    setFullTimeMessage(null);
  }, [gameCode]);

  // Substitution detection — fires a short toast whenever a player newly
  // enters a temporary removal (random substitution, server-authoritative).
  useEffect(() => {
    if (!snapshot) return;
    const removedIds = new Set(snapshot.players.filter((p) => p.removed).map((p) => p.id));
    let hasNew = false;
    for (const id of removedIds) {
      if (!prevRemovedIdsRef.current.has(id)) { hasNew = true; break; }
    }
    prevRemovedIdsRef.current = removedIds;
    if (hasNew) {
      if (substitutionTimeoutRef.current) clearTimeout(substitutionTimeoutRef.current);
      setSubstitutionMessage(pickRandomMessage(substitutionMessages));
      substitutionTimeoutRef.current = setTimeout(() => setSubstitutionMessage(null), 2500);
    }
  }, [snapshot]);

  // First goal detection — fires once per match, on the first goal scored by either side
  useEffect(() => {
    if (!snapshot) return;
    const totalGoals = snapshot.score.home + snapshot.score.away;
    if (totalGoals >= 1 && !firstGoalShownRef.current) {
      firstGoalShownRef.current = true;
      setFirstGoalMessage(pickRandomMessage(firstGoalMessages));
      firstGoalTimeoutRef.current = setTimeout(() => setFirstGoalMessage(null), 2500);
    }
  }, [snapshot]);

  // Full time detection — fires once when the match transitions to finished
  useEffect(() => {
    if (gameStatus === 'finished' && !fullTimeShownRef.current) {
      fullTimeShownRef.current = true;
      setFullTimeMessage(pickRandomMessage(fullTimeMessages));
    }
  }, [gameStatus]);

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
    switchPlayer: false,
  });

  const touchRef = useRef<TouchInput>({ up: false, down: false, left: false, right: false, kick: false, switchPlayer: false });

  // Reset touch on blur / tab switch / orientation change
  useEffect(() => {
    const reset = () => {
      const t = touchRef.current;
      t.up = false; t.down = false; t.left = false; t.right = false; t.kick = false; t.switchPlayer = false;
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
      // Raw "held" state — the server engine does its own edge detection,
      // so holding Q only triggers a single switch.
      if (e.code === 'KeyQ') keysRef.current.switchPlayer = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) keysRef.current.up = false;
      if (['ArrowDown', 's', 'S'].includes(e.key)) keysRef.current.down = false;
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) keysRef.current.left = false;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) keysRef.current.right = false;
      if (e.code === 'Space') keysRef.current.kick = false;
      if (e.code === 'KeyQ') keysRef.current.switchPlayer = false;
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
        switchPlayer: k.switchPlayer || t.switchPlayer,
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
          <p className="text-sm" style={subtleText}>
            {snapshot?.homeClubName ?? 'Domácí'} vs {snapshot?.awayClubName ?? 'Hosté'}
          </p>
          {fullTimeMessage && (
            <p className="text-xs italic max-w-sm mx-auto" style={subtleText}>
              {fullTimeMessage}
            </p>
          )}
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
      <SoundToggleButton />
      <MobileOrientationOverlay show={isMobile && isPortrait} />
      <div
        className="w-full"
        style={{
          position: 'relative',
          maxWidth: 960,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          overscrollBehavior: 'contain',
        }}
      >
        {snapshot ? (
          <OnlineGameCanvas snapshot={snapshot} role={role} keysRef={keysRef} touchRef={touchRef} />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ width: '100%', aspectRatio: '960/540', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}
          >
            <p className="text-sm" style={subtleText}>Načítám hru...</p>
          </div>
        )}

        <MatchCommentaryToast message={firstGoalMessage ?? substitutionMessage} />
      </div>
      {!isMobile && (
        <p className="text-xs" style={{ color: 'rgba(209,250,229,0.3)' }}>
          WASD / šipky = pohyb &nbsp;·&nbsp; Mezerník = kop (podrž = silnější) &nbsp;·&nbsp; Q = přepnout / přihrát
        </p>
      )}
      {isMobile && !isPortrait && (
        <>
          <p className="text-xs" style={{ color: 'rgba(209,250,229,0.3)' }}>
            D-pad = pohyb &nbsp;·&nbsp; KOP = kop (podrž = silnější) &nbsp;·&nbsp; PŘEP. = přepnout / přihrát
          </p>
          <MobileTouchControls touchRef={touchRef} />
        </>
      )}
    </main>
  );
}
