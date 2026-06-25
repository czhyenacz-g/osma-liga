'use client';
import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { TouchInput } from '@/game/types';

const BTN = 60;
const GAP = 6;
// Velikost vizuálního kříže (3 tlačítka + 2 mezery).
const PAD_VISUAL = BTN * 3 + GAP * 2;
// Reálná dotyková plocha je větší než vizuál a nemá mrtvé zóny.
const PAD_HIT = PAD_VISUAL + 40;
const PAD_OFFSET = (PAD_HIT - PAD_VISUAL) / 2;

type Dir = 'up' | 'down' | 'left' | 'right';

function sectorFromOffset(dx: number, dy: number): Dir {
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

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
  borderRadius: 10,
  color: 'white',
  fontSize: 22,
  touchAction: 'none',
  cursor: 'default',
  ...NO_SELECT,
};

// Čistě vizuální šipka kříže — vstup zajišťuje hitbox vrstva nad ní.
function Btn({ label, ariaLabel, style }: { label: string; ariaLabel: string; style?: React.CSSProperties }) {
  return (
    <div aria-hidden="true" title={ariaLabel} style={{ ...BASE_BTN, ...style }}>
      <span style={NO_SELECT}>{label}</span>
    </div>
  );
}

export default function MobileTouchControls({
  touchRef,
}: {
  touchRef: MutableRefObject<TouchInput>;
}) {
  const t = touchRef.current;
  const activePointers = useRef<Map<number, Dir>>(new Map());

  const recompute = () => {
    const dirs = activePointers.current;
    let up = false, down = false, left = false, right = false;
    dirs.forEach((d) => {
      if (d === 'up') up = true;
      else if (d === 'down') down = true;
      else if (d === 'left') left = true;
      else right = true;
    });
    t.up = up;
    t.down = down;
    t.left = left;
    t.right = right;
  };

  const dirFromEvent = (e: React.PointerEvent<HTMLDivElement>): Dir => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    return sectorFromOffset(dx, dy);
  };

  return (
    <>
      {/* D-pad — levý dolní roh */}
      <div
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          zIndex: 40,
          width: PAD_HIT,
          height: PAD_HIT,
        }}
      >
        {/* Vizuální kříž — čistě dekorativní, neovládá vstup */}
        <div
          style={{
            position: 'absolute',
            top: PAD_OFFSET,
            left: PAD_OFFSET,
            display: 'grid',
            gridTemplateColumns: `${BTN}px ${BTN}px ${BTN}px`,
            gridTemplateRows: `${BTN}px ${BTN}px ${BTN}px`,
            gap: GAP,
            pointerEvents: 'none',
            ...NO_SELECT,
          }}
        >
          {/* Řádek 1 */}
          <div />
          <Btn label="▲" ariaLabel="Nahoru" />
          <div />
          {/* Řádek 2 */}
          <Btn label="◀" ariaLabel="Vlevo" />
          <div
            style={{
              width: BTN,
              height: BTN,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
            }}
          />
          <Btn label="▶" ariaLabel="Vpravo" />
          {/* Řádek 3 */}
          <div />
          <Btn label="▼" ariaLabel="Dolů" />
          <div />
        </div>

        {/* Reálná dotyková plocha — velký čtverec bez mrtvých zón, rozdělený na 4 sektory */}
        <div
          role="group"
          aria-label="Směrové ovládání"
          style={{
            position: 'absolute',
            inset: 0,
            touchAction: 'none',
            ...NO_SELECT,
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            activePointers.current.set(e.pointerId, dirFromEvent(e));
            recompute();
          }}
          onPointerMove={(e) => {
            if (!activePointers.current.has(e.pointerId)) return;
            e.preventDefault();
            activePointers.current.set(e.pointerId, dirFromEvent(e));
            recompute();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            activePointers.current.delete(e.pointerId);
            recompute();
          }}
          onPointerCancel={(e) => {
            e.stopPropagation();
            activePointers.current.delete(e.pointerId);
            recompute();
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            activePointers.current.delete(e.pointerId);
            recompute();
          }}
          onTouchStart={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
        />
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
