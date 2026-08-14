'use client';
import type { BenchPlayerUiState } from './GameCanvas';

const NO_SELECT: React.CSSProperties = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
};

function formatRemaining(ms: number): string {
  return `${Math.ceil(ms / 1000)}s`;
}

export default function BenchPanel({
  benchPlayers,
  onActivate,
}: {
  benchPlayers: BenchPlayerUiState[];
  onActivate: (id: string) => void;
}) {
  if (benchPlayers.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Střídačka"
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        ...NO_SELECT,
      }}
    >
      {benchPlayers.map((p) => {
        const available = p.matchStatus === 'bench' && !p.used;
        const deployed = p.matchStatus === 'temporarily_deployed';
        // Remaining case: matchStatus === 'bench' && p.used — grayed out below.

        const baseStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 'bold',
          touchAction: 'manipulation',
          ...NO_SELECT,
        };

        if (available) {
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onActivate(p.id)}
              aria-label={`Nastoupit ze střídačky: ${p.label}`}
              style={{
                ...baseStyle,
                background: 'rgba(214,169,74,0.85)',
                border: '1px solid rgba(214,169,74,0.95)',
                color: '#041f14',
                cursor: 'pointer',
              }}
            >
              <span>{p.label}</span>
              <span style={{ opacity: 0.75, fontWeight: 'normal' }}>Nastoupit</span>
            </button>
          );
        }

        if (deployed) {
          return (
            <div
              key={p.id}
              style={{
                ...baseStyle,
                background: 'rgba(109,191,138,0.25)',
                border: '1px solid rgba(109,191,138,0.5)',
                color: '#d1fae5',
              }}
            >
              <span>{p.label}</span>
              <span style={{ opacity: 0.85, fontWeight: 'normal' }}>
                {p.remainingMs !== null ? formatRemaining(p.remainingMs) : ''}
              </span>
            </div>
          );
        }

        // usedUp — grayed out, not clickable
        return (
          <div
            key={p.id}
            style={{
              ...baseStyle,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(209,250,229,0.35)',
            }}
          >
            <span>{p.label}</span>
            <span style={{ opacity: 0.7, fontWeight: 'normal' }}>Vyčerpáno</span>
          </div>
        );
      })}
    </div>
  );
}
