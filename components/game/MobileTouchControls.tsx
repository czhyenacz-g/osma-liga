'use client';
import type { MutableRefObject } from 'react';
import type { TouchInput } from '@/game/types';

const BTN = 48;
const GAP = 4;

const BASE_BTN: React.CSSProperties = {
  width: BTN,
  height: BTN,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.13)',
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: 8,
  color: 'white',
  fontSize: 18,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'none',
  cursor: 'default',
  WebkitTouchCallout: 'none',
};

function Btn({
  label,
  onStart,
  onEnd,
  style,
}: {
  label: string;
  onStart: () => void;
  onEnd: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      style={{ ...BASE_BTN, ...style }}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        onStart();
      }}
      onPointerUp={(e) => { e.preventDefault(); onEnd(); }}
      onPointerCancel={() => onEnd()}
      onPointerLeave={() => onEnd()}
    >
      {label}
    </button>
  );
}

export default function MobileTouchControls({
  touchRef,
}: {
  touchRef: MutableRefObject<TouchInput>;
}) {
  const t = touchRef.current;

  return (
    <>
      {/* D-pad — levý dolní roh */}
      <div
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          zIndex: 40,
          display: 'grid',
          gridTemplateColumns: `${BTN}px ${BTN}px ${BTN}px`,
          gridTemplateRows: `${BTN}px ${BTN}px ${BTN}px`,
          gap: GAP,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Řádek 1 */}
        <div />
        <Btn label="▲" onStart={() => { t.up = true; }} onEnd={() => { t.up = false; }} />
        <div />
        {/* Řádek 2 */}
        <Btn label="◀" onStart={() => { t.left = true; }} onEnd={() => { t.left = false; }} />
        <div
          style={{
            width: BTN,
            height: BTN,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
          }}
        />
        <Btn label="▶" onStart={() => { t.right = true; }} onEnd={() => { t.right = false; }} />
        {/* Řádek 3 */}
        <div />
        <Btn label="▼" onStart={() => { t.down = true; }} onEnd={() => { t.down = false; }} />
        <div />
      </div>

      {/* KOP — pravý dolní roh */}
      <button
        type="button"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 40,
          width: 76,
          height: 76,
          borderRadius: '50%',
          background: 'rgba(214,169,74,0.8)',
          border: '2px solid rgba(214,169,74,0.95)',
          color: '#041f14',
          fontWeight: 'bold',
          fontSize: 15,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          cursor: 'default',
          WebkitTouchCallout: 'none',
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
          t.kick = true;
        }}
        onPointerUp={(e) => { e.preventDefault(); t.kick = false; }}
        onPointerCancel={() => { t.kick = false; }}
        onPointerLeave={() => { t.kick = false; }}
      >
        <span>KOP</span>
        <span style={{ fontSize: 9, opacity: 0.65 }}>střela</span>
      </button>
    </>
  );
}
