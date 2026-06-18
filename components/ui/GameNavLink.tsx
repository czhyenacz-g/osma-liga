import Link from 'next/link';

export default function GameNavLink() {
  return (
    <div className="w-full max-w-lg">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold transition hover:opacity-80"
        style={{ color: '#d6a94a' }}
      >
        <span style={{ fontSize: 15 }}>⚽</span>
        Osmá liga
      </Link>
    </div>
  );
}
