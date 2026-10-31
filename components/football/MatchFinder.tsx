"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  LEAGUE_LEVELS,
  filterMatches,
  formatDay,
  formatKickoff,
  navigationUrl,
  pinKeyOf,
  reconcileSelection,
  venuePins,
  verifiedPoint,
  type DateRange,
  type FootballMatch,
  type LeagueLevel,
  type ListedMatch,
  type MatchFilters,
  type Point,
} from "@/lib/football/matches";

// "Kam na fotbal?" — seznam + mapa nad daty z lib/football/matchSource.ts.
// Volá se jen se skutečně dostupnými daty (feed "ok"); pro nedostupný zdroj
// je tu MatchFinderUnavailable bez ovládání a bez mapy.

// Leaflet se stahuje až ve chvíli, kdy je co ukázat (zápas s ověřeným hřištěm).
const MatchMap = dynamic(() => import("@/components/football/MatchMap"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-gray-500">Načítám mapu…</p>,
});

const RANGES: { value: DateRange; label: string }[] = [
  { value: "today", label: "Dnes" },
  { value: "tomorrow", label: "Zítra" },
  { value: "next3days", label: "3 dny" },
  { value: "weekend", label: "Víkend" },
];

const RADII = [10, 25, 50, 100] as const;

type GeoState = "idle" | "locating" | "ok" | "denied" | "error";

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

function chip(active: boolean): string {
  return `min-h-[44px] rounded-lg border px-3 text-sm font-semibold transition ${
    active
      ? "border-green-800 bg-green-800 text-white"
      : "border-gray-300 bg-white text-gray-700 hover:border-green-700"
  }`;
}

export default function MatchFinder({
  matches,
  sourceName,
  demo = false,
  defaultLeague,
  initialNowMs,
}: {
  matches: FootballMatch[];
  sourceName: string;
  demo?: boolean;
  defaultLeague: LeagueLevel | null;
  /** Čas serveru pro první render (shoda s hydratací); pak se bere čas prohlížeče. */
  initialNowMs: number;
}) {
  const [nowMs, setNowMs] = useState(initialNowMs);
  const [filters, setFilters] = useState<MatchFilters>({
    range: "next3days",
    league: defaultLeague,
    radiusKm: null,
    place: "",
    sort: "time",
  });
  const [user, setUser] = useState<Point | null>(null);
  const [geo, setGeo] = useState<GeoState>("idle");
  const [mode, setMode] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDesktop = useIsDesktop();
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    setNowMs(Date.now());
    const t = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const { items, hiddenWithoutLocation } = useMemo(
    () => filterMatches(matches, filters, nowMs, user),
    [matches, filters, nowMs, user],
  );
  const pins = useMemo(() => venuePins(items), [items]);

  // Vybraný zápas, který po změně filtrů zmizel ze seznamu, se zruší.
  const selected = reconcileSelection(selectedId, items);
  useEffect(() => {
    if (selected !== selectedId) setSelectedId(selected);
  }, [selected, selectedId]);
  const selectedPin = selected ? pinKeyOf(pins, selected) : null;

  const set = <K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeo("error");
      return;
    }
    setGeo("locating");
    // Poloha zůstává jen v paměti stránky — neukládá se ani neodesílá.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("ok");
      },
      (err) => setGeo(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  function forgetLocation() {
    setUser(null);
    setGeo("idle");
    setFilters((f) => ({ ...f, radiusKm: null, sort: "time" }));
  }

  function selectFromPin(key: string) {
    const pin = pins.find((p) => p.key === key);
    if (!pin) return;
    setSelectedId(pin.matchIds[0]);
    if (isDesktop) itemRefs.current.get(pin.matchIds[0])?.scrollIntoView({ block: "nearest" });
  }

  const showMap = pins.length > 0;

  return (
    <section aria-labelledby="kam-na-fotbal" className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <h2 id="kam-na-fotbal" className="text-xl font-black text-gray-900">
        Kam na fotbal?
      </h2>
      {demo && (
        <p role="note" className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          DEMO — všechny zápasy, týmy i hřiště jsou fiktivní a slouží jen k ověření rozhraní.
        </p>
      )}

      {/* Filtry */}
      <div className="mt-4 space-y-3">
        <fieldset>
          <legend className="sr-only">Termín</legend>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button key={r.value} type="button" aria-pressed={filters.range === r.value}
                className={chip(filters.range === r.value)} onClick={() => set("range", r.value)}>
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-2">
          {geo === "ok" ? (
            <button type="button" className={chip(true)} onClick={forgetLocation}>
              Poloha nastavena · zrušit
            </button>
          ) : (
            <button type="button" className={chip(false)} onClick={locate} disabled={geo === "locating"}>
              {geo === "locating" ? "Zjišťuji polohu…" : "Moje poloha"}
            </button>
          )}
          <label className="flex min-w-0 flex-1 basis-48">
            <span className="sr-only">Obec nebo hřiště</span>
            <input
              type="search"
              value={filters.place}
              onChange={(e) => set("place", e.target.value)}
              placeholder="Obec nebo hřiště v rozpisu"
              className="min-h-[44px] w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            />
          </label>
        </div>
        {geo === "denied" && (
          <p className="text-sm text-gray-600">
            Přístup k poloze je zamítnutý. Zápasy můžeš procházet i bez něj — nebo napiš obec do pole výše.
          </p>
        )}
        {geo === "error" && (
          <p className="text-sm text-gray-600">Polohu se nepodařilo zjistit. Zkus to znovu, nebo napiš obec.</p>
        )}

        <div className="flex flex-wrap gap-2">
          <label className="flex flex-col text-xs font-semibold text-gray-600">
            Soutěž
            <select
              value={filters.league ?? "all"}
              onChange={(e) => set("league", e.target.value === "all" ? null : (Number(e.target.value) as LeagueLevel))}
              className="mt-1 min-h-[44px] rounded-lg border border-gray-300 bg-white px-2 text-sm font-normal text-gray-900"
            >
              <option value="all">Všechny (3.–7. liga)</option>
              {LEAGUE_LEVELS.map((l) => (
                <option key={l} value={l}>{l}. liga</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs font-semibold text-gray-600">
            Vzdálenost
            <select
              value={filters.radiusKm ?? "any"}
              disabled={!user}
              onChange={(e) => set("radiusKm", e.target.value === "any" ? null : Number(e.target.value))}
              className="mt-1 min-h-[44px] rounded-lg border border-gray-300 bg-white px-2 text-sm font-normal text-gray-900 disabled:opacity-50"
            >
              <option value="any">Bez omezení</option>
              {RADII.map((r) => (
                <option key={r} value={r}>do {r} km</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs font-semibold text-gray-600">
            Řazení
            <select
              value={filters.sort}
              disabled={!user}
              onChange={(e) => set("sort", e.target.value as MatchFilters["sort"])}
              className="mt-1 min-h-[44px] rounded-lg border border-gray-300 bg-white px-2 text-sm font-normal text-gray-900 disabled:opacity-50"
            >
              <option value="time">Nejbližší výkop</option>
              <option value="distance">Nejbližší hřiště</option>
            </select>
          </label>
        </div>
        {!user && <p className="text-xs text-gray-500">Vzdálenost a řazení podle ní fungují po zapnutí „Moje poloha“.</p>}
      </div>

      {/* Přepínač Seznam / Mapa — jen mobil */}
      {showMap && (
        <div role="group" aria-label="Zobrazení" className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
          <button type="button" aria-pressed={mode === "list"} className={chip(mode === "list")} onClick={() => setMode("list")}>
            Seznam
          </button>
          <button type="button" aria-pressed={mode === "map"} className={chip(mode === "map")} onClick={() => setMode("map")}>
            Mapa
          </button>
        </div>
      )}

      <div className={`mt-4 ${showMap ? "lg:grid lg:grid-cols-[11fr_9fr] lg:gap-6" : ""}`}>
        <div className={showMap && mode === "map" ? "hidden lg:block" : ""}>
          <p className="mb-2 text-sm text-gray-600" aria-live="polite">
            {items.length === 0
              ? "Pro zvolený termín a filtry tu žádný zápas nemáme."
              : `${items.length} ${items.length === 1 ? "zápas" : items.length < 5 ? "zápasy" : "zápasů"}`}
            {hiddenWithoutLocation > 0 &&
              ` · ${hiddenWithoutLocation} bez ověřeného místa skryto filtrem vzdálenosti`}
          </p>
          <ol className="space-y-3" data-testid="match-list">
            {items.map((item) => (
              <MatchCard
                key={item.match.id}
                item={item}
                selected={item.match.id === selected}
                onMapAvailable={pinKeyOf(pins, item.match.id) !== null}
                onSelect={() => setSelectedId(item.match.id)}
                onShowOnMap={() => {
                  setSelectedId(item.match.id);
                  setMode("map");
                }}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.match.id, el);
                  else itemRefs.current.delete(item.match.id);
                }}
              />
            ))}
          </ol>
        </div>

        {showMap && (
          <div className={mode === "list" ? "hidden lg:block" : ""}>
            <div className="h-[60vh] max-h-[520px] min-h-[320px] overflow-hidden rounded-xl border border-gray-200 lg:sticky lg:top-4 lg:h-[560px] lg:max-h-none">
              {(isDesktop || mode === "map") && (
                <MatchMap pins={pins} items={items} selectedKey={selectedPin} onSelectPin={selectFromPin} user={user} />
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Na mapě jsou jen hřiště s ověřenou polohou. Vzdálenosti jsou vzdušnou čarou.
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">Zdroj termínů: {sourceName}</p>
    </section>
  );
}

function MatchCard({
  item,
  selected,
  onMapAvailable,
  onSelect,
  onShowOnMap,
  ref,
}: {
  item: ListedMatch;
  selected: boolean;
  onMapAvailable: boolean;
  onSelect: () => void;
  onShowOnMap: () => void;
  ref: (el: HTMLLIElement | null) => void;
}) {
  const { match: m, distanceKm } = item;
  const nav = navigationUrl(m);
  const place = m.venue?.name ?? m.venue?.municipality;
  const placeDetail = m.venue?.name ? (m.venue.address ?? m.venue.municipality) : m.venue?.address;
  const cancelled = m.status === "cancelled";
  const postponed = m.status === "postponed";

  return (
    <li
      ref={ref}
      data-match-id={m.id}
      aria-current={selected ? "true" : undefined}
      className={`rounded-xl border bg-white p-4 ${selected ? "border-amber-500 ring-2 ring-amber-400" : "border-gray-200"}`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <span className="block text-sm font-bold text-green-900">
          {postponed ? (
            <>Odloženo — nový termín zatím není (původně {formatDay(m)})</>
          ) : (
            <time dateTime={m.kickoffAt} className={cancelled ? "line-through" : ""}>{formatKickoff(m)}</time>
          )}
          {cancelled && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">Zrušeno</span>}
          {m.status === "unconfirmed" && (
            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-700">Termín nepotvrzen</span>
          )}
        </span>
        <span className="block mt-1 text-base font-black text-gray-900 break-words">
          {m.homeTeam} – {m.awayTeam}
        </span>
        <span className="block mt-0.5 text-xs text-gray-500">
          {m.leagueName}{m.group ? ` · ${m.group}` : ""}
        </span>
        <span className="block mt-2 text-sm text-gray-700 break-words">
          {place ?? "Místo zatím nepotvrzeno"}
          {placeDetail ? <span className="text-gray-500"> · {placeDetail}</span> : null}
          {distanceKm !== null && !cancelled && (
            <span className="font-semibold"> · {distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km vzdušnou čarou</span>
          )}
        </span>
        {!verifiedPoint(m) && !cancelled && (
          <span className="block mt-1 text-xs text-amber-800">Přesná poloha hřiště není ověřená — navigaci nenabízíme.</span>
        )}
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {nav && (
          <a href={nav} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-lg px-4 text-sm font-bold"
            style={{ background: "#d6a94a", color: "#052e1a" }}>
            Navigovat na hřiště
          </a>
        )}
        {onMapAvailable && (
          <button type="button" onClick={onShowOnMap}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 lg:hidden">
            Na mapě
          </button>
        )}
        {m.sourceUrl ? (
          <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-gray-500 underline">
            Zdroj{m.sourceName ? `: ${m.sourceName}` : ""}
          </a>
        ) : m.sourceName ? (
          <span className="text-xs text-gray-400">Zdroj: {m.sourceName}</span>
        ) : null}
        <span className="ml-auto text-[11px] text-gray-300">ID {m.id}</span>
      </div>
    </li>
  );
}

/** Poctivý stav bez ověřeného zdroje: žádné filtry, mapa ani fiktivní zápasy. Bez JS stejný. */
export function MatchFinderUnavailable() {
  return (
    <section aria-labelledby="kam-na-fotbal" className="rounded-xl border border-gray-200 bg-gray-50 p-6" data-testid="match-finder-unavailable">
      <h2 id="kam-na-fotbal" className="text-xl font-black text-gray-900">
        Kam na fotbal?
      </h2>
      <p className="mt-2 text-base font-semibold text-gray-800">Rozpis zápasů zatím připravujeme.</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">
        Chceme vám ukazovat nejbližší fotbalové zápasy v okolí včetně cesty na hřiště. Na ověřeném zdroji termínů
        právě pracujeme.
      </p>
    </section>
  );
}
