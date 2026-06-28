'use client';

export default function BounceTimeOverlay({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(4,31,20,0.9)',
        border: '1px solid rgba(109,191,138,0.5)',
        borderRadius: 10,
        padding: '8px 20px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 6,
      }}
    >
      <p style={{ color: '#6dbf8a', fontWeight: 'bold', fontSize: 15, margin: 0 }}>
        BOUNCE TIME!
      </p>
      <p style={{ color: 'rgba(209,250,229,0.7)', fontSize: 11, margin: '2px 0 0' }}>
        Okresní pinball. Hraj od mantinelu.
      </p>
    </div>
  );
}
