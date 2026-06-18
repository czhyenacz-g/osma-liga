import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';

type OnlineMatchEvent = {
  id: string;
  type: string;
  matchSecond?: number | null;
  teamSide?: 'home' | 'away' | null;
  teamName?: string | null;
  homeScoreAfter?: number | null;
  awayScoreAfter?: number | null;
  message?: string | null;
};

type MatchUser = {
  id: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
};

type MatchClub = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  banner: string | null;
  logo: string | null;
};

type OnlineMatch = {
  id: string;
  gameCode: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winnerSide?: string | null;
  durationSeconds?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  finishReason: string;
  homeUser?: MatchUser | null;
  awayUser?: MatchUser | null;
  homeClub?: MatchClub | null;
  awayClub?: MatchClub | null;
  homeClubPoints?: number | null;
  awayClubPoints?: number | null;
  events: OnlineMatchEvent[];
};

async function fetchMatch(id: string): Promise<OnlineMatch | null> {
  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/online-matches/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<OnlineMatch>;
  } catch {
    return null;
  }
}

function formatMatchTime(seconds?: number | null): string {
  if (seconds === undefined || seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m} min ${s} s` : `${m} min`;
}

function formatClubPoints(points: number): string {
  if (points === 1) return '+1 bod pro klub';
  return `+${points} body pro klub`;
}

function winnerLabel(side?: string | null, home?: string, away?: string): string | null {
  if (side === 'home') return `Vítěz: ${home}`;
  if (side === 'away') return `Vítěz: ${away}`;
  if (side === 'draw') return 'Remíza';
  return null;
}

const EVENT_LABELS: Record<string, string> = {
  match_started: 'Výkop',
  goal: 'Gól',
  match_finished: 'Konec',
  foul: 'Faul',
  yellow_card: 'Žlutá karta',
  red_card: 'Červená karta',
  pause: 'Pauza',
  resume: 'Pokračování',
  disconnect: 'Odpojení',
  reconnect: 'Návrat',
  special_event: 'Událost',
};

const EVENT_FALLBACK: Record<string, string> = {
  match_started: 'Zápas začal.',
  goal: 'Gól.',
  match_finished: 'Zápas skončil.',
};

function eventIcon(type: string): string {
  if (type === 'goal') return '⚽';
  if (type === 'match_started') return '🟢';
  if (type === 'match_finished') return '🏁';
  return '·';
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const match = await fetchMatch(id);
  if (!match) {
    return { title: 'Zápas nenalezen | Osmá liga' };
  }
  return {
    title: `${match.homeTeamName} ${match.homeScore}:${match.awayScore} ${match.awayTeamName} | Osmá liga`,
    description: 'Detail online zápasu Osmé ligy včetně průběhu a gólů.',
  };
}

export default async function ZapasDetailPage({ params }: Props) {
  const { id } = await params;
  const match = await fetchMatch(id);

  if (!match) notFound();

  const winner = winnerLabel(match.winnerSide, match.homeTeamName, match.awayTeamName);

  const subtle: React.CSSProperties = { color: 'rgba(209,250,229,0.45)' };
  const gold: React.CSSProperties = { color: '#d6a94a' };
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(214,169,74,0.15)',
    borderRadius: 14,
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-10 gap-8"
      style={{ background: '#041f14' }}
    >
      {/* Zpět */}
      <div className="w-full max-w-lg">
        <Link href="/" className="text-xs transition hover:opacity-80" style={subtle}>
          ← Zpět na úvod
        </Link>
      </div>

      {/* Hlavička zápasu */}
      <div className="w-full max-w-lg flex flex-col gap-2 text-center">
        <p className="text-xs font-black uppercase tracking-widest" style={gold}>
          Detail zápasu
        </p>

        {/* Skóre */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="text-base font-bold text-white">{match.homeTeamName}</span>
          <span className="text-4xl font-black whitespace-nowrap" style={gold}>
            {match.homeScore}&thinsp;:&thinsp;{match.awayScore}
          </span>
          <span className="text-base font-bold text-white">{match.awayTeamName}</span>
        </div>

        {winner && (
          <p className="text-sm font-semibold" style={{ color: '#6dbf8a' }}>{winner}</p>
        )}

        <p className="text-xs" style={subtle}>
          Online zápas&nbsp;·&nbsp;kód&nbsp;
          <span className="font-mono font-bold text-white/70">{match.gameCode}</span>
        </p>
      </div>

      {/* Info karta */}
      <div className="w-full max-w-lg p-5 flex flex-col gap-2 text-sm" style={cardStyle}>
        <Row label="Začátek" value={formatDateTime(match.startedAt)} />
        <Row label="Konec" value={formatDateTime(match.finishedAt)} />
        <Row label="Délka" value={formatDuration(match.durationSeconds)} />
      </div>

      {/* Hráči a kluby */}
      <div className="w-full max-w-lg p-5 flex flex-col gap-3" style={cardStyle}>
        <p className="text-xs font-black uppercase tracking-widest" style={gold}>Hráči</p>
        <div className="flex items-center justify-between gap-3">
          <PlayerChip user={match.homeUser ?? null} teamName={match.homeTeamName} club={match.homeClub ?? null} clubPoints={match.homeClubPoints ?? null} />
          <span className="text-sm shrink-0" style={{ color: 'rgba(209,250,229,0.2)' }}>vs</span>
          <PlayerChip user={match.awayUser ?? null} teamName={match.awayTeamName} club={match.awayClub ?? null} clubPoints={match.awayClubPoints ?? null} align="right" />
        </div>
      </div>

      {/* Timeline */}
      <div className="w-full max-w-lg flex flex-col gap-3">
        <h2 className="text-xs font-black uppercase tracking-widest" style={gold}>
          Průběh zápasu
        </h2>

        {match.events.length === 0 ? (
          <p className="text-xs" style={subtle}>Průběh zápasu není k dispozici.</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {match.events.map((ev) => {
              const label = EVENT_LABELS[ev.type] ?? ev.type;
              const msg = ev.message ?? EVENT_FALLBACK[ev.type] ?? label;
              const isGoal = ev.type === 'goal';
              return (
                <li
                  key={ev.id}
                  className="flex items-start gap-3 px-4 py-2.5 rounded-lg"
                  style={{
                    background: isGoal
                      ? 'rgba(214,169,74,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: isGoal
                      ? '1px solid rgba(214,169,74,0.2)'
                      : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Čas */}
                  <span
                    className="shrink-0 font-mono text-xs w-10 pt-0.5"
                    style={{ color: 'rgba(209,250,229,0.4)' }}
                  >
                    {formatMatchTime(ev.matchSecond)}
                  </span>

                  {/* Ikona */}
                  <span className="shrink-0 text-sm leading-tight pt-0.5">
                    {eventIcon(ev.type)}
                  </span>

                  {/* Obsah */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {isGoal && ev.homeScoreAfter !== null && ev.homeScoreAfter !== undefined && (
                      <span className="text-sm font-black" style={gold}>
                        {ev.homeScoreAfter}&thinsp;:&thinsp;{ev.awayScoreAfter}
                      </span>
                    )}
                    <span className="text-xs text-white/80 break-words">{msg}</span>
                    {isGoal && ev.teamName && (
                      <span className="text-[10px]" style={{ color: 'rgba(209,250,229,0.4)' }}>
                        {ev.teamName}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/satna"
        className="inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold transition hover:opacity-90"
        style={{ background: '#d6a94a', color: '#041f14' }}
      >
        Nastoupit k zápasu
      </Link>
    </main>
  );
}

function PlayerChip({
  user,
  teamName,
  club,
  clubPoints,
  align = 'left',
}: {
  user: MatchUser | null;
  teamName: string;
  club: MatchClub | null;
  clubPoints: number | null;
  align?: 'left' | 'right';
}) {
  const name = user ? (user.globalName ?? user.username) : null;
  const avatarUrl = user?.avatarUrl ?? null;
  const clubName = club?.name ?? null;

  return (
    <div
      className="flex flex-col gap-1 min-w-0"
      style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}
    >
      {clubName ? (
        <span className="text-xs font-bold text-white/80 truncate max-w-[130px]">{clubName}</span>
      ) : (
        <span className="text-xs text-white/30 truncate max-w-[130px]">{teamName}</span>
      )}
      <div className="flex items-center gap-1.5" style={{ flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" width={20} height={20} className="rounded-full shrink-0" />
        )}
        <span className="text-xs truncate max-w-[120px]" style={{ color: name ? 'rgba(209,250,229,0.6)' : 'rgba(209,250,229,0.3)' }}>
          hráč: {name ?? 'anonymní'}
        </span>
      </div>
      {clubPoints !== null && (
        <span className="text-xs font-semibold" style={{ color: clubPoints > 0 ? '#6dbf8a' : 'rgba(209,250,229,0.35)' }}>
          {formatClubPoints(clubPoints)}
        </span>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-xs" style={{ color: 'rgba(209,250,229,0.4)' }}>{label}</span>
      <span className="text-xs text-white/80 text-right">{value}</span>
    </div>
  );
}
