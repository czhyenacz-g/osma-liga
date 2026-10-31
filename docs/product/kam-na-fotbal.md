# Kam na fotbal? — vyhledávač zápasů 3.–7. ligy

Jedna implementace pro stránky `/treti-liga` … `/sedma-liga`. Výchozí soutěž
stránky je `matchFinderLevel` v `lib/leagueLandingPages.ts`. `/osma-liga` vyhledávač nemá.

| Vrstva | Soubor |
|---|---|
| Datový model, validace, čas (Europe/Prague), filtry, vzdálenost, navigace, piny | `lib/football/matches.ts` |
| Načítání dat (jediné napojení na zdroj) | `lib/football/matchSource.ts` → `getUpcomingMatches()` |
| Demo data (jen testy a `/dev/football-matches`) | `lib/football/demoMatches.ts` |
| UI: filtry, seznam a karty, přepínač Seznam/Mapa | `components/football/MatchFinder.tsx` |
| Mapa (Leaflet, načítaná dynamicky) | `components/football/MatchMap.tsx` |

## Stav dat

`getUpcomingMatches()` dnes vrací `{ status: "unavailable" }`. Ligové stránky pak
ukazují jen staticky vykreslenou zprávu „Rozpis zápasů zatím připravujeme.“:
bez filtrů, bez mapy a bez Leafletu v prohlížeči.

### Napojení skutečného zdroje

V `getUpcomingMatches()`:

1. Načti záznamy z jednoho zdroje, například:
   - JSON v repu;
   - kolekci v Content API;
   - feed schváleného partnera.
2. Každý záznam projdi přes `normalizeMatch()`. Neplatné záznamy (bez týmů, liga mimo 3–7, datum bez časové zóny) vypadnou.
3. Vrať `{ status: "ok", matches, sourceName }`.
4. Při chybě zdroje vrať `unavailable`, nikdy `[]`.

Stránky jsou statické. S živým zdrojem přidej do `app/<liga>/page.tsx`
`export const revalidate = 3600` (ISR), jinak se data obnoví až dalším deployem.

### Pravidla pro data

- **Souřadnice hřiště:**
  - `venue.verified: true` jen pro skutečné hřiště konkrétního utkání;
  - nikdy střed obce ani sídlo klubu;
  - bez ověření se nezobrazí pin, vzdálenost ani navigace.
- **Status:** chybějící status se bere jako `unconfirmed`. Utkání `postponed` a `cancelled` nemají pin ani navigaci a u odloženého se neukazuje původní čas.
- **Žádná strukturovaná data `SportsEvent`**, dokud nejsou utkání ověřená.

## Mapové podklady

Mapová vrstva se nastavuje přes env:

- `NEXT_PUBLIC_MAP_TILE_URL` (výchozí `https://tile.openstreetmap.org/{z}/{x}/{y}.png`);
- `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` (výchozí © OpenStreetMap).

Veřejný OSM tile server je podle
[Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) jen
pro nízký provoz, s atribucí a bez SLA. Dnes ho používá jen neindexovaná demo
routa. **Před zapnutím reálných dat na produkci** nastav poskytovatele s
podmínkami pro produkci a uvedenou atribucí. Možnosti:

- **Mapy.com API:** free tier s API klíčem;
- **MapTiler, Stadia Maps:** free tier;
- **vlastní tile server.**

Klíč patří do env Vercelu, ne do repa. Placená služba se automaticky nezapíná.

## Ruční lokalita

V repu není seznam obcí ani geokódování. Pole „Obec nebo hřiště v rozpisu“
proto jen textově filtruje utkání podle obce nebo hřiště (bez ohledu na
diakritiku). Nepředstírá našeptávač a vzdálenost nepočítá.

Geokódování obce na souřadnice by šlo přidat jako samostatnou funkci se
seznamem obcí ČÚZK/RÚIAN v repu, bez volání placené služby.

## Poloha uživatele

- Zjišťuje se až po kliknutí na „Moje poloha“ (`enableHighAccuracy: false`).
- Drží se jen v paměti stránky: neukládá se, neodesílá se a nejde do analytiky.
- Vzdálenost je vzdušnou čarou (Haversine), bez odhadu doby jízdy.

## Demo

`/dev/football-matches?liga=3` … `7`:

- fiktivní utkání rozložená kolem aktuálního času;
- stránka je `noindex`;
- na produkci (`VERCEL_ENV=production`) vrací 404, je dostupná lokálně a na preview deploymentech.
