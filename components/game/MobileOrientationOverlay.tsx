const STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: '#041f14',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: 32,
  textAlign: 'center',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
};

export default function MobileOrientationOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div style={STYLE}>
      <span style={{ fontSize: 52, lineHeight: 1 }}>↻</span>
      <p className="text-xl font-bold text-white">Otoč telefon na šířku.</p>
      <p className="text-sm" style={{ color: 'rgba(209,250,229,0.5)' }}>
        Okresní fotbal se na výšku nevejde.
      </p>
    </div>
  );
}
