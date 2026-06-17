'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import GameCanvas from './GameCanvas';
import MobileTouchControls from './MobileTouchControls';
import MobileOrientationOverlay from './MobileOrientationOverlay';
import { MATCH_DURATION } from '@/game/constants';
import type { TouchInput } from '@/game/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type GamePhase = 'idle' | 'countdown' | 'playing';

const NO_SELECT: React.CSSProperties = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
};

const OVERLAY_STYLE: React.CSSProperties = {
  width: '100%',
  aspectRatio: '16 / 9',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#030e08',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.1)',
  gap: 20,
  ...NO_SELECT,
};

async function requestGameFullscreen(element: HTMLElement | null): Promise<boolean> {
  if (!element) return false;
  const anyEl = element as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return true;
    }
    if (anyEl.webkitRequestFullscreen) {
      await anyEl.webkitRequestFullscreen();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default function MatchPageClient() {
  const [matchScore, setMatchScore] = useState<{ home: number; away: number } | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
  const [countdownNum, setCountdownNum] = useState(3);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fsStatus, setFsStatus] = useState<'idle' | 'unavailable'>('idle');
  const touchRef = useRef<TouchInput>({ up: false, down: false, left: false, right: false, kick: false });
  const gameWrapperRef = useRef<HTMLDivElement>(null);

  // Orientation / mobile detection
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

  // Reset touch state on blur / tab switch / orientation change
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

  // Countdown logic
  useEffect(() => {
    if (gamePhase !== 'countdown') return;
    if (countdownNum > 0) {
      const t = setTimeout(() => setCountdownNum((n) => n - 1), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setGamePhase('playing'), 700);
    return () => clearTimeout(t);
  }, [gamePhase, countdownNum]);

  const startCountdown = () => {
    setCountdownNum(3);
    setGamePhase('countdown');
    setMatchScore(null);
    setSaveState('idle');
  };

  const handleMatchEnd = useCallback((score: { home: number; away: number }) => {
    setMatchScore(score);
    setSaveState('idle');
  }, []);

  const handleRestart = useCallback(() => {
    const t = touchRef.current;
    t.up = false; t.down = false; t.left = false; t.right = false; t.kick = false;
    setMatchScore(null);
    setSaveState('idle');
    setGamePhase('idle');
  }, []);

  const handleFullscreen = async () => {
    const ok = await requestGameFullscreen(gameWrapperRef.current);
    if (!ok) setFsStatus('unavailable');
  };

  const save = async () => {
    if (!matchScore) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/match-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: matchScore.home,
          awayScore: matchScore.away,
          durationSeconds: MATCH_DURATION,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const countdownText = countdownNum > 0 ? String(countdownNum) : 'HRAJ!';

  return (
    <>
      <MobileOrientationOverlay show={isMobile && isPortrait} />

      <div ref={gameWrapperRef} style={{ width: '100%', maxWidth: 960 }}>
        {gamePhase === 'idle' && (
          <div style={OVERLAY_STYLE}>
            <p className="text-2xl font-black text-white">Připraven?</p>
            <p className="text-sm" style={{ color: 'rgba(209,250,229,0.5)' }}>
              Nastoupit na hřiště.
            </p>
            <button
              onClick={startCountdown}
              className="rounded-xl px-8 py-3 text-sm font-bold transition hover:opacity-90 active:scale-95"
              style={{ background: '#d6a94a', color: '#041f14' }}
            >
              Spustit zápas
            </button>

            {isMobile && (
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={handleFullscreen}
                  className="text-xs transition hover:opacity-80"
                  style={{ color: 'rgba(209,250,229,0.38)' }}
                >
                  ⛶ Celá obrazovka
                </button>
                {fsStatus === 'unavailable' && (
                  <p className="text-[10px]" style={{ color: 'rgba(209,250,229,0.3)' }}>
                    Celá obrazovka není v tomto prohlížeči dostupná.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {gamePhase === 'countdown' && (
          <div style={OVERLAY_STYLE}>
            <p
              className="font-black leading-none"
              style={{
                fontSize: countdownNum === 0 ? 80 : 140,
                color: countdownNum === 0 ? '#d6a94a' : 'white',
              }}
            >
              {countdownText}
            </p>
          </div>
        )}

        {gamePhase === 'playing' && (
          <div
            style={{
              position: 'relative',
              touchAction: 'none',
              overscrollBehavior: 'contain',
              ...NO_SELECT,
            }}
            onTouchStart={(e) => { e.preventDefault(); }}
            onTouchMove={(e) => { e.preventDefault(); }}
          >
            <GameCanvas
              onMatchEnd={handleMatchEnd}
              onRestart={handleRestart}
              touchInputRef={touchRef}
            />

            {/* HTML overlay nad end screen canvasu — klikatelné i na mobilu */}
            {matchScore !== null && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: '11%',
                  gap: 8,
                }}
              >
                {/* × v pravém horním rohu canvas panelu */}
                <Link
                  href="/satna"
                  style={{
                    position: 'absolute',
                    top: '21%',
                    right: '23%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 16,
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    lineHeight: 1,
                  }}
                  aria-label="Zavřít a přejít do šatny"
                >
                  ×
                </Link>

                {/* Akční tlačítka */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Link
                    href="/satna"
                    style={{
                      background: '#d6a94a',
                      color: '#041f14',
                      padding: '11px 22px',
                      borderRadius: 10,
                      fontWeight: 'bold',
                      fontSize: 13,
                      textDecoration: 'none',
                      touchAction: 'manipulation',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    Zpět do šatny
                  </Link>
                  <button
                    onClick={handleRestart}
                    style={{
                      background: 'rgba(209,250,229,0.15)',
                      border: '1px solid rgba(209,250,229,0.35)',
                      color: 'white',
                      padding: '11px 22px',
                      borderRadius: 10,
                      fontWeight: 'bold',
                      fontSize: 13,
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    Odveta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isMobile && gamePhase === 'playing' && matchScore === null && (
        <MobileTouchControls touchRef={touchRef} />
      )}

      {matchScore !== null && (
        <div className="flex items-center gap-3 text-sm" style={{ minHeight: 36 }}>
          {saveState === 'idle' && (
            <button
              onClick={save}
              className="rounded-lg px-4 py-1.5 text-xs font-bold transition hover:opacity-90 active:scale-95"
              style={{ background: '#d6a94a', color: '#041f14' }}
            >
              Zapsat výsledek
            </button>
          )}

          {saveState === 'saving' && (
            <span className="text-xs" style={{ color: 'rgba(209,250,229,0.5)' }}>
              Zapisuji…
            </span>
          )}

          {saveState === 'saved' && (
            <>
              <span className="text-xs" style={{ color: '#6dbf8a' }}>
                Výsledek zapsán do zápisu utkání.
              </span>
              <button
                disabled
                className="rounded-lg px-4 py-1.5 text-xs font-bold opacity-30 cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
              >
                Výsledek už je zapsaný
              </button>
            </>
          )}

          {saveState === 'error' && (
            <button
              onClick={save}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold transition hover:opacity-90"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              Výsledek se nepodařilo zapsat. Zkus to znovu.
            </button>
          )}
        </div>
      )}
    </>
  );
}
