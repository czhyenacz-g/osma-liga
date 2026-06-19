import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';

export default async function AuthStatus() {
  const session = await getSession();

  if (session) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/muj-profil" className="flex items-center gap-2 hover:opacity-80 transition">
          {session.avatarUrl && (
            <Image
              src={session.avatarUrl}
              alt={session.globalName ?? session.username}
              width={28}
              height={28}
              className="rounded-full"
              unoptimized
            />
          )}
          <span className="hidden sm:block text-xs text-white/70 max-w-[96px] truncate">
            {session.globalName ?? session.username}
          </span>
        </Link>
        <form method="POST" action="/api/auth/logout">
          <button
            type="submit"
            className="text-xs text-white/40 hover:text-white/70 transition"
          >
            Odhlásit
          </button>
        </form>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/login"
      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition hover:opacity-90 shrink-0"
      style={{ background: '#d6a94a', color: '#041f14' }}
    >
      <DiscordIcon />
      Přihlásit
    </a>
  );
}

function DiscordIcon() {
  return (
    <svg width="14" height="11" viewBox="0 0 71 55" fill="currentColor" aria-hidden="true">
      <path d="M60.1 4.9A58.6 58.6 0 0 0 45.5.5a40.4 40.4 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.2 0A39.4 39.4 0 0 0 25.7.5 58.4 58.4 0 0 0 11.1 4.9C1.6 19.4-.9 33.4.3 47.2a58.8 58.8 0 0 0 17.9 9.1 43.4 43.4 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 36 0l1.5 1.1a38.6 38.6 0 0 1-6 2.9 43.3 43.3 0 0 0 3.8 6.2 58.6 58.6 0 0 0 17.9-9.1c1.5-15.4-2.4-29.3-10.5-41.2ZM23.8 37.9a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Zm23.3 0a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Z" />
    </svg>
  );
}
