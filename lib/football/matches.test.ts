import { describe, expect, it } from "vitest";
import {
  distanceKm,
  filterMatches,
  formatKickoff,
  navigationUrl,
  normalizeMatch,
  pinKeyOf,
  pragueLocalToUtc,
  rangeBounds,
  reconcileSelection,
  venuePins,
  type FootballMatch,
  type MatchFilters,
} from "@/lib/football/matches";
import { buildDemoMatches } from "@/lib/football/demoMatches";

const T = (iso: string) => Date.parse(iso);

function match(over: Partial<FootballMatch> & { id: string; kickoffAt: string }): FootballMatch {
  return {
    leagueLevel: 7,
    leagueName: "7. liga",
    homeTeam: "A",
    awayTeam: "B",
    status: "scheduled",
    venue: { name: "Hřiště", municipality: "Obec", latitude: 50, longitude: 14.5, verified: true },
    ...over,
  };
}

const ALL: MatchFilters = { range: "next3days", league: null, radiusKm: null, place: "", sort: "time" };

describe("normalizeMatch", () => {
  const base = { id: "x", leagueLevel: 5, homeTeam: "A", awayTeam: "B", kickoffAt: "2026-11-07T14:00:00+01:00" };

  it("přijme platnou ligu a datum se zónou", () => {
    const m = normalizeMatch({ ...base, status: "scheduled" })!;
    expect(m.leagueLevel).toBe(5);
    expect(m.leagueName).toBe("5. liga");
    expect(m.status).toBe("scheduled");
  });

  it("odmítne ligu mimo 3–7 a chybějící týmy", () => {
    expect(normalizeMatch({ ...base, leagueLevel: 8 })).toBeNull();
    expect(normalizeMatch({ ...base, leagueLevel: 2 })).toBeNull();
    expect(normalizeMatch({ ...base, homeTeam: " " })).toBeNull();
  });

  it("odmítne neplatné nebo nejednoznačné datum", () => {
    expect(normalizeMatch({ ...base, kickoffAt: "2026-11-07T14:00:00" })).toBeNull(); // bez zóny
    expect(normalizeMatch({ ...base, kickoffAt: "7. 11. 2026 14:00" })).toBeNull();
    expect(normalizeMatch({ ...base, kickoffAt: "2026-13-40T14:00:00Z" })).toBeNull();
  });

  it("bez statusu nepředpokládá ověřený termín", () => {
    expect(normalizeMatch(base)!.status).toBe("unconfirmed");
    expect(normalizeMatch({ ...base, status: "live" })!.status).toBe("unconfirmed");
  });

  it("chybějící nebo neúplné GPS = bez bodu a bez navigace", () => {
    const noGps = normalizeMatch({ ...base, venue: { municipality: "Lhota" } })!;
    expect(noGps.venue?.latitude).toBeUndefined();
    expect(navigationUrl(noGps)).toBeNull();
    const half = normalizeMatch({ ...base, venue: { latitude: 50, verified: true } })!;
    expect(half.venue?.verified).toBe(false);
    const outOfRange = normalizeMatch({ ...base, venue: { latitude: 120, longitude: 14, verified: true } })!;
    expect(outOfRange.venue?.latitude).toBeUndefined();
  });

  it("zachová odložené a zrušené utkání a zahodí nebezpečný odkaz na zdroj", () => {
    expect(normalizeMatch({ ...base, status: "postponed" })!.status).toBe("postponed");
    expect(normalizeMatch({ ...base, status: "cancelled" })!.status).toBe("cancelled");
    expect(normalizeMatch({ ...base, sourceUrl: "javascript:alert(1)" })!.sourceUrl).toBeUndefined();
    expect(normalizeMatch({ ...base, sourceUrl: "https://example.org/z" })!.sourceUrl).toBe("https://example.org/z");
  });
});

describe("čas Europe/Prague", () => {
  it("pražská půlnoc v zimě je 23:00 UTC, v létě 22:00 UTC", () => {
    expect(pragueLocalToUtc(2026, 1, 15)).toBe(T("2026-01-14T23:00:00Z"));
    expect(pragueLocalToUtc(2026, 7, 15)).toBe(T("2026-07-14T22:00:00Z"));
  });

  it("přechod na letní čas (29. 3. 2026): den má 23 hodin", () => {
    const now = T("2026-03-29T08:00:00Z"); // 10:00 SELČ
    const today = rangeBounds("today", now);
    expect(today.to).toBe(T("2026-03-29T22:00:00Z")); // pondělní půlnoc už v letním čase
    const tomorrow = rangeBounds("tomorrow", T("2026-03-28T12:00:00Z"));
    expect(tomorrow).toEqual({ from: T("2026-03-28T23:00:00Z"), to: T("2026-03-29T22:00:00Z") });
    expect(tomorrow.to - tomorrow.from).toBe(23 * 3600_000);
  });

  it("přechod na zimní čas (25. 10. 2026): den má 25 hodin", () => {
    const tomorrow = rangeBounds("tomorrow", T("2026-10-24T12:00:00Z"));
    expect(tomorrow).toEqual({ from: T("2026-10-24T22:00:00Z"), to: T("2026-10-25T23:00:00Z") });
    expect(tomorrow.to - tomorrow.from).toBe(25 * 3600_000);
  });

  it("výkop formátuje v pražském čase", () => {
    expect(formatKickoff(match({ id: "a", kickoffAt: "2026-11-07T13:00:00Z" }))).toBe("sobota 7. 11. 14:00");
    expect(formatKickoff(match({ id: "b", kickoffAt: "2026-08-01T13:00:00Z" }))).toBe("sobota 1. 8. 15:00");
  });
});

describe("filtry termínu", () => {
  // Středa 4. 11. 2026, 12:00 SEČ.
  const now = T("2026-11-04T11:00:00Z");
  const at = (id: string, iso: string) => match({ id, kickoffAt: iso });
  const matches = [
    at("past", "2026-11-04T10:00:00+01:00"),
    at("today", "2026-11-04T18:00:00+01:00"),
    at("midnight", "2026-11-05T00:00:00+01:00"),
    at("thu", "2026-11-05T17:00:00+01:00"),
    at("fri", "2026-11-06T17:00:00+01:00"),
    at("sat-edge", "2026-11-07T00:00:00+01:00"),
    at("sun", "2026-11-08T15:00:00+01:00"),
    at("mon", "2026-11-09T00:00:00+01:00"),
  ];
  const ids = (range: MatchFilters["range"], n = now) =>
    filterMatches(matches, { ...ALL, range }, n, null).items.map((i) => i.match.id);

  it("dnes: od teď do půlnoci, už začatý výkop ne", () => {
    expect(ids("today")).toEqual(["today"]);
  });

  it("zítra: půlnoc patří do zítřka", () => {
    expect(ids("tomorrow")).toEqual(["midnight", "thu"]);
  });

  it("3 dny: dnes + 2 další dny, sobotní půlnoc už ne", () => {
    expect(ids("next3days")).toEqual(["today", "midnight", "thu", "fri"]);
  });

  it("víkend: sobota 00:00 až pondělí 00:00 (bez pondělní půlnoci)", () => {
    expect(ids("weekend")).toEqual(["sat-edge", "sun"]);
  });

  it("víkend v neděli odpoledne: jen zbytek neděle", () => {
    expect(ids("weekend", T("2026-11-08T13:00:00Z"))).toEqual(["sun"]);
    expect(ids("weekend", T("2026-11-08T15:00:00Z"))).toEqual([]);
  });
});

describe("filtr soutěže, místa a vzdálenosti", () => {
  const now = T("2026-11-04T11:00:00Z");
  const prague = { lat: 50.0755, lng: 14.4378 };
  const near = match({ id: "near", leagueLevel: 3, kickoffAt: "2026-11-05T15:00:00+01:00",
    venue: { name: "Blízko", municipality: "Řevnice", latitude: 50.1, longitude: 14.45, verified: true } });
  const far = match({ id: "far", leagueLevel: 5, kickoffAt: "2026-11-04T15:00:00+01:00",
    venue: { name: "Daleko", municipality: "Brno", latitude: 49.195, longitude: 16.607, verified: true } });
  const noGps = match({ id: "nogps", leagueLevel: 3, kickoffAt: "2026-11-05T16:00:00+01:00", venue: { municipality: "Lhota" } });
  const all = [near, far, noGps];
  const run = (f: Partial<MatchFilters>, user: typeof prague | null = prague) =>
    filterMatches(all, { ...ALL, ...f }, now, user);

  it("soutěž", () => {
    expect(run({ league: 3 }).items.map((i) => i.match.id)).toEqual(["near", "nogps"]);
    expect(run({ league: null }).items).toHaveLength(3);
  });

  it("obec bez diakritiky a velikosti písmen", () => {
    expect(run({ place: "revnice" }).items.map((i) => i.match.id)).toEqual(["near"]);
  });

  it("vzdálenost: skryje vzdálené i neověřené (a spočítá je)", () => {
    const r = run({ radiusKm: 25 });
    expect(r.items.map((i) => i.match.id)).toEqual(["near"]);
    expect(r.hiddenWithoutLocation).toBe(1);
  });

  it("bez polohy uživatele filtr vzdálenosti nic neskryje a vzdálenost není známá", () => {
    const r = run({ radiusKm: 10 }, null);
    expect(r.items).toHaveLength(3);
    expect(r.items.every((i) => i.distanceKm === null)).toBe(true);
  });

  it("výchozí řazení podle výkopu, volitelně podle vzdálenosti", () => {
    expect(run({}).items.map((i) => i.match.id)).toEqual(["far", "near", "nogps"]);
    expect(run({ sort: "distance" }).items.map((i) => i.match.id)).toEqual(["near", "far", "nogps"]);
    expect(run({ sort: "distance" }, null).items.map((i) => i.match.id)).toEqual(["far", "near", "nogps"]);
  });

  it("Haversine: Praha–Brno vzdušnou čarou ~185 km", () => {
    expect(distanceKm(prague, { lat: 49.195, lng: 16.607 })).toBeGreaterThan(180);
    expect(distanceKm(prague, { lat: 49.195, lng: 16.607 })).toBeLessThan(190);
  });
});

describe("navigace", () => {
  it("vede na přesné souřadnice hřiště", () => {
    const m = match({ id: "a", kickoffAt: "2026-11-07T14:00:00+01:00",
      venue: { name: "H", latitude: 49.7815123, longitude: 14.6853456, verified: true } });
    expect(navigationUrl(m)).toBe("https://www.google.com/maps/dir/?api=1&destination=49.781512,14.685346");
  });

  it("žádný odkaz pro neověřené místo, zrušený nebo odložený zápas", () => {
    const unverified = match({ id: "u", kickoffAt: "2026-11-07T14:00:00+01:00",
      venue: { name: "H", latitude: 50, longitude: 14, verified: false } });
    expect(navigationUrl(unverified)).toBeNull();
    expect(navigationUrl(match({ id: "c", kickoffAt: "2026-11-07T14:00:00+01:00", status: "cancelled" }))).toBeNull();
    expect(navigationUrl(match({ id: "p", kickoffAt: "2026-11-07T14:00:00+01:00", status: "postponed" }))).toBeNull();
  });
});

describe("piny a výběr", () => {
  const now = T("2026-11-04T11:00:00Z");
  const same = { name: "Společné hřiště", latitude: 50, longitude: 14.5, verified: true };
  const list = [
    match({ id: "a", kickoffAt: "2026-11-04T15:00:00+01:00", venue: same }),
    match({ id: "b", kickoffAt: "2026-11-05T10:00:00+01:00", venue: same }),
    match({ id: "c", kickoffAt: "2026-11-05T12:00:00+01:00", venue: { municipality: "Bez GPS" } }),
    match({ id: "d", kickoffAt: "2026-11-05T13:00:00+01:00", status: "cancelled" }),
    match({ id: "e", leagueLevel: 3, kickoffAt: "2026-11-05T14:00:00+01:00",
      venue: { name: "Jinde", latitude: 49.5, longitude: 15, verified: true } }),
  ];

  it("pin jen pro ověřené hřiště; stejné hřiště = jeden pin s více zápasy", () => {
    const items = filterMatches(list, ALL, now, null).items;
    const pins = venuePins(items);
    expect(pins).toHaveLength(2);
    expect(pins[0]).toMatchObject({ label: "Společné hřiště", matchIds: ["a", "b"] });
    expect(pinKeyOf(pins, "c")).toBeNull(); // bez GPS
    expect(pinKeyOf(pins, "d")).toBeNull(); // zrušeno — žádný pin
    expect(pinKeyOf(pins, "b")).toBe(pins[0].key); // výběr ze seznamu → pin
  });

  it("změna filtru mění seznam i piny stejně a ruší výběr, který zmizel", () => {
    const items = filterMatches(list, { ...ALL, league: 3 }, now, null).items;
    expect(items.map((i) => i.match.id)).toEqual(["e"]);
    expect(venuePins(items).map((p) => p.matchIds)).toEqual([["e"]]);
    expect(reconcileSelection("a", items)).toBeNull();
    expect(reconcileSelection("e", items)).toBe("e");
    expect(reconcileSelection(null, items)).toBeNull();
  });
});

describe("demo data", () => {
  it("obsahují všechny případy a jsou zřetelně označená", () => {
    const demo = buildDemoMatches(new Date("2026-11-04T11:00:00Z"));
    expect(demo.length).toBeGreaterThanOrEqual(15);
    expect(demo.every((m) => m.homeTeam.startsWith("Demo") && m.awayTeam.startsWith("Demo"))).toBe(true);
    expect(demo.every((m) => m.sourceName?.startsWith("DEMO"))).toBe(true);
    expect(demo.some((m) => m.status === "postponed")).toBe(true);
    expect(demo.some((m) => m.status === "cancelled")).toBe(true);
    expect(demo.some((m) => !m.venue?.latitude)).toBe(true);
    expect(new Set(demo.map((m) => m.leagueLevel))).toEqual(new Set([3, 4, 5, 6, 7]));
  });
});
