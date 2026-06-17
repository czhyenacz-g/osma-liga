const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

type MatchRow = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  mode: string;
  matchComment: string;
  playedAt: string;
};

async function fetchRecentResults(): Promise<MatchRow[] | null> {
  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/match-results?limit=5`, {
      headers: { 'X-Project-Hub-Key': HUB_KEY },
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<MatchRow[]>;
  } catch {
    return null;
  }
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 2)  return 'právě teď';
  if (mins  < 60) return `před ${mins} min`;
  if (hours < 24) return `před ${hours} h`;
  return `před ${days} d`;
}

export default async function RecentResults() {
  const results = await fetchRecentResults();

  return (
    <section id="vysledky" className="py-10 px-6" style={{ background: '#0a1f10' }}>
      <div className="mx-auto max-w-[1240px]">
        <h2
          className="text-xs font-black uppercase tracking-[0.2em] mb-5"
          style={{ color: '#6dbf8a' }}
        >
          Poslední výsledky
        </h2>

        {!results || results.length === 0 ? (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Zatím není zapsaný žádný odehraný zápas.
          </p>
        ) : (
          <ul className="space-y-3">
            {results.map((r) => (
              <li
                key={r.id}
                className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">
                    {r.homeTeamName}
                  </span>
                  <span
                    className="text-base font-black font-mono"
                    style={{ color: '#d6a94a' }}
                  >
                    {r.homeScore}&thinsp;:&thinsp;{r.awayScore}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {r.awayTeamName}
                  </span>
                </div>

                <div className="flex flex-col sm:items-end gap-0.5">
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {r.mode} &middot; {relativeTime(r.playedAt)}
                  </span>
                  <span className="text-[11px] italic" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {r.matchComment}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
