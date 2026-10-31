'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { playFullTimeWhistle, playKickoffWhistle, unlockAudio } from '@/lib/audio/whistleEngine';
import { inMatchAudio } from '@/game/audio/inMatchAudio';
import GameCanvas, { type BenchPlayerUiState, type BenchDeployRequest, type DribbleStatus } from './GameCanvas';
import MatchCommentaryToast from './MatchCommentaryToast';
import MobileTouchControls from './MobileTouchControls';
import MobileOrientationOverlay from './MobileOrientationOverlay';
import SoundToggleButton from './SoundToggleButton';
import BenchPanel from './BenchPanel';
import { resolveBenchUiState } from '@/game/benchUi';
import type { BenchRole } from '@/game/types';
import PlayerVisualTemplateSwitcher from '@/components/PlayerVisualTemplateSwitcher';
import BounceTimeOverlay from './BounceTimeOverlay';
import type { TouchInput } from '@/game/types';
import type { GameplayProfile } from '@/game/gameplayProfiles';
import { CLUBS } from '@/data/clubs';
import { firstGoalMessages, fullTimeMessages, substitutionMessages, pickRandomMessage } from '@/lib/game/matchCommentaryMessages';

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

interface Props {
  homeClubSlug?: string;
  // bot-dis training variant: away team AI disabled, longer match duration.
  disableOpponentAI?: boolean;
  matchDurationSeconds?: number;
  // Gameplay profile (see game/gameplayProfiles.ts) — /hra/bot passes
  // LIVE_GAMEPLAY_PROFILE, /hra/bot-dis and /hra/bot-test any; changes apply
  // live to the running match.
  gameplayProfile?: GameplayProfile;
  // Debug-only: lets the 'B' key trigger "Bounce Time!" — only set by
  // /hra/bot-dis, never by the regular /hra/bot page.
  enableBounceTimeDebug?: boolean;
  // Optional callback so a parent (e.g. BotTestClient) can react to
  // Bounce Time start/end without reaching into internal state.
  onBounceTimeChange?: (active: boolean) => void;
  // /hra/bot-test physics indicator (see GameCanvas).
  onDribbleStatusChange?: (status: DribbleStatus) => void;
}

export default function MatchPageClient({
  homeClubSlug, disableOpponentAI, matchDurationSeconds, gameplayProfile, enableBounceTimeDebug,
  onBounceTimeChange, onDribbleStatusChange,
}: Props) {
  const homeTeamName = (homeClubSlug && CLUBS.find((c) => c.slug === homeClubSlug)?.name) || 'Náhoda FC';
  const [matchScore, setMatchScore] = useState<{ home: number; away: number } | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
  const [countdownNum, setCountdownNum] = useState(3);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fsStatus, setFsStatus] = useState<'idle' | 'unavailable'>('idle');
  const [firstGoalMessage, setFirstGoalMessage] = useState<string | null>(null);
  const [substitutionMessage, setSubstitutionMessage] = useState<string | null>(null);
  const [fullTimeMessage, setFullTimeMessage] = useState<string | null>(null);
  const [bounceTimeActive, setBounceTimeActive] = useState(false);
  const [benchPlayers, setBenchPlayers] = useState<BenchPlayerUiState[]>([]);
  const touchRef = useRef<TouchInput>({ up: false, down: false, left: false, right: false, kick: false, switchPlayer: false });
  const benchDeployRequestRef = useRef<BenchDeployRequest | null>(null);
  const gameWrapperRef = useRef<HTMLDivElement>(null);
  const firstGoalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const substitutionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Countdown logic
  useEffect(() => {
    if (gamePhase !== 'countdown') return;
    if (countdownNum > 0) {
      const t = setTimeout(() => setCountdownNum((n) => n - 1), 1000);
      return () => clearTimeout(t);
    }
    // countdownNum === 0: "HRAJ!" is shown — play kickoff whistle immediately
    playKickoffWhistle();
    const t = setTimeout(() => setGamePhase('playing'), 700);
    return () => clearTimeout(t);
  }, [gamePhase, countdownNum]);

  const startCountdown = () => {
    void unlockAudio(); // pre-warm Tone.js AudioContext in user gesture handler
    inMatchAudio.unlock(); // same user gesture also unlocks the in-match SFX/ambient layer
    inMatchAudio.startLoop('ambientBase', 0.14);
    setCountdownNum(3);
    setGamePhase('countdown');
    setMatchScore(null);
  };

  const handleMatchEnd = useCallback((score: { home: number; away: number }) => {
    setMatchScore(score);
    setFullTimeMessage(pickRandomMessage(fullTimeMessages));
    playFullTimeWhistle();
    inMatchAudio.stopLoop('ambientBase', 800);
  }, []);

  const handleRestart = useCallback(() => {
    const t = touchRef.current;
    t.up = false; t.down = false; t.left = false; t.right = false; t.kick = false; t.switchPlayer = false;
    setMatchScore(null);
    setGamePhase('idle');
    if (firstGoalTimeoutRef.current) clearTimeout(firstGoalTimeoutRef.current);
    setFirstGoalMessage(null);
    if (substitutionTimeoutRef.current) clearTimeout(substitutionTimeoutRef.current);
    setSubstitutionMessage(null);
    setFullTimeMessage(null);
    setBounceTimeActive(false);
    setBenchPlayers([]);
    inMatchAudio.stopAll();
  }, []);

  const handleBenchActivate = useCallback((playerId: string, role: BenchRole) => {
    benchDeployRequestRef.current = { playerId, role };
  }, []);

  // Safety net: stop all in-match audio if this component unmounts mid-match
  // (e.g. navigating away) so a loop never keeps playing in the background.
  useEffect(() => {
    return () => {
      inMatchAudio.stopAll();
    };
  }, []);

  const handleFirstGoal = useCallback(() => {
    if (firstGoalTimeoutRef.current) clearTimeout(firstGoalTimeoutRef.current);
    setFirstGoalMessage(pickRandomMessage(firstGoalMessages));
    firstGoalTimeoutRef.current = setTimeout(() => setFirstGoalMessage(null), 2500);
  }, []);

  const handleSubstitution = useCallback(() => {
    if (substitutionTimeoutRef.current) clearTimeout(substitutionTimeoutRef.current);
    setSubstitutionMessage(pickRandomMessage(substitutionMessages));
    substitutionTimeoutRef.current = setTimeout(() => setSubstitutionMessage(null), 2500);
  }, []);

  const handleBounceTimeChange = useCallback((active: boolean) => {
    setBounceTimeActive(active);
    onBounceTimeChange?.(active);
  }, [onBounceTimeChange]);

  const handleFullscreen = async () => {
    const ok = await requestGameFullscreen(gameWrapperRef.current);
    if (!ok) setFsStatus('unavailable');
  };

  const countdownText = countdownNum > 0 ? String(countdownNum) : 'HRAJ!';

  return (
    <>
      <SoundToggleButton />
      <PlayerVisualTemplateSwitcher />
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

            <div className="mt-2 text-center" style={{ color: 'rgba(209,250,229,0.55)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(209,250,229,0.7)' }}>
                Jak se hraje
              </p>
              {isMobile ? (
                <div className="text-xs leading-relaxed">
                  <p>Pohyb: levý ovladač</p>
                  <p>Kop: tlačítko KOP (krátký ťuk = slabší, podrž = silnější)</p>
                  <p>Přepnutí hráče: tlačítko PŘEP.</p>
                  <p>Žolík z lavičky: tlačítka Útočník / Obránce vpravo nad PŘEP. (jednou za zápas, 30 s)</p>
                  <p className="mt-1.5">
                    Hra automaticky vybírá hráče nejblíž k míči. Tlačítkem PŘEP. si na chvíli vybereš jiného — s míčem pod kontrolou přihraje a přepne na příjemce.
                  </p>
                  <p className="mt-1.5">Otoč telefon na šířku, okresní fotbal se na výšku nevejde.</p>
                </div>
              ) : (
                <div className="text-xs leading-relaxed">
                  <p>Pohyb: WASD / šipky</p>
                  <p>Kop: mezerník (krátký ťuk = slabší, podrž = silnější)</p>
                  <p>Přepnutí hráče: Q</p>
                  <p>Žolík z lavičky: 1 = útočník, 2 = obránce (jednou za zápas, 30 s)</p>
                  <p className="mt-1.5">
                    Hra automaticky vybírá hráče nejblíž k míči. Klávesou Q si na chvíli vybereš jiného — s míčem pod kontrolou přihraje a přepne na příjemce.
                  </p>
                  <p className="mt-1.5">Cíl: dostat míč do brány</p>
                </div>
              )}
            </div>

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
              onFirstGoal={handleFirstGoal}
              onSubstitution={handleSubstitution}
              onBounceTimeChange={handleBounceTimeChange}
              onDribbleStatusChange={onDribbleStatusChange}
              touchInputRef={touchRef}
              homeTeamName={homeTeamName}
              disableOpponentAI={disableOpponentAI}
              matchDurationSeconds={matchDurationSeconds}
              gameplayProfile={gameplayProfile}
              enableBounceTimeDebug={enableBounceTimeDebug}
              benchDeployRequestRef={benchDeployRequestRef}
              onBenchStateChange={setBenchPlayers}
            />

            <MatchCommentaryToast message={matchScore === null ? (firstGoalMessage ?? substitutionMessage) : null} />
            <BounceTimeOverlay active={matchScore === null && bounceTimeActive} />

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
                      background: '#6dbf8a',
                      color: '#041f14',
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

      {gamePhase === 'playing' && matchScore === null && (
        <BenchPanel
          bench={resolveBenchUiState(benchPlayers.map((p) => ({ ...p, benchUsed: p.used, benchRole: p.role })))}
          onActivate={handleBenchActivate}
          variant={isMobile ? 'floating' : 'inline'}
        />
      )}

      {isMobile && gamePhase === 'playing' && matchScore === null && (
        <MobileTouchControls touchRef={touchRef} />
      )}

      {matchScore !== null && fullTimeMessage && (
        <p className="text-xs italic text-center max-w-sm" style={{ color: 'rgba(209,250,229,0.5)' }}>
          {fullTimeMessage}
        </p>
      )}
    </>
  );
}
