'use client';
import { useEffect, useRef, useState } from 'react';
import type { BenchUiState } from '@/game/benchUi';
import { BENCH_DEPLOY_DURATION_MS } from '@/game/constants';

// Shared bench ("Lavička") panel for all three game modes — local bot game
// (MatchPageClient → local engine) and both online modes (OnlineGameClient →
// server 'deploy_bench_player'). The panel never decides that a deployment
// happened: it only renders `bench` as the engine reports it and asks via
// onActivate.

const NO_SELECT: React.CSSProperties = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
};

// After a request, the button stays disabled until the engine reports the
// deployment — or this long, so a rejected/lost request can be retried.
export const BENCH_REQUEST_PENDING_MS = 2000;

const DURATION_S = Math.round(BENCH_DEPLOY_DURATION_MS / 1000);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export default function BenchPanel({
  bench,
  onActivate,
  variant = 'inline',
  notice = null,
}: {
  bench: BenchUiState | null;
  onActivate: (playerId: string) => void;
  // inline: compact row under the pitch (desktop HUD).
  // floating: fixed touch button above PŘEP./KOP (mobile), clear of the D-pad.
  variant?: 'inline' | 'floating';
  // Short transient message, e.g. a server rejection.
  notice?: string | null;
}) {
  const [requestedAt, setRequestedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const phase = bench?.phase ?? null;
  const pending = phase === 'ready' && requestedAt !== null && now - requestedAt < BENCH_REQUEST_PENDING_MS;

  // Clear the pending flag once the engine moves on (or the window passes).
  useEffect(() => {
    if (phase !== 'ready') {
      setRequestedAt(null);
      return;
    }
    if (requestedAt === null) return;
    const t = setTimeout(() => setNow(Date.now()), BENCH_REQUEST_PENDING_MS);
    return () => clearTimeout(t);
  }, [phase, requestedAt]);

  const activateRef = useRef<() => void>(() => {});
  activateRef.current = () => {
    if (!bench || bench.phase !== 'ready' || pending) return;
    const t = Date.now();
    setRequestedAt(t);
    setNow(t);
    onActivate(bench.playerId);
  };

  // Key "1" (top row or numpad). One activation per physical press — held
  // key auto-repeat is ignored — and never while typing into a form field.
  // Doesn't touch WASD/arrows/Space/Q/R, so no existing control changes.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Digit1' && e.code !== 'Numpad1') return;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      activateRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!bench) return null;

  const floating = variant === 'floating';

  let title: string;
  let detail: string | null;
  if (bench.phase === 'ready') {
    title = 'Žolík z lavičky';
    detail = pending ? 'Volám žolíka…' : `Povolat na ${DURATION_S} s`;
  } else if (bench.phase === 'active') {
    title = 'Žolík je na hřišti';
    detail = bench.remainingMs !== null ? `Zbývá ${Math.max(0, Math.ceil(bench.remainingMs / 1000))} s` : null;
  } else {
    title = 'Žolík už má odpracováno';
    detail = null;
  }

  const palette =
    bench.phase === 'ready'
      ? { background: 'rgba(214,169,74,0.9)', border: '1px solid rgba(214,169,74,1)', color: '#041f14' }
      : bench.phase === 'active'
        ? { background: 'rgba(109,191,138,0.22)', border: '1px solid rgba(109,191,138,0.55)', color: '#d1fae5' }
        : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(209,250,229,0.45)' };

  const body = (
    <>
      <span style={{ fontSize: floating ? 12 : 12, fontWeight: 800, lineHeight: 1.15 }}>{title}</span>
      {detail && (
        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, lineHeight: 1.15 }}>{detail}</span>
      )}
    </>
  );

  const interactive = bench.phase === 'ready';
  const statusStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: floating ? 'column' : 'row',
    alignItems: floating ? 'flex-start' : 'center',
    gap: floating ? 2 : 8,
    padding: floating ? '8px 12px' : '6px 12px',
    minHeight: floating ? 48 : 34,
    borderRadius: 10,
    touchAction: 'manipulation',
    textAlign: 'left',
    ...palette,
    ...NO_SELECT,
  };

  const control = interactive ? (
    <button
      type="button"
      onClick={() => activateRef.current()}
      disabled={pending}
      aria-label={`Povolat žolíka z lavičky na ${DURATION_S} sekund${floating ? '' : ' (klávesa 1)'}`}
      style={{ ...statusStyle, cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.75 : 1 }}
    >
      {body}
      {!floating && (
        <kbd
          aria-hidden="true"
          style={{
            fontFamily: 'inherit',
            fontSize: 10,
            fontWeight: 800,
            padding: '1px 6px',
            borderRadius: 4,
            background: 'rgba(4,31,20,0.18)',
            border: '1px solid rgba(4,31,20,0.35)',
          }}
        >
          1
        </kbd>
      )}
    </button>
  ) : (
    <div style={statusStyle}>{body}</div>
  );

  return (
    <div
      role="group"
      aria-label="Lavička"
      data-bench-phase={bench.phase}
      style={
        floating
          ? { position: 'fixed', right: 12, bottom: 156, zIndex: 40, maxWidth: 150, ...NO_SELECT }
          : {
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 10,
              maxWidth: '100%',
              ...NO_SELECT,
            }
      }
    >
      {!floating && (
        <span
          style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(209,250,229,0.5)' }}
        >
          Lavička
        </span>
      )}
      <div aria-live="polite">{control}</div>
      {notice && (
        <span role="status" style={{ display: 'block', marginTop: floating ? 4 : 0, fontSize: 11, color: '#f0c75e' }}>
          {notice}
        </span>
      )}
    </div>
  );
}
