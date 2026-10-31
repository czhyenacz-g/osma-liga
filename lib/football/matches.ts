// "Kam na fotbal?" — datový model a čistá logika (filtry, čas, vzdálenost,
// navigace, seskupení hřišť). Bez DOM a bez síťových volání, aby šla
// deterministicky testovat. UI: components/football/MatchFinder.tsx,
// data: lib/football/matchSource.ts.

export const LEAGUE_LEVELS = [3, 4, 5, 6, 7] as const;
export type LeagueLevel = (typeof LEAGUE_LEVELS)[number];

/**
 * scheduled   — termín potvrzený zdrojem;
 * unconfirmed — termín zatím nepotvrzený (i když status chybí — nevyvozujeme ověření);
 * postponed   — odloženo, původní čas neplatí;
 * cancelled   — zrušeno.
 */
export type MatchStatus = "scheduled" | "unconfirmed" | "postponed" | "cancelled";

export interface Venue {
  name?: string;
  municipality?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  /** true jen když souřadnice patří ke skutečnému hřišti tohoto utkání. */
  verified?: boolean;
}

export interface FootballMatch {
  id: string;
  leagueLevel: LeagueLevel;
  leagueName: string;
  group?: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO 8601 se zónou, např. "2026-11-07T14:00:00+01:00". */
  kickoffAt: string;
  venue?: Venue;
  status: MatchStatus;
  sourceName?: string;
  sourceUrl?: string;
  sourceUpdatedAt?: string;
}

/**
 * Výsledek datového zdroje. `unavailable` = žádný ověřený zdroj (dnešní
 * produkce) — UI pak neukazuje filtry ani mapu, jen poctivou zprávu.
 * `ok` s prázdným polem = zdroj ověřeně nemá žádné utkání.
 */
export type MatchFeed =
  | { status: "unavailable" }
  | { status: "ok"; matches: FootballMatch[]; sourceName: string; demo?: boolean };

// ── Validace ──────────────────────────────────────────────────────────────────

const ZONED_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export function parseZonedIso(value: string): number | null {
  if (!ZONED_ISO.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function isLeagueLevel(v: unknown): v is LeagueLevel {
  return typeof v === "number" && (LEAGUE_LEVELS as readonly number[]).includes(v);
}

function safeHttpUrl(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function coord(v: unknown, limit: number): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= limit ? v : undefined;
}

/**
 * Převede jeden záznam z libovolného zdroje na FootballMatch, nebo vrátí
 * null (chybí id/týmy, neplatná liga, datum bez zóny). Neznámý status →
 * "unconfirmed"; souřadnice mimo rozsah se zahodí.
 */
export function normalizeMatch(raw: unknown): FootballMatch | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id), homeTeam = str(r.homeTeam), awayTeam = str(r.awayTeam);
  const kickoffAt = str(r.kickoffAt);
  if (!id || !homeTeam || !awayTeam || !kickoffAt || !isLeagueLevel(r.leagueLevel)) return null;
  if (parseZonedIso(kickoffAt) === null) return null;
  const status: MatchStatus =
    r.status === "scheduled" || r.status === "postponed" || r.status === "cancelled" ? r.status : "unconfirmed";

  let venue: Venue | undefined;
  if (r.venue && typeof r.venue === "object") {
    const v = r.venue as Record<string, unknown>;
    const latitude = coord(v.latitude, 90), longitude = coord(v.longitude, 180);
    const hasBoth = latitude !== undefined && longitude !== undefined;
    venue = {
      name: str(v.name),
      municipality: str(v.municipality),
      address: str(v.address),
      latitude: hasBoth ? latitude : undefined,
      longitude: hasBoth ? longitude : undefined,
      verified: hasBoth && v.verified === true,
    };
  }

  return {
    id,
    leagueLevel: r.leagueLevel,
    leagueName: str(r.leagueName) ?? `${r.leagueLevel}. liga`,
    group: str(r.group),
    homeTeam,
    awayTeam,
    kickoffAt,
    venue,
    status,
    sourceName: str(r.sourceName),
    sourceUrl: safeHttpUrl(r.sourceUrl),
    sourceUpdatedAt: str(r.sourceUpdatedAt),
  };
}

/** Pin, vzdálenost a navigace jen pro ověřené souřadnice skutečného hřiště. */
export function verifiedPoint(m: FootballMatch): { lat: number; lng: number } | null {
  const v = m.venue;
  if (!v || v.verified !== true || v.latitude === undefined || v.longitude === undefined) return null;
  return { lat: v.latitude, lng: v.longitude };
}

/** Na zrušené nebo odložené utkání se nevyráží — bez pinu a bez navigace. */
export function isGoable(m: FootballMatch): boolean {
  return m.status !== "cancelled" && m.status !== "postponed";
}

// ── Čas (Europe/Prague) ───────────────────────────────────────────────────────

export const TIME_ZONE = "Europe/Prague";

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric", month: "numeric", day: "numeric",
  hour: "numeric", minute: "numeric", second: "numeric",
  weekday: "short",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PragueParts { y: number; m: number; d: number; hh: number; mm: number; ss: number; weekday: number }

export function pragueParts(ms: number): PragueParts {
  const p: Record<string, string> = {};
  for (const x of partsFmt.formatToParts(new Date(ms))) p[x.type] = x.value;
  return {
    y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mm: +p.minute, ss: +p.second,
    weekday: WEEKDAYS.indexOf(p.weekday),
  };
}

/** UTC instant pražského místního času y-m-d hh:mm (pro neexistující čas ve skoku posune dopředu). */
export function pragueLocalToUtc(y: number, m: number, d: number, hh = 0, mm = 0): number {
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  let guess = naive;
  for (let i = 0; i < 3; i++) {
    const p = pragueParts(guess);
    const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
    guess = naive - (asUtc - guess);
  }
  return guess;
}

/** Pražská půlnoc dne, který je `days` dní po dni okamžiku `ms`. */
export function pragueStartOfDay(ms: number, days = 0): number {
  const p = pragueParts(ms);
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + days));
  return pragueLocalToUtc(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export type DateRange = "today" | "tomorrow" | "next3days" | "weekend";

/**
 * Polouzavřené intervaly [from, to) v pražském čase; "dnes" a "3 dny" začínají
 * teď, takže už začatá utkání nenabízíme.
 *   today     — teď … zítřejší půlnoc
 *   tomorrow  — zítřejší půlnoc … pozítří půlnoc
 *   next3days — teď … půlnoc za 3 dny (dnes + 2 další dny)
 *   weekend   — sobota 00:00 … pondělí 00:00 nejbližšího víkendu;
 *               o víkendu od teď do pondělní půlnoci
 */
export function rangeBounds(range: DateRange, nowMs: number): { from: number; to: number } {
  switch (range) {
    case "today":
      return { from: nowMs, to: pragueStartOfDay(nowMs, 1) };
    case "tomorrow":
      return { from: pragueStartOfDay(nowMs, 1), to: pragueStartOfDay(nowMs, 2) };
    case "next3days":
      return { from: nowMs, to: pragueStartOfDay(nowMs, 3) };
    case "weekend": {
      const wd = pragueParts(nowMs).weekday; // 0 = neděle
      const toSaturday = wd === 0 ? -1 : 6 - wd;
      const toMonday = wd === 0 ? 1 : 8 - wd;
      return {
        from: Math.max(nowMs, pragueStartOfDay(nowMs, toSaturday)),
        to: pragueStartOfDay(nowMs, toMonday),
      };
    }
  }
}

const CS_WEEKDAYS = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];

/** "sobota 7. 11. 14:00" v pražském čase — sestaveno ručně, aby server i prohlížeč vrátily stejný text. */
export function formatKickoff(m: FootballMatch): string {
  const p = pragueParts(parseZonedIso(m.kickoffAt) ?? 0);
  return `${CS_WEEKDAYS[p.weekday]} ${p.d}. ${p.m}. ${String(p.hh).padStart(2, "0")}:${String(p.mm).padStart(2, "0")}`;
}

/** Jen datum ("sobota 7. 11.") — pro odložená utkání, kde původní čas neplatí. */
export function formatDay(m: FootballMatch): string {
  const p = pragueParts(parseZonedIso(m.kickoffAt) ?? 0);
  return `${CS_WEEKDAYS[p.weekday]} ${p.d}. ${p.m}.`;
}

// ── Vzdálenost a navigace ─────────────────────────────────────────────────────

export interface Point { lat: number; lng: number }

/** Vzdušná vzdálenost v km (Haversine). */
export function distanceKm(a: Point, b: Point): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Google Maps navigace na přesný bod hřiště; null bez ověřené polohy nebo u zrušeného/odloženého utkání. */
export function navigationUrl(m: FootballMatch): string | null {
  const p = verifiedPoint(m);
  if (!p || !isGoable(m)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}

// ── Filtry a řazení ───────────────────────────────────────────────────────────

export interface MatchFilters {
  range: DateRange;
  /** null = všechny podporované ligy. */
  league: LeagueLevel | null;
  /** km; null = bez omezení. Bez polohy uživatele se ignoruje. */
  radiusKm: number | null;
  /** Text "obec nebo hřiště" (bez geokódování). */
  place: string;
  sort: "time" | "distance";
}

export interface ListedMatch {
  match: FootballMatch;
  kickoffMs: number;
  /** km vzdušnou čarou, jen se známou polohou uživatele a ověřeným hřištěm. */
  distanceKm: number | null;
}

export interface FilterResult {
  items: ListedMatch[];
  /** Utkání skrytá filtrem vzdálenosti jen proto, že nemají ověřené místo. */
  hiddenWithoutLocation: number;
}

function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function filterMatches(
  matches: readonly FootballMatch[],
  filters: MatchFilters,
  nowMs: number,
  user: Point | null,
): FilterResult {
  const { from, to } = rangeBounds(filters.range, nowMs);
  const place = fold(filters.place);
  const radius = user ? filters.radiusKm : null;
  let hiddenWithoutLocation = 0;
  const items: ListedMatch[] = [];

  for (const match of matches) {
    const kickoffMs = parseZonedIso(match.kickoffAt);
    if (kickoffMs === null || kickoffMs < from || kickoffMs >= to) continue;
    if (filters.league !== null && match.leagueLevel !== filters.league) continue;
    if (place) {
      const hay = fold([match.venue?.municipality, match.venue?.name, match.venue?.address, match.homeTeam, match.awayTeam]
        .filter(Boolean).join(" "));
      if (!hay.includes(place)) continue;
    }
    const p = verifiedPoint(match);
    const d = user && p ? distanceKm(user, p) : null;
    if (radius !== null) {
      if (d === null) { hiddenWithoutLocation++; continue; }
      if (d > radius) continue;
    }
    items.push({ match, kickoffMs, distanceKm: d });
  }

  const byTime = (a: ListedMatch, b: ListedMatch) => a.kickoffMs - b.kickoffMs || a.match.id.localeCompare(b.match.id);
  items.sort(filters.sort === "distance" && user
    ? (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || byTime(a, b)
    : byTime);
  return { items, hiddenWithoutLocation };
}

// ── Mapa: jedno hřiště = jeden pin ────────────────────────────────────────────

export interface VenuePin {
  key: string;
  lat: number;
  lng: number;
  label: string;
  matchIds: string[];
}

/** Piny jen pro ověřená hřiště utkání, na která lze vyrazit; utkání na stejném hřišti sdílí pin (v pořadí seznamu). */
export function venuePins(items: readonly ListedMatch[]): VenuePin[] {
  const pins = new Map<string, VenuePin>();
  for (const { match } of items) {
    const p = verifiedPoint(match);
    if (!p || !isGoable(match)) continue;
    const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
    const pin = pins.get(key);
    if (pin) pin.matchIds.push(match.id);
    else pins.set(key, {
      key, lat: p.lat, lng: p.lng,
      label: match.venue?.name ?? match.venue?.municipality ?? "Hřiště",
      matchIds: [match.id],
    });
  }
  return [...pins.values()];
}

export function pinKeyOf(pins: readonly VenuePin[], matchId: string): string | null {
  return pins.find((p) => p.matchIds.includes(matchId))?.key ?? null;
}

/** Vybraný zápas, který po změně filtrů už není v seznamu, se zruší. */
export function reconcileSelection(selectedId: string | null, items: readonly ListedMatch[]): string | null {
  return selectedId !== null && items.some((i) => i.match.id === selectedId) ? selectedId : null;
}
