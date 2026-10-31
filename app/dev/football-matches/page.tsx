import MatchFinder from "@/components/football/MatchFinder";
import { demoFeed } from "@/lib/football/demoMatches";
import { LEAGUE_LEVELS, type LeagueLevel } from "@/lib/football/matches";

// Neindexovaná ukázka "Kam na fotbal?" na fiktivních datech (layout /dev:
// noindex a 404 na produkci). ?liga=3 … 7 nastaví výchozí soutěž.
export const dynamic = "force-dynamic";

export default async function FootballMatchesDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ liga?: string }>;
}) {
  const { liga } = await searchParams;
  const level = Number(liga);
  const defaultLeague = (LEAGUE_LEVELS as readonly number[]).includes(level) ? (level as LeagueLevel) : null;
  const now = new Date();
  const feed = demoFeed(now);
  if (feed.status !== "ok") return null;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <MatchFinder
          matches={feed.matches}
          sourceName={feed.sourceName}
          demo
          defaultLeague={defaultLeague}
          initialNowMs={now.getTime()}
        />
      </div>
    </main>
  );
}
