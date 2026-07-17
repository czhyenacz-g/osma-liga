'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTournamentFormat, getFormatLabel, getFormatDescription } from '@/lib/tournaments/format';

type CreateTournamentResponse = {
  ok: true;
  tournament: { publicCode: string };
};

export default function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [playerCount, setPlayerCount] = useState(4);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const format = getTournamentFormat(playerCount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Zadej název turnaje (alespoň 2 znaky).');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), playerCount }),
      });
      if (!res.ok) {
        setError('Nepodařilo se založit turnaj. Zkus to znovu.');
        return;
      }
      const data = await res.json() as CreateTournamentResponse;
      router.push(`/turnaj/${data.tournament.publicCode}`);
    } catch {
      setError('Nepodařilo se založit turnaj. Zkus to znovu.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <form
      onSubmit={(e) => { void handleSubmit(e); }}
      className="w-full max-w-md rounded-xl p-6 flex flex-col gap-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(214,169,74,0.2)' }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="tournament-name" className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d6a94a' }}>
          Název turnaje
        </label>
        <input
          id="tournament-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Např. Okresní derby 2026"
          className="w-full text-sm px-3 py-2.5 rounded-lg bg-transparent border text-white placeholder:text-white/25"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tournament-player-count" className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d6a94a' }}>
          Počet hráčů: {playerCount}
        </label>
        <input
          id="tournament-player-count"
          type="range"
          min={2}
          max={8}
          value={playerCount}
          onChange={(e) => setPlayerCount(Number(e.target.value))}
          className="w-full accent-[#d6a94a]"
        />
        <div className="flex justify-between text-[10px]" style={{ color: 'rgba(209,250,229,0.35)' }}>
          <span>2</span>
          <span>8</span>
        </div>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ background: 'rgba(214,169,74,0.08)', border: '1px solid rgba(214,169,74,0.2)' }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#6dbf8a' }}>
          Formát: {getFormatLabel(format)}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(209,250,229,0.6)' }}>
          {getFormatDescription(format)}
        </p>
      </div>

      <button
        type="submit"
        disabled={creating}
        className="w-full py-3 rounded-lg font-bold text-sm transition disabled:opacity-50"
        style={{ background: '#d6a94a', color: '#041f14' }}
      >
        {creating ? 'Zakládám...' : 'Založit turnaj'}
      </button>

      {error && (
        <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>
      )}
    </form>
  );
}
