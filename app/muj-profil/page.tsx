import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { getMyPlayerProfile } from '@/lib/playerProfile';
import { formatPoints, formatMatches, formatGoalDifference } from '@/lib/format';
import GameNavLink from '@/components/ui/GameNavLink';

export const metadata: Metadata = {
  title: 'Můj profil',
  robots: { index: false, follow: false },
};

const cardBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(214,169,74,0.18)',
  borderRadius: 16,
};

const gold = { color: '#d6a94a' };
const subtle = { color: 'rgba(209,250,229,0.55)' };

export default async function MujProfilPage() {
  const session = await getSession();

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12 gap-8"
      style={{ background: '#041f14' }}
    >
      <GameNavLink />

      <div className="text-center max-w-md">
        <h1 className="text-3xl font-black text-white mb-2">Můj profil</h1>
        <p className="text-sm leading-relaxed" style={subtle}>
          Nejen klub má body — já jsem mu je přinesl.
        </p>
      </div>

      {!session ? (
        <LoginPrompt />
      ) : !session.osmaUserId ? (
        <ErrorCard message="Tvůj hráčský účet se ještě nepropojil s Osmou ligou. Zkus se znovu přihlásit přes Discord." />
      ) : (
        <ProfileContent userId={session.osmaUserId} sessionUsername={session.globalName ?? session.username} />
      )}

      <Link href="/" className="text-xs transition hover:opacity-80" style={{ color: 'rgba(209,250,229,0.35)' }}>
        &#8592; Zpět na web Osmé ligy
      </Link>
    </main>
  );
}

function LoginPrompt() {
  return (
    <div className="w-full max-w-md p-6 flex flex-col gap-4" style={cardBase}>
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={gold}>
          Přihlášení
        </p>
        <p className="text-sm leading-relaxed" style={subtle}>
          Svůj profil a osobní statistiky uvidíš po přihlášení přes Discord.
        </p>
      </div>
      <a
        href="/api/auth/login"
        className="inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition hover:opacity-90"
        style={{ background: '#d6a94a', color: '#041f14' }}
      >
        <svg width="16" height="12" viewBox="0 0 71 55" fill="currentColor" aria-hidden="true">
          <path d="M60.1 4.9A58.6 58.6 0 0 0 45.5.5a40.4 40.4 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.2 0A39.4 39.4 0 0 0 25.7.5 58.4 58.4 0 0 0 11.1 4.9C1.6 19.4-.9 33.4.3 47.2a58.8 58.8 0 0 0 17.9 9.1 43.4 43.4 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 36 0l1.5 1.1a38.6 38.6 0 0 1-6 2.9 43.3 43.3 0 0 0 3.8 6.2 58.6 58.6 0 0 0 17.9-9.1c1.5-15.4-2.4-29.3-10.5-41.2ZM23.8 37.9a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Zm23.3 0a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Z" />
        </svg>
        Přihlásit se přes Discord
      </a>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="w-full max-w-md p-6" style={cardBase}>
      <p className="text-sm leading-relaxed" style={subtle}>{message}</p>
    </div>
  );
}

async function ProfileContent({ userId, sessionUsername }: { userId: string; sessionUsername: string }) {
  const profile = await getMyPlayerProfile(userId);

  if (!profile) {
    return (
      <ErrorCard message="Profil se teď nepodařilo načíst. Zkus to prosím za chvíli znovu." />
    );
  }

  const { user, stats, clubs, recentMatches } = profile;
  const displayName = user.globalName ?? user.username ?? sessionUsername;

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      {/* Hráč + bilance */}
      <div className="p-6 flex flex-col gap-4" style={cardBase}>
        <div className="flex items-center gap-3">
          {user.avatarUrl && (
            <Image
              src={user.avatarUrl}
              alt={displayName}
              width={48}
              height={48}
              className="rounded-full"
              unoptimized
            />
          )}
          <div className="text-lg font-black text-white">{displayName}</div>
        </div>

        <p className="text-xs font-black uppercase tracking-widest" style={gold}>
          Okresní forma za posledních 30 dní
        </p>

        {stats.matches === 0 ? (
          <p className="text-sm" style={subtle}>
            Za posledních 30 dní jsi neodehrál žádný online zápas. Čas to napravit v šatně.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <StatRow label="Zápasy" value={String(stats.matches)} />
            <StatRow label="Body pro kluby" value={String(stats.clubPointsEarned)} highlight />
            <StatRow label="Výhry" value={String(stats.wins)} />
            <StatRow label="Remízy" value={String(stats.draws)} />
            <StatRow label="Prohry" value={String(stats.losses)} />
            <StatRow label="Skóre" value={`${stats.goalsFor}:${stats.goalsAgainst}`} />
            <StatRow label="Rozdíl skóre" value={formatGoalDifference(stats.goalDifference)} />
          </div>
        )}
      </div>

      {/* Kluby */}
      <div className="p-6 flex flex-col gap-3" style={cardBase}>
        <p className="text-xs font-black uppercase tracking-widest" style={gold}>
          Kluby, kterým jsem pomohl
        </p>
        {clubs.length === 0 ? (
          <p className="text-sm" style={subtle}>Zatím žádnému klubu nepřinesl žádné body.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {clubs.map((entry) => (
              <li key={entry.club.id}>
                <Link
                  href={`/kluby/${entry.club.slug}`}
                  className="flex items-center justify-between gap-2 text-sm hover:opacity-80 transition"
                >
                  <span className="font-bold text-white">{entry.club.shortName ?? entry.club.name}</span>
                  <span style={subtle}>
                    {formatPoints(entry.points)} · {formatMatches(entry.matches)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Poslední zápasy */}
      <div className="p-6 flex flex-col gap-3" style={cardBase}>
        <p className="text-xs font-black uppercase tracking-widest" style={gold}>
          Moje poslední zápasy
        </p>
        {recentMatches.length === 0 ? (
          <p className="text-sm" style={subtle}>Ještě jsi neodehrál žádný online zápas.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentMatches.map((match) => {
              const homeName = match.homeClub?.shortName ?? match.homeClub?.name ?? 'Domácí';
              const awayName = match.awayClub?.shortName ?? match.awayClub?.name ?? 'Hosté';
              return (
                <li key={match.id} className="flex flex-col gap-1 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-bold text-white truncate">{homeName}</span>
                    <span className="font-black" style={gold}>{match.homeScore} : {match.awayScore}</span>
                    <span className="font-bold text-white truncate">{awayName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span style={{ color: match.userClubPoints > 0 ? '#6dbf8a' : 'rgba(209,250,229,0.35)' }}>
                      {match.userClubPoints > 0 ? `+${match.userClubPoints} body pro klub` : 'Bez bodů pro klub'}
                    </span>
                    <Link href={`/zapasy/${match.id}`} className="font-semibold hover:opacity-80 transition" style={gold}>
                      Zobrazit zápas
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span style={subtle}>{label}</span>
      <span className={`font-bold tabular-nums ${highlight ? 'text-white text-base' : 'text-white/80'}`}>
        {value}
      </span>
    </div>
  );
}
