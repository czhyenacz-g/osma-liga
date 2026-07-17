'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import Link from 'next/link';
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

type Tournament = {
  id: string;
  publicCode: string;
  name: string;
  createdByUserId: string;
  format: TournamentFormat;
  playerCount: number;
  status: string;
  teams: TournamentTeam[];
};

type TournamentResponse = { ok: true; tournament: Tournament };

type CurrentUser = { osmaUserId: string | null } | null;

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

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [claimingTeamId, setClaimingTeamId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen flex flex-col items-center gap-6 px-4 py-10" style={{ background: '#041f14' }}>
      <GameNavLink />

      <div className="text-center">
        <p className="text-xs mb-1" style={{ color: 'rgba(209,250,229,0.4)' }}>Kód turnaje</p>
        <span className="text-4xl font-black tracking-widest" style={{ color: '#d6a94a' }}>
          {tournament.publicCode}
        </span>
      </div>

      <div className="w-full max-w-md p-6 flex flex-col gap-4" style={cardBase}>
        <div>
          <h1 className="text-2xl font-black text-white mb-1">{tournament.name}</h1>
          <p className="text-xs" style={{ color: 'rgba(209,250,229,0.5)' }}>
            {getFormatLabel(tournament.format)} &middot; {tournament.playerCount} hráčů
          </p>
        </div>

        <p className="text-xs" style={{ color: 'rgba(209,250,229,0.45)' }}>
          Status: <span className="font-semibold" style={{ color: '#86efac' }}>
            {tournament.status === 'open' ? 'otevřený' : tournament.status}
          </span>
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

        <p className="text-xs text-center" style={{ color: 'rgba(209,250,229,0.4)' }}>
          Rozpis zápasů bude doplněn v dalším kroku.
        </p>

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
