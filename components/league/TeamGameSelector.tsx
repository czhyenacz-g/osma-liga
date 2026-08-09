'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CLUBS } from '@/data/clubs';

const STORAGE_KEY = 'osmaliga:selectedClub';

interface TeamGameSelectorProps {
  /**
   * "default" — původní prezentace (wrap do víc řad na desktopu). Používá /demo-1.
   * "compact" — jedna horizontální řada se šipkami, menší karty, těsnější spacing. Používá /demo.
   */
  variant?: 'default' | 'compact';
}

export default function TeamGameSelector({ variant = 'default' }: TeamGameSelectorProps) {
  const [selectedSlug, setSelectedSlug] = useState(CLUBS[0].slug);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && CLUBS.some((c) => c.slug === saved)) {
      setSelectedSlug(saved);
    }
  }, []);

  function selectClub(slug: string) {
    setSelectedSlug(slug);
    window.localStorage.setItem(STORAGE_KEY, slug);
  }

  function scrollRow(direction: 1 | -1) {
    rowRef.current?.scrollBy({ left: direction * 260 });
  }

  const selectedClub = CLUBS.find((c) => c.slug === selectedSlug) ?? CLUBS[0];
  const compact = variant === 'compact';

  return (
    <div className="w-full">
      {/* Výběr klubu — horizontální pás, na mobilu swipe */}
      <div className={compact ? 'relative' : undefined}>
        {compact && (
          <button
            type="button"
            onClick={() => scrollRow(-1)}
            aria-label="Posunout kluby vlevo"
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-90 sm:flex"
            style={{
              width: 30,
              height: 30,
              background: 'rgba(4,31,20,0.85)',
              border: '1px solid rgba(214,169,74,0.35)',
              color: '#d6a94a',
              marginLeft: -4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2.5 4 7l5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div
          ref={rowRef}
          className={
            compact
              ? 'motion-safe:scroll-smooth motion-reduce:scroll-auto flex gap-2 overflow-x-auto px-1 pb-2 snap-x snap-mandatory sm:gap-2.5'
              : 'flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory sm:flex-wrap sm:justify-center sm:overflow-visible'
          }
        >
          {CLUBS.map((club) => {
            const active = club.slug === selectedSlug;
            return (
              <button
                key={club.id}
                type="button"
                onClick={() => selectClub(club.slug)}
                aria-pressed={active}
                className={
                  compact
                    ? 'relative flex shrink-0 snap-start flex-col items-center gap-1.5 rounded-lg px-2.5 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6a94a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#052e1a]'
                    : 'flex shrink-0 snap-start flex-col items-center gap-2 rounded-xl px-3 py-3 transition'
                }
                style={
                  compact
                    ? {
                        minWidth: 78,
                        background: active ? 'rgba(214,169,74,0.2)' : 'rgba(255,255,255,0.03)',
                        border: active ? '2px solid #d6a94a' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: active ? '0 0 22px rgba(214,169,74,0.45)' : undefined,
                        opacity: active ? 1 : 0.85,
                      }
                    : {
                        minWidth: 92,
                        background: active ? 'rgba(214,169,74,0.16)' : 'rgba(255,255,255,0.04)',
                        border: active ? '2px solid #d6a94a' : '1px solid rgba(255,255,255,0.12)',
                        boxShadow: active ? '0 0 18px rgba(214,169,74,0.3)' : undefined,
                      }
                }
              >
                {compact && active && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex items-center justify-center rounded-full"
                    style={{ width: 16, height: 16, background: '#d6a94a' }}
                    aria-hidden="true"
                  >
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="#052e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <Image
                  src={club.banner}
                  alt={club.name}
                  width={compact ? 44 : 56}
                  height={compact ? 44 : 56}
                  className="object-contain"
                />
                <span
                  className={compact ? 'max-w-[74px] text-center text-[10px] font-bold leading-tight' : 'max-w-[90px] text-center text-[11px] font-bold leading-tight'}
                  style={{ color: active ? '#f0c75e' : compact ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.78)' }}
                >
                  {club.name}
                </span>
              </button>
            );
          })}
        </div>

        {compact && (
          <button
            type="button"
            onClick={() => scrollRow(1)}
            aria-label="Posunout kluby vpravo"
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-90 sm:flex"
            style={{
              width: 30,
              height: 30,
              background: 'rgba(4,31,20,0.85)',
              border: '1px solid rgba(214,169,74,0.35)',
              color: '#d6a94a',
              marginRight: -4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5 2.5 10 7l-5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Volba herního režimu */}
      <div className={compact ? 'mt-4 text-center' : 'mt-9 text-center'}>
        <h2
          className="font-black uppercase text-white"
          style={{ fontSize: compact ? 'clamp(15px, 2.2vw, 19px)' : 'clamp(16px, 2.6vw, 22px)', letterSpacing: '-0.01em' }}
        >
          Jak chceš hrát za{' '}
          <span style={{ color: '#e3b94f' }}>{selectedClub.name}</span>?
        </h2>

        <div className={compact ? 'mx-auto mt-3 grid max-w-xl gap-3 sm:grid-cols-2' : 'mx-auto mt-5 grid max-w-xl gap-4 sm:grid-cols-2'}>
          <Link
            href={`/hra/bot?club=${selectedClub.slug}`}
            className={
              compact
                ? 'flex flex-col items-center gap-0.5 rounded-2xl px-5 py-4 text-center transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6dbf8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#052e1a]'
                : 'flex flex-col items-center gap-1 rounded-2xl px-5 py-5 text-center transition hover:-translate-y-0.5 hover:opacity-95'
            }
            style={{
              background: 'rgba(45,106,79,0.9)',
              border: '1px solid rgba(109,191,138,0.5)',
            }}
          >
            <span className="text-sm font-black uppercase tracking-wide text-white">
              Proti počítači
            </span>
            <span className="text-xs text-white/75">Rychlý zápas proti botovi.</span>
          </Link>

          <Link
            href={`/hra/multiplayer?club=${selectedClub.slug}`}
            className={
              compact
                ? 'flex flex-col items-center gap-0.5 rounded-2xl px-5 py-4 text-center transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c75e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#052e1a]'
                : 'flex flex-col items-center gap-1 rounded-2xl px-5 py-5 text-center transition hover:-translate-y-0.5 hover:opacity-95'
            }
            style={{
              background: '#d6a94a',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <span className="text-sm font-black uppercase tracking-wide" style={{ color: '#052e1a' }}>
              Online proti hráči
            </span>
            <span className="text-xs" style={{ color: 'rgba(5,46,26,0.75)' }}>
              Zahraj si online zápas s jiným hráčem.
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
