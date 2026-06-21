'use client';
import type { MutableRefObject } from 'react';
import type { TouchInput } from '@/game/types';

const BTN = 48;
const GAP = 4;

const NO_SELECT: React.CSSProperties = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
};

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
  touchAction: 'none',
  cursor: 'default',
  ...NO_SELECT,
};

function Btn({
  label,
  ariaLabel,
  onStart,
  onEnd,
  style,
}: {
  label: string;
  ariaLabel: string;
  onStart: () => void;
  onEnd: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      draggable={false}
      aria-label={ariaLabel}
      style={{ ...BASE_BTN, ...style }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        onStart();
      }}
      onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); onEnd(); }}
      onPointerCancel={(e) => { e.stopPropagation(); onEnd(); }}
      onPointerLeave={(e) => { e.stopPropagation(); onEnd(); }}
      onTouchStart={(e) => { e.preventDefault(); }}
    >
      <span aria-hidden="true" style={NO_SELECT}>{label}</span>
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
          touchAction: 'none',
          ...NO_SELECT,
        }}
        onTouchStart={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      >
        {/* Řádek 1 */}
        <div />
        <Btn
          label="▲"
          ariaLabel="Nahoru"
          onStart={() => { t.up = true; }}
          onEnd={() => { t.up = false; }}
        />
        <div />
        {/* Řádek 2 */}
        <Btn
          label="◀"
          ariaLabel="Vlevo"
          onStart={() => { t.left = true; }}
          onEnd={() => { t.left = false; }}
        />
        <div
          style={{
            width: BTN,
            height: BTN,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
          }}
        />
        <Btn
          label="▶"
          ariaLabel="Vpravo"
          onStart={() => { t.right = true; }}
          onEnd={() => { t.right = false; }}
        />
        {/* Řádek 3 */}
        <div />
        <Btn
          label="▼"
          ariaLabel="Dolů"
          onStart={() => { t.down = true; }}
          onEnd={() => { t.down = false; }}
        />
        <div />
      </div>

      {/* PŘEP. — malé sekundární tlačítko nad KOP, nepřekáží D-padu ani hřišti */}
      <button
        type="button"
        draggable={false}
        aria-label="Přepnout hráče"
        style={{
          position: 'fixed',
          bottom: 100,
          right: 26,
          zIndex: 40,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.13)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          cursor: 'default',
          ...NO_SELECT,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          t.switchPlayer = true;
        }}
        onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); t.switchPlayer = false; }}
        onPointerCancel={(e) => { e.stopPropagation(); t.switchPlayer = false; }}
        onPointerLeave={(e) => { e.stopPropagation(); t.switchPlayer = false; }}
        onTouchStart={(e) => { e.preventDefault(); }}
      >
        <span aria-hidden="true" style={NO_SELECT}>↺</span>
        <span aria-hidden="true" style={{ fontSize: 7, opacity: 0.75, ...NO_SELECT }}>PŘEP.</span>
      </button>

      {/* KOP — pravý dolní roh */}
      <button
        type="button"
        draggable={false}
        aria-label="Kop"
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
          touchAction: 'none',
          cursor: 'default',
          ...NO_SELECT,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          t.kick = true;
        }}
        onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); t.kick = false; }}
        onPointerCancel={(e) => { e.stopPropagation(); t.kick = false; }}
        onPointerLeave={(e) => { e.stopPropagation(); t.kick = false; }}
        onTouchStart={(e) => { e.preventDefault(); }}
      >
        <span aria-hidden="true" style={NO_SELECT}>KOP</span>
        <span aria-hidden="true" style={{ fontSize: 9, opacity: 0.65, ...NO_SELECT }}>střela</span>
      </button>
    </>
  );
}
