'use client';

import { useEffect, useState } from 'react';
import {
  getPlayerVisualTemplate,
  setPlayerVisualTemplate,
  onPlayerVisualTemplateChange,
} from '@/game/presentation/playerVisualSettings';
import { DEFAULT_PLAYER_VISUAL_TEMPLATE, type PlayerVisualTemplate } from '@/game/presentation/playerVisualTemplate';

const OPTIONS: { value: PlayerVisualTemplate; label: string }[] = [
  { value: 'pixel-characters', label: 'Pixel postavičky' },
  { value: 'minimal-circles', label: 'Minimalistické kruhy' },
  { value: 'legacy', label: 'Původní symboly' },
];

// Visible on every game page (training, bot, bot-team, bounce, bot-test,
// multiplayer) — a fixed corner control, opposite SoundToggleButton, so it
// never overlaps game controls or sits inside the pitch itself. Switching is
// instant and purely local: it only ever writes to
// game/presentation/playerVisualSettings.ts, which no game engine or
// network code reads — the running match, score, active player, positions,
// and any multiplayer connection are completely unaffected (see
// resolvePlayerRenderState.ts, which is the only consumer).
export default function PlayerVisualTemplateSwitcher() {
  // Starts at the safe default during SSR/hydration, synced from the stored
  // preference on mount — same pattern as SoundToggleButton/whistleEngine.
  const [template, setTemplate] = useState<PlayerVisualTemplate>(DEFAULT_PLAYER_VISUAL_TEMPLATE);

  useEffect(() => {
    setTemplate(getPlayerVisualTemplate());
    return onPlayerVisualTemplateChange(setTemplate);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      {/* Compact segmented control — desktop / regular mobile widths */}
      <div
        className="hidden sm:flex"
        role="radiogroup"
        aria-label="Vzhled hráčů"
        style={{
          gap: 2,
          padding: 3,
          borderRadius: 999,
          background: 'rgba(4,31,20,0.85)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {OPTIONS.map((opt) => {
          const active = template === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.label}
              onClick={() => setPlayerVisualTemplate(opt.value)}
              style={{
                padding: '5px 9px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: 'none',
                background: active ? '#d6a94a' : 'transparent',
                color: active ? '#041f14' : 'rgba(255,255,255,0.65)',
              }}
            >
              {opt.value === 'pixel-characters' ? 'Pixel' : opt.value === 'minimal-circles' ? 'Kruhy' : 'Původní'}
            </button>
          );
        })}
      </div>

      {/* Select fallback — very small screens */}
      <label className="sm:hidden" style={{ display: 'block' }}>
        <span
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          Vzhled hráčů
        </span>
        <select
          value={template}
          onChange={(e) => setPlayerVisualTemplate(e.target.value as PlayerVisualTemplate)}
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 6px',
            borderRadius: 8,
            background: 'rgba(4,31,20,0.9)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
