'use client';

import { useState, useCallback } from 'react';
import MatchPageClient from '@/components/game/MatchPageClient';
import { VALID_MODES, MODE_CONFIG } from './botTestModes';
import type { BotTestMode } from './botTestModes';

interface Props {
  initialMode: BotTestMode;
  homeClubSlug?: string;
}

export default function BotTestClient({ initialMode, homeClubSlug }: Props) {
  const [runtimeMode, setRuntimeMode] = useState<BotTestMode>(initialMode);
  const [bounceTimeActive, setBounceTimeActive] = useState(false);

  const config = MODE_CONFIG[runtimeMode];

  const handleBounceTimeChange = useCallback((active: boolean) => {
    setBounceTimeActive(active);
  }, []);

  return (
    <>
      {/* Mode switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {VALID_MODES.map((m) => {
            const active = m === runtimeMode;
            return (
              <button
                key={m}
                onClick={() => setRuntimeMode(m)}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: `1px solid ${active ? 'rgba(109,191,138,0.7)' : 'rgba(109,191,138,0.2)'}`,
                  background: active ? 'rgba(109,191,138,0.15)' : 'transparent',
                  color: active ? '#6dbf8a' : 'rgba(209,250,229,0.4)',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 10, color: 'rgba(209,250,229,0.3)', fontFamily: 'monospace', margin: 0 }}>
          {config.description}
          {bounceTimeActive && (
            <span style={{ color: '#6dbf8a', marginLeft: 8 }}>· BOUNCE TIME!</span>
          )}
        </p>
      </div>

      <MatchPageClient
        homeClubSlug={homeClubSlug}
        disableOpponentAI={config.disableOpponentAI}
        matchDurationSeconds={config.matchDurationSeconds}
        gameplayProfile={config.gameplayProfile}
        enableBounceTimeDebug={config.enableBounceTimeDebug}
        onBounceTimeChange={handleBounceTimeChange}
      />
    </>
  );
}
