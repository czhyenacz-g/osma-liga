'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GameNavLink from '@/components/ui/GameNavLink';
import { getFormatLabel, type TournamentFormat } from '@/lib/tournaments/format';

type TournamentTeam = {
  id: string;
  tournamentId: string;
  slotNumber: number;
  name: string;
  claimedByUserId: string | null;
  claimedAt: string | null;
};

type TournamentMatch = {
  id: string;
  tournamentId: string;
  phase: string;
  roundNumber: number;
  matchNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  status: string;
  onlineMatchId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

type TournamentStanding = {
  teamId: string;
  slotNumber: number;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type Tournament = {
  id: string;
  publicCode: string;
  name: string;
  createdByUserId: string;
  format: TournamentFormat;
  playerCount: number;
  status: string;
  winnerTeamId: string | null;
  finishedAt: string | null;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  standings: TournamentStanding[];
};

type TournamentResponse = { ok: true; tournament: Tournament };

type PlayMatchResponse = {
  ok: true;
  onlineMatchId: string;
  joinUrlPath: string;
  playerToken?: string;
  match: TournamentMatch;
  tournament: Tournament;
};

type CurrentUser = {
  osmaUserId: string | null;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
} | null;

const cardBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(214,169,74,0.2)',
  borderRadius: 16,
};

export default function TurnajDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [claimingTeamId, setClaimingTeamId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [playingMatchId, setPlayingMatchId] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);

  const fetchTournament = useCallback(async () => {
    try {
      // Backend lookup is case-insensitive, but the code in the URL is
      // already lowercase (see lib/tournaments/format.ts / tournamentService.ts
      // on the Hub API) — no normalisation needed here.
      const res = await fetch(`/api/tournaments/${code}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data = await res.json() as TournamentResponse;
        setTournament(data.tournament);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void fetchTournament();
  }, [fetchTournament]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json() as Promise<{ user: CurrentUser }>)
      .then(({ user }) => setCurrentUser(user))
      .catch(() => {});
  }, []);

  async function handleClaim(teamId: string) {
    setClaimingTeamId(teamId);
    setClaimError(null);
    try {
      const res = await fetch(`/api/tournaments/${code}/teams/${teamId}/claim`, {
        method: 'POST',
      });
      if (res.status === 401) {
        setClaimError('Přihlas se, abys mohl zabrat tým.');
        return;
      }
      if (res.status === 409) {
        setClaimError('Tým už je obsazený nebo už máš v turnaji jiný tým.');
        return;
      }
      if (!res.ok) {
        setClaimError('Nepodařilo se zabrat tým. Zkus to znovu.');
        return;
      }
      const data = await res.json() as TournamentResponse;
      setTournament(data.tournament);
    } catch {
      setClaimError('Nepodařilo se zabrat tým. Zkus to znovu.');
    } finally {
      setClaimingTeamId(null);
    }
  }

  async function handleStart() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/tournaments/${code}/start`, { method: 'POST' });
      if (res.status === 401) {
        setStartError('Přihlas se, abys mohl spustit turnaj.');
        return;
      }
      if (res.status === 403) {
        setStartError('Turnaj může spustit jen jeho zakladatel.');
        return;
      }
      if (res.status === 409) {
        setStartError('Turnaj zatím nejde spustit. Zkontroluj obsazení týmů.');
        return;
      }
      if (!res.ok) {
        setStartError('Turnaj se nepodařilo spustit. Zkus to znovu.');
        return;
      }
      const data = await res.json() as TournamentResponse;
      setTournament(data.tournament);
    } catch {
      setStartError('Turnaj se nepodařilo spustit. Zkus to znovu.');
    } finally {
      setStarting(false);
    }
  }

  async function handlePlay(matchId: string) {
    setPlayingMatchId(matchId);
    setPlayError(null);
    try {
      const res = await fetch(`/api/tournaments/${code}/matches/${matchId}/play`, { method: 'POST' });
      if (res.status === 401) {
        setPlayError('Přihlas se, abys mohl hrát turnajový zápas.');
        return;
      }
      if (res.status === 403) {
        setPlayError('Tento zápas můžou spustit jen hráči přihlášení k daným týmům.');
        return;
      }
      if (res.status === 409) {
        setPlayError('Zápas teď nejde spustit. Obnov stránku a zkontroluj stav turnaje.');
        return;
      }
      if (!res.ok) {
        setPlayError('Zápas se nepodařilo připravit. Zkus to znovu.');
        return;
      }
      const data = await res.json() as PlayMatchResponse;
      setTournament(data.tournament);
      // Mirrors the regular online-games lobby flow (see
      // components/online/OnlineLobbyPage.tsx) — only present when this call
      // just created the room (we're the first player in); the existing
      // /hra/online/[code] page handles the no-token case with its own
      // "connect as guest" button.
      if (data.playerToken && typeof window !== 'undefined') {
        sessionStorage.setItem(`osma-lobby-host-token-${data.onlineMatchId}`, data.playerToken);
      }
      router.push(data.joinUrlPath);
    } catch {
      setPlayError('Zápas se nepodařilo připravit. Zkus to znovu.');
    } finally {
      setPlayingMatchId(null);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — nelze kopírovat
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#041f14' }}>
        <p className="text-sm" style={{ color: 'rgba(209,250,229,0.45)' }}>Načítám turnaj...</p>
      </main>
    );
  }

  if (notFound || !tournament) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-4" style={{ background: '#041f14' }}>
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">🏆</p>
          <h1 className="text-lg font-bold text-white mb-2">Turnaj nenalezen</h1>
          <p className="text-sm" style={{ color: 'rgba(209,250,229,0.5)' }}>
            Tenhle kód neexistuje, nebo si ho vymyslel soupeř.
          </p>
        </div>
        <Link href="/turnaj" className="text-sm font-semibold transition hover:opacity-80" style={{ color: '#d6a94a' }}>
          ← Založit nový turnaj
        </Link>
      </main>
    );
  }

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/turnaj/${tournament.publicCode}`;
  const myUserId = currentUser?.osmaUserId ?? null;
  const myTeam = myUserId ? tournament.teams.find((t) => t.claimedByUserId === myUserId) ?? null : null;
  const isCreator = myUserId !== null && myUserId === tournament.createdByUserId;
  const allTeamsClaimed = tournament.teams.every((t) => t.claimedByUserId !== null);
  const statusLabel = tournament.status === 'open'
    ? 'Přihlašování týmů'
    : tournament.status === 'in_progress'
    ? 'Turnaj probíhá'
    : tournament.status === 'finished'
    ? 'Turnaj skončil'
    : tournament.status;

  const teamName = (teamId: string): string => tournament.teams.find((t) => t.id === teamId)?.name ?? 'Neznámý tým';

  const isFinished = tournament.status === 'finished';
  const winnerTeam = tournament.winnerTeamId
    ? tournament.teams.find((t) => t.id === tournament.winnerTeamId) ?? null
    : null;

  const matchStatusLabels: Record<string, string> = {
    scheduled: 'Naplánováno',
    in_progress: 'Rozehráno',
    finished: 'Dohráno',
    void: 'Zrušeno',
    replay_required: 'Opakovat',
  };

  const matchesByRound = new Map<number, TournamentMatch[]>();
  for (const match of tournament.matches) {
    const existing = matchesByRound.get(match.roundNumber);
    if (existing) existing.push(match);
    else matchesByRound.set(match.roundNumber, [match]);
  }
  const rounds = [...matchesByRound.keys()].sort((a, b) => a - b);

  return (
    <main className="min-h-screen flex flex-col items-center gap-6 px-4 py-10" style={{ background: '#041f14' }}>
      <div className="w-full max-w-lg flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <GameNavLink />
        </div>
        <div className="shrink-0">
          <TournamentAuthControl currentUser={currentUser} />
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs mb-1" style={{ color: 'rgba(209,250,229,0.4)' }}>Kód turnaje</p>
        <span className="text-4xl font-black tracking-widest" style={{ color: '#d6a94a' }}>
          {tournament.publicCode}
        </span>
      </div>

      {isFinished && (
        <div
          className="w-full max-w-md p-5 flex flex-col items-center gap-1 text-center"
          style={{ background: 'rgba(214,169,74,0.12)', border: '1px solid rgba(214,169,74,0.45)', borderRadius: 16 }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d6a94a' }}>
            🏆 Vítěz turnaje
          </p>
          <p className="text-xl font-black text-white">
            {tournament.winnerTeamId
              ? (winnerTeam ? winnerTeam.name : 'Vítěz turnaje je určen, ale tým se nepodařilo načíst.')
              : 'Vítěz turnaje nebyl určen.'}
          </p>
          <p className="text-xs" style={{ color: 'rgba(209,250,229,0.5)' }}>
            Turnaj skončil. Výsledky zůstávají uložené.
          </p>
        </div>
      )}

      <div className="w-full max-w-md p-6 flex flex-col gap-4" style={cardBase}>
        <div>
          <h1 className="text-2xl font-black text-white mb-1">{tournament.name}</h1>
          <p className="text-xs" style={{ color: 'rgba(209,250,229,0.5)' }}>
            {getFormatLabel(tournament.format)} &middot; {tournament.playerCount} hráčů
          </p>
        </div>

        <p className="text-xs" style={{ color: 'rgba(209,250,229,0.45)' }}>
          Status: <span className="font-semibold" style={{ color: '#86efac' }}>{statusLabel}</span>
        </p>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d6a94a' }}>Týmy</p>
          <div className="flex flex-col gap-1.5">
            {tournament.teams.map((team) => {
              const isMine = myUserId !== null && team.claimedByUserId === myUserId;
              const isTaken = team.claimedByUserId !== null;
              const claiming = claimingTeamId === team.id;

              return (
                <div
                  key={team.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span>{team.slotNumber}. {team.name}</span>

                  {isMine ? (
                    <span className="text-xs font-bold shrink-0" style={{ color: '#86efac' }}>Tvůj tým</span>
                  ) : isTaken ? (
                    <span className="text-xs shrink-0" style={{ color: 'rgba(209,250,229,0.4)' }}>Obsazeno</span>
                  ) : myTeam ? (
                    <span
                      className="text-xs shrink-0 px-2.5 py-1 rounded-md"
                      style={{ color: 'rgba(209,250,229,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Už máš zabraný tým
                    </span>
                  ) : (
                    <button
                      onClick={() => { void handleClaim(team.id); }}
                      disabled={claiming}
                      className="text-xs font-bold shrink-0 px-2.5 py-1 rounded-md transition disabled:opacity-50"
                      style={{ background: 'rgba(214,169,74,0.15)', color: '#d6a94a', border: '1px solid rgba(214,169,74,0.3)' }}
                    >
                      {claiming ? 'Zabírám...' : 'Zabrat tým'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {claimError && (
            <p className="text-xs" style={{ color: '#f87171' }}>{claimError}</p>
          )}
        </div>

        {isCreator && tournament.status === 'open' && (
          <div className="flex flex-col gap-2">
            {allTeamsClaimed ? (
              <button
                onClick={() => { void handleStart(); }}
                disabled={starting}
                className="w-full py-3 rounded-lg font-bold text-sm transition disabled:opacity-50"
                style={{ background: '#d6a94a', color: '#041f14' }}
              >
                {starting ? 'Spouštím...' : 'Spustit turnaj'}
              </button>
            ) : (
              <p
                className="text-xs text-center py-2.5 rounded-lg"
                style={{ color: 'rgba(209,250,229,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Turnaj půjde spustit, až budou obsazené všechny týmy.
              </p>
            )}
            {startError && (
              <p className="text-xs text-center" style={{ color: '#f87171' }}>{startError}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d6a94a' }}>Tabulka</p>
          {!tournament.standings || tournament.standings.length === 0 ? (
            <p className="text-xs text-center" style={{ color: 'rgba(209,250,229,0.4)' }}>
              Tabulka se zobrazí po odehrání prvních zápasů.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-white" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'rgba(209,250,229,0.5)' }}>
                    <th className="text-left py-1 pr-2 font-semibold">#</th>
                    <th className="text-left py-1 pr-2 font-semibold">Tým</th>
                    <th className="text-center py-1 px-1 font-semibold">Z</th>
                    <th className="text-center py-1 px-1 font-semibold">V</th>
                    <th className="text-center py-1 px-1 font-semibold">R</th>
                    <th className="text-center py-1 px-1 font-semibold">P</th>
                    <th className="text-center py-1 px-1 font-semibold">Skóre</th>
                    <th className="text-center py-1 px-1 font-semibold">Rozdíl</th>
                    <th className="text-center py-1 pl-1 font-semibold">Body</th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.standings.map((row, index) => {
                    const isWinnerRow = isFinished && index === 0;
                    return (
                      <tr
                        key={row.teamId}
                        style={{
                          background: isWinnerRow ? 'rgba(214,169,74,0.12)' : undefined,
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <td className="py-1.5 pr-2" style={{ color: isWinnerRow ? '#d6a94a' : 'rgba(209,250,229,0.6)' }}>
                          {index + 1}
                        </td>
                        <td
                          className="py-1.5 pr-2 font-semibold whitespace-nowrap"
                          style={{ color: isWinnerRow ? '#d6a94a' : 'white' }}
                        >
                          {row.name}
                        </td>
                        <td className="text-center py-1.5 px-1">{row.played}</td>
                        <td className="text-center py-1.5 px-1">{row.wins}</td>
                        <td className="text-center py-1.5 px-1">{row.draws}</td>
                        <td className="text-center py-1.5 px-1">{row.losses}</td>
                        <td className="text-center py-1.5 px-1 whitespace-nowrap">
                          {row.goalsFor}:{row.goalsAgainst}
                        </td>
                        <td className="text-center py-1.5 px-1">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="text-center py-1.5 pl-1 font-black" style={{ color: '#d6a94a' }}>
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#d6a94a' }}>Rozpis zápasů</p>
          {tournament.matches.length === 0 ? (
            <p className="text-xs text-center" style={{ color: 'rgba(209,250,229,0.4)' }}>
              Rozpis vznikne po spuštění turnaje.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {rounds.map((roundNumber) => (
                <div key={roundNumber} className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold" style={{ color: 'rgba(209,250,229,0.55)' }}>
                    Kolo {roundNumber}
                  </p>
                  {matchesByRound.get(roundNumber)!.map((match) => {
                    const homeTeam = tournament.teams.find((t) => t.id === match.homeTeamId);
                    const awayTeam = tournament.teams.find((t) => t.id === match.awayTeamId);
                    const isMyMatch = myUserId !== null && (
                      myUserId === homeTeam?.claimedByUserId || myUserId === awayTeam?.claimedByUserId
                    );
                    const canPlay = tournament.status === 'in_progress'
                      && (match.status === 'scheduled' || match.status === 'in_progress')
                      && isMyMatch;
                    const isPlaying = playingMatchId === match.id;
                    const playLabel = match.status === 'in_progress' && match.onlineMatchId
                      ? 'Pokračovat v zápase'
                      : 'Hrát zápas';

                    return (
                      <div
                        key={match.id}
                        className="flex flex-col gap-2 px-3 py-2 rounded-lg text-sm text-white"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {match.status === 'finished' ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                style={{
                                  color: match.winnerTeamId === match.homeTeamId ? '#d6a94a' : 'rgba(255,255,255,0.85)',
                                  fontWeight: match.winnerTeamId === match.homeTeamId ? 700 : 400,
                                }}
                              >
                                {teamName(match.homeTeamId)}
                              </span>
                              <span className="font-black" style={{ color: '#d6a94a' }}>
                                {match.homeScore} : {match.awayScore}
                              </span>
                              <span
                                style={{
                                  color: match.winnerTeamId === match.awayTeamId ? '#d6a94a' : 'rgba(255,255,255,0.85)',
                                  fontWeight: match.winnerTeamId === match.awayTeamId ? 700 : 400,
                                }}
                              >
                                {teamName(match.awayTeamId)}
                              </span>
                              {match.winnerTeamId === null && (
                                <span className="text-[10px]" style={{ color: 'rgba(209,250,229,0.45)' }}>
                                  (remíza)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span>{teamName(match.homeTeamId)} vs {teamName(match.awayTeamId)}</span>
                          )}
                          <span className="text-xs shrink-0" style={{ color: 'rgba(209,250,229,0.4)' }}>
                            {matchStatusLabels[match.status] ?? match.status}
                          </span>
                        </div>
                        {canPlay && (
                          <button
                            onClick={() => { void handlePlay(match.id); }}
                            disabled={isPlaying}
                            className="w-full py-2 rounded-lg font-bold text-xs transition disabled:opacity-50"
                            style={{ background: '#d6a94a', color: '#041f14' }}
                          >
                            {isPlaying ? 'Připravuji zápas...' : playLabel}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {playError && (
            <p className="text-xs" style={{ color: '#f87171' }}>{playError}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs" style={{ color: 'rgba(209,250,229,0.45)' }}>Sdílej odkaz s ostatními hráči</p>
          <div className="flex gap-2 min-w-0">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 min-w-0 text-xs px-3 py-2 rounded-lg bg-transparent border text-white truncate"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            />
            <button
              onClick={() => { void handleCopy(shareUrl); }}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition"
              style={{ background: copied ? '#166534' : 'rgba(214,169,74,0.15)', color: '#d6a94a', border: '1px solid rgba(214,169,74,0.3)' }}
            >
              {copied ? 'Zkopírováno' : 'Kopírovat'}
            </button>
          </div>
        </div>
      </div>

      <Link href="/turnaj" className="text-xs transition hover:opacity-80" style={{ color: 'rgba(209,250,229,0.38)' }}>
        ← Založit další turnaj
      </Link>
    </main>
  );
}

// Same look/behavior as components/auth/AuthStatus.tsx, but as a plain
// client component driven by the `currentUser` state this page already
// fetches from /api/auth/me — AuthStatus itself is a Server Component
// (reads the session cookie directly via getSession()) and can't be
// imported into this 'use client' page. Claiming a team requires being
// logged in, but this page previously never rendered any way to actually
// log in — this fixes that gap.
function TournamentAuthControl({ currentUser }: { currentUser: CurrentUser }) {
  if (currentUser) {
    return (
      <div className="flex items-center gap-2">
        {currentUser.avatarUrl && (
          <Image
            src={currentUser.avatarUrl}
            alt={currentUser.globalName ?? currentUser.username}
            width={24}
            height={24}
            className="rounded-full"
            unoptimized
          />
        )}
        <span className="hidden sm:block text-xs text-white/70 max-w-[96px] truncate">
          {currentUser.globalName ?? currentUser.username}
        </span>
        <form method="POST" action="/api/auth/logout">
          <button type="submit" className="text-xs text-white/40 hover:text-white/70 transition">
            Odhlásit
          </button>
        </form>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/login"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-90 shrink-0"
      style={{ background: '#d6a94a', color: '#041f14' }}
    >
      <DiscordIcon />
      Přihlásit
    </a>
  );
}

function DiscordIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 71 55" fill="currentColor" aria-hidden="true">
      <path d="M60.1 4.9A58.6 58.6 0 0 0 45.5.5a40.4 40.4 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.2 0A39.4 39.4 0 0 0 25.7.5 58.4 58.4 0 0 0 11.1 4.9C1.6 19.4-.9 33.4.3 47.2a58.8 58.8 0 0 0 17.9 9.1 43.4 43.4 0 0 0 3.8-6.2 38.4 38.4 0 0 1-6-2.9l1.5-1.1a42 42 0 0 0 36 0l1.5 1.1a38.6 38.6 0 0 1-6 2.9 43.3 43.3 0 0 0 3.8 6.2 58.6 58.6 0 0 0 17.9-9.1c1.5-15.4-2.4-29.3-10.5-41.2ZM23.8 37.9a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Zm23.3 0a6.7 6.7 0 0 1-6.3-7 6.7 6.7 0 0 1 6.3-7 6.7 6.7 0 0 1 6.3 7 6.7 6.7 0 0 1-6.3 7Z" />
    </svg>
  );
}
