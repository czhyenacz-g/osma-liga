'use client';

import { useState } from 'react';
import { whistleSounds, type WhistleSound } from '@/data/whistleSounds';

// ── Web Audio whistle engine ─────────────────────────────────────────────────

type Whistle = {
  freq: number;      // base frequency Hz (2600–3800)
  dur: number;       // total duration seconds
  gap?: number;      // pause after this note (default 0.05)
  vol?: number;      // peak volume 0–1 (default 0.42)
  vibrato?: number;  // vibrato depth Hz (default 30); set 0 to disable
  noise?: boolean;   // add breathed noise burst via highpass
  descend?: boolean; // frequency drops ~18% over duration
};

function playPattern(pattern: Whistle[]) {
  const AudioCtxClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtxClass();
  let t = ctx.currentTime + 0.04;

  for (const w of pattern) {
    const vol    = w.vol    ?? 0.42;
    const vDepth = w.vibrato ?? 30;
    const attack = 0.015;
    const holdEnd = t + w.dur * 0.72;
    const end = t + w.dur;

    // Main oscillator
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(w.freq, t);
    if (w.descend) {
      osc.frequency.exponentialRampToValueAtTime(w.freq * 0.82, end);
    }

    // Vibrato LFO
    if (vDepth > 0) {
      const lfo      = ctx.createOscillator();
      const lfoGain  = ctx.createGain();
      lfo.frequency.value  = 11;
      lfoGain.gain.value   = vDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(end + 0.05);
    }

    // ADSR envelope
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + attack);
    gain.gain.setValueAtTime(vol, holdEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(end + 0.05);

    // Optional noise burst (wet/tired/atmospheric whistles)
    if (w.noise) {
      const bufSize   = Math.ceil(ctx.sampleRate * (w.dur + 0.05));
      const buf       = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data      = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noise     = ctx.createBufferSource();
      noise.buffer    = buf;
      const hpf       = ctx.createBiquadFilter();
      hpf.type        = 'highpass';
      hpf.frequency.value = 2200;
      const nGain     = ctx.createGain();
      nGain.gain.setValueAtTime(0.0001, t);
      nGain.gain.exponentialRampToValueAtTime(0.03, t + attack);
      nGain.gain.setValueAtTime(0.03, holdEnd);
      nGain.gain.exponentialRampToValueAtTime(0.0001, end);
      noise.connect(hpf);
      hpf.connect(nGain);
      nGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(end + 0.05);
    }

    t += w.dur + (w.gap ?? 0.05);
  }
}

const S = 3000;  // standard
const H = 3500;  // high
const L = 2750;  // low

const TONE_MAP: Record<string, Whistle[]> = {
  kickoff:               [{ freq: S,    dur: 0.18, noise: true }],
  restart:               [{ freq: H,    dur: 0.09 }],
  common_foul:           [{ freq: S,    dur: 0.20, vol: 0.44 }],
  hard_foul:             [{ freq: S,    dur: 0.55, vol: 0.50, noise: true }],
  yellow_card:           [{ freq: S,    dur: 0.22, vol: 0.44 }],
  red_card:              [{ freq: L,    dur: 0.80, vol: 0.54, noise: true }],
  strict_referee:        [{ freq: 2850, dur: 0.28, vol: 0.50, vibrato: 15 }],
  advantage:             [{ freq: H, dur: 0.09, gap: 0.10 }, { freq: H, dur: 0.09 }],
  did_not_see:           [{ freq: S, dur: 0.14, gap: 0.05, vol: 0.24 }, { freq: L, dur: 0.09, vol: 0.20 }],
  what_was_that:         [{ freq: S, dur: 0.15, gap: 0.38 }, { freq: H, dur: 0.07, vol: 0.22 }],
  panic:                 [
    { freq: H,    dur: 0.07, gap: 0.08 },
    { freq: H,    dur: 0.07, gap: 0.08 },
    { freq: H,    dur: 0.07, gap: 0.08 },
    { freq: S,    dur: 0.28, vol: 0.46 },
  ],
  dive_accepted:         [{ freq: S, dur: 0.16, gap: 0.28 }, { freq: L, dur: 0.14, vol: 0.28 }],
  dive_spotted:          [{ freq: S,    dur: 0.22, vol: 0.48 }],
  time_wasting:          [{ freq: S,    dur: 0.85, vol: 0.32 }],
  village_whistle:       [{ freq: 2820, dur: 0.18, vol: 0.30, vibrato: 55, noise: true }],
  wet_whistle:           [{ freq: 2650, dur: 0.10, gap: 0.04, vol: 0.18, noise: true }, { freq: 2900, dur: 0.18, vol: 0.28, noise: true }],
  sad_whistle:           [{ freq: S,    dur: 0.45, vol: 0.28, descend: true, vibrato: 18 }],
  happy_whistle:         [{ freq: 3750, dur: 0.11, vol: 0.34 }],
  distant_whistle:       [{ freq: S,    dur: 0.18, vol: 0.12, vibrato: 8 }],
  tired_referee:         [{ freq: 2620, dur: 0.18, gap: 0.08, vol: 0.16, noise: true }, { freq: 2850, dur: 0.22, vol: 0.26 }],
  full_time_double_long:    [{ freq: S, dur: 0.35, gap: 0.45 }, { freq: S, dur: 0.35 }],
  full_time_triple_classic: [
    { freq: S, dur: 0.22, gap: 0.18 },
    { freq: S, dur: 0.22, gap: 0.18 },
    { freq: S, dur: 0.65, vol: 0.46, noise: true },
  ],
  full_time_tired:          [{ freq: 2820, dur: 0.28, gap: 0.50, vol: 0.24, noise: true }, { freq: 2820, dur: 0.22, vol: 0.22 }],
  full_time_chaos:          [
    { freq: S, dur: 0.14, gap: 0.08 },
    { freq: S, dur: 0.14, gap: 0.28 },
    { freq: L, dur: 0.75, vol: 0.48, noise: true },
  ],
};

function playWhistle(id: string) {
  const pattern = TONE_MAP[id];
  if (pattern) playPattern(pattern);
}

// ── UI ────────────────────────────────────────────────────────────────────────

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
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    playWhistle(s.id);
    setPlaying(true);
    setTimeout(() => setPlaying(false), 600);
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

      {/* Tlačítko */}
      <button
        onClick={handlePlay}
        style={{
          background: playing ? '#6dbf8a' : 'rgba(109,191,138,0.15)',
          border: '1px solid rgba(109,191,138,0.35)',
          color: playing ? '#041f14' : '#6dbf8a',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background 0.15s, color 0.15s',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {playing ? '▶' : 'Přehrát'}
      </button>
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
            Vývojová stránka — není v hlavní navigaci. Zvuky se zatím nenapojují do hry.
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
