import {
  normalizeMatch,
  pragueLocalToUtc,
  pragueParts,
  type FootballMatch,
  type MatchFeed,
} from "@/lib/football/matches";

// DEMO — fiktivní utkání jen pro testy a neindexovanou /dev/football-matches
// (na produkci 404). Nikdy je neimportovat do veřejných stránek ani do
// lib/football/matchSource.ts. Týmy i hřiště jsou vymyšlené; souřadnice
// jsou jen body ve středních Čechách pro ukázku mapy.

const VENUES = {
  lhota: { name: "Demo hřiště Lhota", municipality: "Lhota (demo)", latitude: 49.7815, longitude: 14.6853, verified: true },
  brod: { name: "Demo stadion U Brodu", municipality: "Brod (demo)", latitude: 49.8331, longitude: 14.9056, verified: true },
  ves: { name: "Demo areál Ves", municipality: "Ves (demo)", latitude: 50.0172, longitude: 14.4920, verified: true },
  kopec: { name: "Demo hřiště Na Kopci", municipality: "Kopec (demo)", latitude: 49.6612, longitude: 14.2401, verified: true },
  luka: { name: "Demo louka Luka", municipality: "Luka (demo)", latitude: 50.2093, longitude: 15.0287, verified: true },
  dalekov: { name: "Demo hřiště Dálkov", municipality: "Dálkov (demo)", latitude: 49.2100, longitude: 16.6000, verified: true },
};

type Seed = [day: number, hour: number | "soon", level: 3 | 4 | 5 | 6 | 7, home: string, away: string, venue: object | undefined, status?: string];

const SEEDS: Seed[] = [
  [0, "soon", 7, "Demo Sokol Lhota", "Demo Jiskra Brod", VENUES.lhota, "scheduled"],
  [0, "soon", 5, "Demo FK Ves", "Demo Slavoj Luka", VENUES.ves, "scheduled"],
  [0, "soon", 6, "Demo TJ Kopec", "Demo Dynamo Ves", VENUES.kopec],
  [1, 10, 7, "Demo Sokol Lhota B", "Demo Tatran Kopec", VENUES.lhota, "scheduled"],
  [1, 14, 3, "Demo SK Brod", "Demo FC Dálkov", VENUES.brod, "scheduled"],
  [1, 15, 4, "Demo Slavoj Luka", "Demo Sokol Ves", VENUES.luka, "scheduled"],
  [1, 16, 6, "Demo Jiskra Pole", "Demo Rudá hvězda", { municipality: "Pole (demo)" }, "scheduled"],
  [1, 17, 5, "Demo Spartak Les", "Demo FK Rybník", undefined, "scheduled"],
  [2, 10, 4, "Demo FK Ves B", "Demo Union Lhota", VENUES.ves, "scheduled"],
  [2, 14, 7, "Demo TJ Kopec B", "Demo Sokol Brod", VENUES.kopec, "postponed"],
  [2, 15, 3, "Demo FC Dálkov", "Demo SK Luka", VENUES.dalekov, "scheduled"],
  [2, 16, 6, "Demo Slavia Mez", "Demo Viktoria Mez", { municipality: "Mez (demo)", latitude: 49.9, longitude: 14.9, verified: false }, "scheduled"],
  [3, 17, 5, "Demo Lokomotiva", "Demo Baník Brod", VENUES.brod, "cancelled"],
  [4, 18, 4, "Demo Sokol Luka", "Demo TJ Lhota", VENUES.luka, "scheduled"],
  [5, 10, 7, "Demo Hvězda Ves", "Demo Sokol Kopec", VENUES.ves, "scheduled"],
  [5, 14, 6, "Demo Tatran Lhota", "Demo Jiskra Luka", VENUES.lhota, "scheduled"],
  [6, 15, 3, "Demo SK Luka", "Demo FC Brod", VENUES.luka, "scheduled"],
  [6, 16, 5, "Demo Rapid Dálkov", "Demo Sparta Ves", VENUES.dalekov],
];

function iso(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Demo utkání rozložená kolem `now` (dnes … +6 dní), aby šly vyzkoušet všechny filtry. */
export function buildDemoMatches(now: Date): FootballMatch[] {
  const nowMs = now.getTime();
  const p = pragueParts(nowMs);
  return SEEDS.map(([day, hour, level, home, away, venue, status], i) => {
    let kickoff: number;
    if (hour === "soon") {
      kickoff = nowMs + (90 + i * 45) * 60_000; // dnes za 1,5–3 h (u pozdního večera může přetéct do zítřka)
      kickoff -= kickoff % (15 * 60_000);
    } else {
      const t = new Date(Date.UTC(p.y, p.m - 1, p.d + day));
      kickoff = pragueLocalToUtc(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), hour);
    }
    return normalizeMatch({
      id: `demo-${i + 1}`,
      leagueLevel: level,
      leagueName: `${level}. liga (demo)`,
      group: "Demo skupina",
      homeTeam: home,
      awayTeam: away,
      kickoffAt: iso(kickoff),
      venue,
      status,
      sourceName: "DEMO — fiktivní data",
    })!;
  });
}

export function demoFeed(now: Date): MatchFeed {
  return { status: "ok", matches: buildDemoMatches(now), sourceName: "DEMO — fiktivní data", demo: true };
}
