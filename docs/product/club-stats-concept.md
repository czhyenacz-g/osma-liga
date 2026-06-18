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
  - Vrací: `stats` (matches/wins/draws/losses/goalsFor/goalsAgainst/goalDifference/points) + `topPlayers[]`
  - Zápasy bez klubu jsou ignorovány v agregaci
  - Endpoint nepadá na starých zápasech
  - `discordId` se nikdy nevrací

- `GET /api/osma-liga/online-matches` a `/:id` — obsahují `homeClubPoints`/`awayClubPoints`

### Top hráči klubu

- Počítají se jen přihlášení hráči (`OsmaUser` — přihlášení přes Discord)
- Anonymní hráči (null `userId`) se ignorují
- Body hráče = součet `homeClubPoints`/`awayClubPoints` z jeho zápasů za daný klub (3/1/0 za zápas)
- Řazení: body DESC → výhry DESC → rozdíl skóre DESC → góly DESC → jméno ASC
- Vrací top 5, prázdné pole pokud žádní přihlášení hráči
- Sezóny a týdenní reset nejsou implementované — všechna data jsou kumulativní

### Frontend

- **Detail zápasu** (`/zapasy/[id]`): zobrazuje "+N bod(y) pro klub" u každého klubu
- **Detail klubu** (`/kluby/[slug]`):
  - blok "Statistiky klubu" — zápasy/výhry/remízy/prohry/skóre/rozdíl/body
  - blok "Nejlepší hráči" — top 5 s avatarem, jménem, body/zápasy/výhrami
  - empty state pro kluby bez přihlášených hráčů

## Co zatím NENÍ implementováno

- Sezóny — nejsou v plánu pro MVP
- Týdenní reset bodů — není v plánu
- Osobní XP hráčů
- Globální žebříček hráčů
- Tabulka všech klubů seřazená podle bodů

## Další kroky (návrh)

1. Tabulka klubů na `/kluby` seřazená podle bodů
2. Sezóny — reset bodů po určitém počtu zápasů nebo datum
