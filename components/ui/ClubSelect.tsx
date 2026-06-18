'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { CLUBS } from '@/data/clubs';

interface Props {
  value: string;
  onChange: (slug: string) => void;
  label?: string;
}

export default function ClubSelect({ value, onChange, label = 'Tvůj klub' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = CLUBS.find((c) => c.slug === value) ?? CLUBS[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="flex flex-col gap-1.5 relative">
      <span className="text-xs" style={{ color: 'rgba(209,250,229,0.5)' }}>{label}</span>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 rounded-xl transition"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? 'rgba(214,169,74,0.6)' : 'rgba(214,169,74,0.3)'}`,
          padding: '10px 14px',
          outline: 'none',
        }}
      >
        {selected && (
          <div
            className="relative flex-shrink-0 overflow-hidden rounded-lg"
            style={{ width: 64, height: 40 }}
          >
            <Image
              src={selected.banner}
              alt={selected.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}
        <span className="flex-1 text-left text-sm font-bold text-white">{selected?.name}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            flexShrink: 0,
            color: 'rgba(214,169,74,0.7)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          <path d="M2 4.5L7 9.5L12 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50 flex flex-col"
          style={{
            background: '#0a1f14',
            border: '1px solid rgba(214,169,74,0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {CLUBS.map((c) => {
            const isActive = c.slug === value;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => { onChange(c.slug); setOpen(false); }}
                className="w-full flex items-center gap-3 text-left transition"
                style={{
                  padding: '9px 14px',
                  background: isActive ? 'rgba(214,169,74,0.12)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div
                  className="relative flex-shrink-0 overflow-hidden rounded-md"
                  style={{ width: 48, height: 30 }}
                >
                  <Image
                    src={c.banner}
                    alt={c.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: isActive ? '#d6a94a' : 'rgba(209,250,229,0.85)' }}
                >
                  {c.name}
                </span>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto flex-shrink-0">
                    <path d="M2 6L5 9L10 3" stroke="#d6a94a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
