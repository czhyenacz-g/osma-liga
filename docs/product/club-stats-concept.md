# Klubové statistiky — koncept

## Aktuální stav (implementováno)

### Body klubů — systém 3/1/0

Každý online zápas uděluje body podle výsledku:

- výhra = 3 body
- remíza = 1 bod pro každý klub
- prohra = 0 bodů

Body se počítají při uložení online výsledku (`saveOnlineMatchResult`) a ukládají se do `OsmaOnlineMatch.homeClubPoints` / `awayClubPoints`.

Starší zápasy bez uložených bodů mají fallback: body se dopočítají ze skóre v reálném čase při agregaci.

### DB schéma

```prisma
model OsmaOnlineMatch {
  ...
  homeClubId     String?
  awayClubId     String?
  homeClubPoints Int?    // 3/1/0, null u starých zápasů bez klubů
  awayClubPoints Int?
}
```

Migrace: `20260618000003_add_club_points_to_online_matches`

### API endpointy

- `GET /api/osma-liga/clubs/:slug/stats` — veřejný, bez API klíče
  - Vrací: matches, wins, draws, losses, goalsFor, goalsAgainst, goalDifference, points
  - Zápasy bez klubu jsou ignorovány v agregaci
  - Endpoint nepadá na starých zápasech

- `GET /api/osma-liga/online-matches` a `/:id` — nyní obsahují `homeClubPoints`/`awayClubPoints`

### Frontend

- **Detail zápasu** (`/zapasy/[id]`): zobrazuje "+N bod(y) pro klub" u každého klubu
- **Detail klubu** (`/kluby/[slug]`): blok "Statistiky klubu" s tabulkou zápasy/výhry/remízy/prohry/skóre/rozdíl/body

## Co zatím NENÍ implementováno

- Top hráči — příští krok
- Sezóny — nejsou v plánu pro MVP
- Tabulka všech klubů — možný další krok
- Týdenní reset bodů — není v plánu
- Osobní XP hráčů

## Další kroky (návrh)

1. Tabulka klubů na `/kluby` seřazená podle bodů
2. Top hráči na detailu klubu (podle počtu výher s daným klubem)
3. Sezóny — reset bodů po určitém počtu zápasů nebo datum
