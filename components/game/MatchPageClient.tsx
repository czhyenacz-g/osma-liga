'use client';

import { useState, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import { MATCH_DURATION } from '@/game/constants';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function MatchPageClient() {
  const [matchScore, setMatchScore] = useState<{ home: number; away: number } | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const handleMatchEnd = useCallback((score: { home: number; away: number }) => {
    setMatchScore(score);
    setSaveState('idle');
  }, []);

  const handleRestart = useCallback(() => {
    setMatchScore(null);
    setSaveState('idle');
  }, []);

  const save = async () => {
    if (!matchScore) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/match-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: matchScore.home,
          awayScore: matchScore.away,
          durationSeconds: MATCH_DURATION,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  return (
    <>
      <div style={{ width: '100%', maxWidth: 960 }}>
        <GameCanvas onMatchEnd={handleMatchEnd} onRestart={handleRestart} />
      </div>

      {/* Save UI — visible only after match ends */}
      {matchScore !== null && (
        <div
          className="flex items-center gap-3 text-sm"
          style={{ minHeight: 36 }}
        >
          {saveState === 'idle' && (
            <button
              onClick={save}
              className="rounded-lg px-4 py-1.5 text-xs font-bold transition hover:opacity-90 active:scale-95"
              style={{ background: '#d6a94a', color: '#041f14' }}
            >
              Zapsat výsledek
            </button>
          )}

          {saveState === 'saving' && (
            <span className="text-xs" style={{ color: 'rgba(209,250,229,0.5)' }}>
              Zapisuji…
            </span>
          )}

          {saveState === 'saved' && (
            <>
              <span className="text-xs" style={{ color: '#6dbf8a' }}>
                Výsledek zapsán do zápisu utkání.
              </span>
              <button
                disabled
                className="rounded-lg px-4 py-1.5 text-xs font-bold opacity-30 cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
              >
                Výsledek už je zapsaný
              </button>
            </>
          )}

          {saveState === 'error' && (
            <button
              onClick={save}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold transition hover:opacity-90"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              Výsledek se nepodařilo zapsat. Zkus to znovu.
            </button>
          )}
        </div>
      )}
    </>
  );
}
