'use client';

import { useState } from 'react';
import { whistleSounds, type WhistleSound } from '@/data/whistleSounds';
import { playSound } from '@/lib/audio/playSound';

function padNum(n: number) {
  return String(n).padStart(2, '0');
}

const CATEGORY_ORDER = [
  'Základní hra',
  'Fauly',
  'Karty',
  'Rozhodčí',
  'Rozhodčí / chaos',
  'Simulace zranění',
  'Atmosféra',
];

function groupByCategory(sounds: WhistleSound[]) {
  const map = new Map<string, WhistleSound[]>();
  for (const cat of CATEGORY_ORDER) map.set(cat, []);
  for (const s of sounds) {
    if (!map.has(s.category)) map.set(s.category, []);
    map.get(s.category)!.push(s);
  }
  return [...map.entries()].filter(([, v]) => v.length > 0);
}

function WhistleCard({ s }: { s: WhistleSound }) {
  const [playing, setPlaying]         = useState(false);
  const [playingTone, setPlayingTone] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    void playSound(`${padNum(s.number)}-webaudio`).finally(() => {
      setTimeout(() => setPlaying(false), 600);
    });
  };

  const handlePlayTone = () => {
    setPlayingTone(true);
    void playSound(`${padNum(s.number)}-tone`).finally(() => {
      setTimeout(() => setPlayingTone(false), 600);
    });
  };

  const btnBase: React.CSSProperties = {
    borderRadius: 8,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    width: 80,
    textAlign: 'center',
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(214,169,74,0.15)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      {/* Číslo */}
      <span
        style={{
          fontWeight: 900,
          fontSize: 11,
          color: '#d6a94a',
          opacity: 0.7,
          minWidth: 28,
          paddingTop: 2,
          letterSpacing: '0.05em',
        }}
      >
        #{String(s.number).padStart(2, '0')}
      </span>

      {/* Obsah */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 4 }}>
          {s.name}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(209,250,229,0.6)', lineHeight: 1.5, marginBottom: 6 }}>
          {s.description}
        </p>
        <p style={{ fontSize: 11, color: 'rgba(209,250,229,0.4)', marginBottom: 2 }}>
          Použití: {s.usage}
        </p>
        <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#6dbf8a', letterSpacing: '0.04em' }}>
          {s.pattern}
        </p>
      </div>

      {/* Tlačítka */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        <button
          onClick={handlePlay}
          style={{
            ...btnBase,
            background: playing ? '#6dbf8a' : 'rgba(109,191,138,0.15)',
            border: '1px solid rgba(109,191,138,0.35)',
            color: playing ? '#041f14' : '#6dbf8a',
          }}
        >
          {playing ? '▶' : 'WebAudio'}
        </button>
        <button
          onClick={handlePlayTone}
          style={{
            ...btnBase,
            background: playingTone ? '#d6a94a' : 'rgba(214,169,74,0.12)',
            border: '1px solid rgba(214,169,74,0.35)',
            color: playingTone ? '#041f14' : '#d6a94a',
          }}
        >
          {playingTone ? '▶' : 'Tone.js'}
        </button>
      </div>
    </div>
  );
}

function CategorySection({ name, sounds }: { name: string; sounds: WhistleSound[] }) {
  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(209,250,229,0.35)',
          marginBottom: 10,
          paddingLeft: 2,
        }}
      >
        {name}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sounds.map(s => <WhistleCard key={s.id} s={s} />)}
      </div>
    </div>
  );
}

export default function DevSoundPage() {
  const basic = whistleSounds.filter(s => s.section === 'basic');
  const matchEnd = whistleSounds.filter(s => s.section === 'match_end');
  const grouped = groupByCategory(basic);

  return (
    <main style={{ background: '#041f14', minHeight: '100vh', padding: '40px 16px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Hlavička */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', color: '#d6a94a', marginBottom: 8, textTransform: 'uppercase' }}>
            Dev &rarr; Sound
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 8 }}>
            Dev Soundboard
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(209,250,229,0.55)', marginBottom: 12 }}>
            Pískací laboratoř okresního fotbalu.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(209,250,229,0.3)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 12px', display: 'inline-block' }}>
            Vývojová stránka — testovací UI nad centrální sound bankou.
          </p>
        </div>

        {/* Sekce: Základní písknutí */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 6 }}>
            Základní písknutí
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(209,250,229,0.4)', marginBottom: 24 }}>
            {basic.length} typů &mdash; seřazeno podle herní situace
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {grouped.map(([cat, sounds]) => (
              <CategorySection key={cat} name={cat} sounds={sounds} />
            ))}
          </div>
        </section>

        {/* Oddělovač */}
        <div style={{ borderTop: '1px solid rgba(214,169,74,0.25)', marginBottom: 48, position: 'relative' }}>
          <span style={{
            position: 'absolute',
            top: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#041f14',
            padding: '0 12px',
            fontSize: 11,
            fontWeight: 700,
            color: '#d6a94a',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Konec zápasu
          </span>
        </div>

        {/* Sekce: Konec zápasu */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 6 }}>
            Konec zápasu
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(209,250,229,0.4)', marginBottom: 24 }}>
            {matchEnd.length} varianty finálního hvizdu
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matchEnd.map(s => <WhistleCard key={s.id} s={s} />)}
          </div>
        </section>

      </div>
    </main>
  );
}
