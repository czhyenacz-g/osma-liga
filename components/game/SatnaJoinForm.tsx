'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function SatnaJoinForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!normalized) {
      setError('Zadej kód zápasu.');
      return;
    }
    setError('');
    router.push(`/hra/online/${normalized}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          placeholder="např. AB3XY7"
          maxLength={12}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-mono font-bold uppercase bg-transparent border text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/60"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg text-sm font-bold transition hover:opacity-90"
          style={{ background: 'rgba(214,169,74,0.18)', color: '#d6a94a', border: '1px solid rgba(214,169,74,0.35)' }}
        >
          Připojit se
        </button>
      </div>
      {error && (
        <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
      )}
    </form>
  );
}
