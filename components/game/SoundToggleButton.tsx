'use client';

import { useEffect, useState } from 'react';
import { isSoundMuted, setSoundMuted, onSoundMutedChange } from '@/lib/audio/whistleEngine';

export default function SoundToggleButton() {
  // Starts false during SSR/hydration; synced from localStorage on mount so
  // this stays consistent if rendered on more than one game page at once.
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isSoundMuted());
    return onSoundMutedChange(setMuted);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setSoundMuted(!muted)}
      aria-label={muted ? 'Zapnout zvuk' : 'Vypnout zvuk'}
      title={muted ? 'Zapnout zvuk' : 'Vypnout zvuk'}
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 50,
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.13)',
        border: '1px solid rgba(255,255,255,0.22)',
        color: 'white',
        fontSize: 16,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  );
}
