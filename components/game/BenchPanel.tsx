'use client';
import { useEffect, useRef, useState } from 'react';
import type { BenchUiState } from '@/game/benchUi';
import type { BenchRole } from '@/game/types';
import { BENCH_DEPLOY_DURATION_MS } from '@/game/constants';

// Shared bench ("Lavička") panel for all three game modes — local bot game
// (MatchPageClient → local engine) and both online modes (OnlineGameClient →
// server 'deploy_bench_player'). The panel never decides that a deployment
// happened: it only renders `bench` as the engine reports it and asks via
// onActivate, with the role the žolík is called up as.

const NO_SELECT: React.CSSProperties = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
};

// After a request, the buttons stay disabled until the engine reports the
// deployment — or this long, so a rejected/lost request can be retried.
export const BENCH_REQUEST_PENDING_MS = 2000;

const DURATION_S = Math.round(BENCH_DEPLOY_DURATION_MS / 1000);

const ROLES: { role: BenchRole; label: string; key: string; codes: string[] }[] = [
  { role: 'attacker', label: 'Útočník', key: '1', codes: ['Digit1', 'Numpad1'] },
  { role: 'defender', label: 'Obránce', key: '2', codes: ['Digit2', 'Numpad2'] },
];

const ROLE_NAME: Record<BenchRole, string> = { attacker: 'útočník', defender: 'obránce' };
// Accusative for the aria-label ("povolat … jako útočníka / obránce").
const ROLE_ACC: Record<BenchRole, string> = { attacker: 'útočníka', defender: 'obránce' };

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
  onActivate: (playerId: string, role: BenchRole) => void;
  // inline: compact row under the pitch (desktop HUD).
  // floating: fixed touch buttons above PŘEP./KOP (mobile), clear of the D-pad.
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

  const activateRef = useRef<(role: BenchRole) => void>(() => {});
  activateRef.current = (role) => {
    if (!bench || bench.phase !== 'ready' || pending) return;
    const t = Date.now();
    setRequestedAt(t);
    setNow(t);
    onActivate(bench.playerId, role);
  };

  // Keys "1" = útočník, "2" = obránce (top row or numpad). One activation
  // per physical press — held-key auto-repeat is ignored — and never while
  // typing into a form field. Doesn't touch WASD/arrows/Space/Q/R.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const match = ROLES.find((r) => r.codes.includes(e.code));
      if (!match) return;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      activateRef.current(match.role);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!bench) return null;

  const floating = variant === 'floating';
  const roleName = bench.role ? ROLE_NAME[bench.role] : null;

  let title: string;
  let detail: string | null;
  if (bench.phase === 'ready') {
    // Floating (mobile) keeps it to one compact line above the buttons.
    title = floating ? `Žolík na ${DURATION_S} s` : 'Žolík z lavičky';
    detail = pending ? 'Volám žolíka…' : floating ? null : `Povolat na ${DURATION_S} s`;
  } else if (bench.phase === 'active') {
    title = roleName ? `Žolík (${roleName}) je na hřišti` : 'Žolík je na hřišti';
    detail = bench.remainingMs !== null ? `Zbývá ${Math.max(0, Math.ceil(bench.remainingMs / 1000))} s` : null;
  } else {
    title = 'Žolík už má odpracováno';
    detail = null;
  }

  const muted = bench.phase === 'active'
    ? { background: 'rgba(109,191,138,0.22)', border: '1px solid rgba(109,191,138,0.55)', color: '#d1fae5' }
    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(209,250,229,0.45)' };

  const boxStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: floating ? 'column' : 'row',
    alignItems: floating ? 'flex-start' : 'center',
    gap: floating ? 2 : 8,
    padding: floating ? '8px 12px' : '6px 12px',
    minHeight: floating ? 48 : 34,
    borderRadius: 10,
    textAlign: 'left',
    ...NO_SELECT,
  };

  const heading = (
    <>
      <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.15 }}>{title}</span>
      {detail && <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, lineHeight: 1.15 }}>{detail}</span>}
    </>
  );

  const buttons = bench.phase === 'ready' ? ROLES.map((r) => (
        <button
          key={r.role}
          type="button"
          onClick={() => activateRef.current(r.role)}
          disabled={pending}
          aria-label={`Povolat žolíka jako ${ROLE_ACC[r.role]} na ${DURATION_S} sekund${floating ? '' : ` (klávesa ${r.key})`}`}
          style={{
            ...boxStyle,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: floating ? 44 : 34,
            padding: floating ? '0 10px' : '6px 12px',
            fontSize: 12,
            fontWeight: 800,
            touchAction: 'manipulation',
            background: 'rgba(214,169,74,0.9)',
            border: '1px solid rgba(214,169,74,1)',
            color: '#041f14',
            cursor: pending ? 'wait' : 'pointer',
            opacity: pending ? 0.6 : 1,
          }}
        >
          <span>{r.label}</span>
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
              {r.key}
            </kbd>
          )}
        </button>
      )) : null;

  const content = buttons ? (
    <div style={{ display: 'flex', flexDirection: floating ? 'column' : 'row', alignItems: floating ? 'stretch' : 'center', gap: floating ? 4 : 6 }}>
      <div style={{ ...boxStyle, padding: floating ? '0 2px' : '0 4px', minHeight: 0, color: '#f0c75e' }}>
        {heading}
      </div>
      {floating ? <div style={{ display: 'flex', gap: 6 }}>{buttons}</div> : buttons}
    </div>
  ) : (
    <div style={{ ...boxStyle, ...muted }}>{heading}</div>
  );

  return (
    <div
      role="group"
      aria-label="Lavička"
      data-bench-phase={bench.phase}
      style={
        floating
          ? {
              position: 'fixed', right: 12, bottom: 156, zIndex: 40, maxWidth: 180,
              ...(bench.phase === 'ready'
                ? { background: 'rgba(4,31,20,0.72)', borderRadius: 12, padding: 6 }
                : {}),
              ...NO_SELECT,
            }
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
      <div aria-live="polite">{content}</div>
      {notice && (
        <span role="status" style={{ display: 'block', marginTop: floating ? 4 : 0, fontSize: 11, color: '#f0c75e' }}>
          {notice}
        </span>
      )}
    </div>
  );
}
