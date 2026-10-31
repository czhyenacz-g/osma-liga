"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatKickoff, navigationUrl, type ListedMatch, type Point, type VenuePin } from "@/lib/football/matches";

// Mapové podklady: konfigurovatelné přes env, aby šlo bez změny kódu přejít
// na smluvního poskytovatele (viz docs/product/kam-na-fotbal.md). Výchozí
// tile.openstreetmap.org je jen pro nízký provoz a vyžaduje atribuci.
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

function pinIcon(count: number, selected: boolean): L.DivIcon {
  const size = selected ? 38 : 30;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    // Vybraný pin je větší a má zlatý rámeček — ne jen jiná barva.
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:#052e1a;color:#fff;font:700 ${selected ? 15 : 13}px/1 system-ui,sans-serif;border:${selected ? 4 : 2}px solid ${selected ? "#d6a94a" : "#fff"};box-shadow:0 1px 4px rgba(0,0,0,.45)">${count}</span>`,
  });
}

// Obsah popupu skládaný z DOM uzlů (textContent) — data ze zdroje se nikdy
// nevkládají jako HTML.
function popupContent(pin: VenuePin, byId: Map<string, ListedMatch>): HTMLElement {
  const root = document.createElement("div");
  root.style.minWidth = "200px";
  const title = document.createElement("strong");
  title.textContent = pin.label;
  root.appendChild(title);
  for (const id of pin.matchIds) {
    const item = byId.get(id);
    if (!item) continue;
    const row = document.createElement("div");
    row.style.marginTop = "6px";
    const when = document.createElement("div");
    when.textContent = `${formatKickoff(item.match)} · ${item.match.leagueName}`;
    const teams = document.createElement("div");
    teams.style.fontWeight = "600";
    teams.textContent = `${item.match.homeTeam} – ${item.match.awayTeam}`;
    row.append(when, teams);
    const nav = navigationUrl(item.match);
    if (nav) {
      const a = document.createElement("a");
      a.href = nav;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Navigovat na hřiště";
      row.appendChild(a);
    }
    root.appendChild(row);
  }
  return root;
}

export default function MatchMap({
  pins,
  items,
  selectedKey,
  onSelectPin,
  user,
}: {
  pins: VenuePin[];
  items: ListedMatch[];
  selectedKey: string | null;
  onSelectPin: (key: string) => void;
  user: Point | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, { marker: L.Marker; count: number; selected: boolean }>());
  const userLayer = useRef<L.CircleMarker | null>(null);
  const onSelect = useRef(onSelectPin);
  onSelect.current = onSelectPin;

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: true }).setView([49.8, 15.5], 7);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 18 }).addTo(m);
    map.current = m;
    const markerMap = markers.current;
    return () => {
      m.remove();
      map.current = null;
      markerMap.clear();
      userLayer.current = null;
    };
  }, []);

  // Piny a výřez mapy podle aktuálně filtrovaných hřišť.
  const pinsSignature = pins.map((p) => `${p.key}:${p.matchIds.join("|")}`).join(";");
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const byId = new Map(items.map((i) => [i.match.id, i]));
    // Rozběhlá animace nebo otevřený popup nad odebraným pinem by Leaflet shodil.
    m.stop();
    m.closePopup();
    for (const { marker } of markers.current.values()) marker.remove();
    markers.current.clear();
    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng], {
        icon: pinIcon(pin.matchIds.length, pin.key === selectedKey),
        title: `${pin.label} — ${pin.matchIds.length} ${pin.matchIds.length === 1 ? "zápas" : "zápasy"}`,
        keyboard: true,
      })
        .bindPopup(() => popupContent(pin, byId))
        .on("click", () => onSelect.current(pin.key))
        .addTo(m);
      markers.current.set(pin.key, { marker, count: pin.matchIds.length, selected: pin.key === selectedKey });
    }
    const points: L.LatLngExpression[] = pins.map((p) => [p.lat, p.lng]);
    if (user) points.push([user.lat, user.lng]);
    if (points.length === 1) m.setView(points[0], 13, { animate: false });
    else if (points.length > 1) m.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 13, animate: false });
    // selectedKey řeší efekt níže; tady jen při změně sady pinů.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinsSignature, user?.lat, user?.lng]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    userLayer.current?.remove();
    userLayer.current = user
      ? L.circleMarker([user.lat, user.lng], { radius: 7, color: "#1d4ed8", weight: 3, fillOpacity: 0.6 })
          .bindTooltip("Tvoje poloha (přibližně)")
          .addTo(m)
      : null;
  }, [user]);

  // Zvýraznění vybraného hřiště; mapa se na něj vystředí.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    for (const [key, entry] of markers.current) {
      const isSel = key === selectedKey;
      if (entry.selected === isSel) continue;
      entry.selected = isSel;
      entry.marker.setIcon(pinIcon(entry.count, isSel));
      entry.marker.setZIndexOffset(isSel ? 1000 : 0);
    }
    const sel = selectedKey ? markers.current.get(selectedKey) : undefined;
    if (sel) {
      m.stop();
      m.setView(sel.marker.getLatLng(), m.getZoom(), { animate: false });
      if (!sel.marker.isPopupOpen()) sel.marker.openPopup();
    }
  }, [selectedKey, pinsSignature]);

  return (
    <div
      ref={el}
      role="region"
      aria-label="Mapa hřišť vybraných zápasů (stejné zápasy jsou v seznamu)"
      data-testid="match-map"
      className="h-full w-full"
    />
  );
}
