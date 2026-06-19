'use client';

export default function MatchCommentaryToast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(4,31,20,0.88)',
        border: '1px solid rgba(214,169,74,0.4)',
        borderRadius: 10,
        padding: '8px 18px',
        color: '#d6a94a',
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {message}
    </div>
  );
}
