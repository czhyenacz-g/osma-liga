'use client';

import { useState, useCallback } from 'react';
import MatchPageClient from '@/components/game/MatchPageClient';
import type { DribbleStatus } from '@/components/game/GameCanvas';
import { VALID_MODES, MODE_CONFIG, PHYSICS_OPTIONS, resolveBotTestProfile } from './botTestModes';
import type { BotTestMode, BotTestPhysics } from './botTestModes';

interface Props {
  initialMode: BotTestMode;
  initialPhysics: BotTestPhysics;
  homeClubSlug?: string;
}

// Small V3 indicator next to the physics select (never over the pitch).
const DRIBBLE_STATUS: Record<DribbleStatus, { label: string; color: string }> = {
  control: { label: 'vedení', color: '#6dbf8a' },
  prep: { label: 'příprava otočky', color: '#d6a94a' },
  loose: { label: 'míč volný', color: 'rgba(209,250,229,0.4)' },
};

export default function BotTestClient({ initialMode, initialPhysics, homeClubSlug }: Props) {
  const [runtimeMode, setRuntimeMode] = useState<BotTestMode>(initialMode);
  const [physics, setPhysics] = useState<BotTestPhysics>(initialPhysics);
  const [bounceTimeActive, setBounceTimeActive] = useState(false);
  const [dribbleStatus, setDribbleStatus] = useState<DribbleStatus>('loose');

  const config = MODE_CONFIG[runtimeMode];
  // Applied live to the running match (GameCanvas) — no restart.
  const gameplayProfile = resolveBotTestProfile(runtimeMode, physics);
  const physicsLocked = config.gameplayProfile !== 'classic';

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
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'monospace', color: 'rgba(209,250,229,0.55)' }}>
          Fyzika
          <select
            aria-label="Fyzika"
            data-physics-profile={gameplayProfile}
            value={physicsLocked ? 'classic' : physics}
            disabled={physicsLocked}
            onChange={(e) => {
              setPhysics(e.target.value as BotTestPhysics);
              // Hand the keyboard back to the game right away.
              e.target.blur();
            }}
            style={{
              fontSize: 11,
              padding: '2px 4px',
              borderRadius: 4,
              border: `1px solid ${physics !== 'classic' && !physicsLocked ? 'rgba(214,169,74,0.7)' : 'rgba(109,191,138,0.3)'}`,
              background: '#06291b',
              color: physics !== 'classic' && !physicsLocked ? '#d6a94a' : '#6dbf8a',
              fontFamily: 'monospace',
            }}
          >
            {PHYSICS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {physicsLocked && <span style={{ color: 'rgba(209,250,229,0.3)' }}>(bounce)</span>}
          {gameplayProfile === 'v3-dribble' && (
            <span data-dribble-status={dribbleStatus} style={{ color: DRIBBLE_STATUS[dribbleStatus].color, minWidth: 92 }}>
              · {DRIBBLE_STATUS[dribbleStatus].label}
            </span>
          )}
        </label>
        <p style={{ fontSize: 10, color: 'rgba(209,250,229,0.3)', fontFamily: 'monospace', margin: 0, textAlign: 'center' }}>
          Mění se hned, bez restartu · délka zápasu až po R
        </p>
      </div>

      <MatchPageClient
        homeClubSlug={homeClubSlug}
        disableOpponentAI={config.disableOpponentAI}
        matchDurationSeconds={config.matchDurationSeconds}
        gameplayProfile={gameplayProfile}
        enableBounceTimeDebug={config.enableBounceTimeDebug}
        onBounceTimeChange={handleBounceTimeChange}
        onDribbleStatusChange={setDribbleStatus}
      />
    </>
  );
}
