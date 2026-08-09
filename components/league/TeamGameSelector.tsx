'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CLUBS } from '@/data/clubs';

const STORAGE_KEY = 'osmaliga:selectedClub';

export default function TeamGameSelector() {
  const [selectedSlug, setSelectedSlug] = useState(CLUBS[0].slug);

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

  const selectedClub = CLUBS.find((c) => c.slug === selectedSlug) ?? CLUBS[0];

  return (
    <div className="w-full">
      {/* Výběr klubu — horizontální pás, na mobilu swipe */}
      <div className="flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory sm:flex-wrap sm:justify-center sm:overflow-visible">
        {CLUBS.map((club) => {
          const active = club.slug === selectedSlug;
          return (
            <button
              key={club.id}
              type="button"
              onClick={() => selectClub(club.slug)}
              aria-pressed={active}
              className="flex shrink-0 snap-start flex-col items-center gap-2 rounded-xl px-3 py-3 transition"
              style={{
                minWidth: 92,
                background: active ? 'rgba(214,169,74,0.16)' : 'rgba(255,255,255,0.04)',
                border: active ? '2px solid #d6a94a' : '1px solid rgba(255,255,255,0.12)',
                boxShadow: active ? '0 0 18px rgba(214,169,74,0.3)' : undefined,
              }}
            >
              <Image src={club.banner} alt={club.name} width={56} height={56} className="object-contain" />
              <span
                className="max-w-[90px] text-center text-[11px] font-bold leading-tight"
                style={{ color: active ? '#f0c75e' : 'rgba(255,255,255,0.78)' }}
              >
                {club.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Volba herního režimu */}
      <div className="mt-9 text-center">
        <h2
          className="font-black uppercase text-white"
          style={{ fontSize: 'clamp(16px, 2.6vw, 22px)', letterSpacing: '-0.01em' }}
        >
          Jak chceš hrát za{' '}
          <span style={{ color: '#e3b94f' }}>{selectedClub.name}</span>?
        </h2>

        <div className="mx-auto mt-5 grid max-w-xl gap-4 sm:grid-cols-2">
          <Link
            href={`/hra/bot?club=${selectedClub.slug}`}
            className="flex flex-col items-center gap-1 rounded-2xl px-5 py-5 text-center transition hover:-translate-y-0.5 hover:opacity-95"
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
            className="flex flex-col items-center gap-1 rounded-2xl px-5 py-5 text-center transition hover:-translate-y-0.5 hover:opacity-95"
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
