# Profil hráče — koncept

## Aktuální stav (implementováno)

`/muj-profil` je **soukromý profil přihlášeného hráče**. Žádný jiný uživatel ho nevidí — data se načítají server-side podle `osmaUserId` ze session, ne podle URL parametru.

### Co stránka zobrazuje

- avatar + jméno hráče,
- bilanci za **posledních 30 dní** (rolling window, stejně jako klubové statistiky),
- kolik bodů hráč přinesl klubům za posledních 30 dní (`clubPointsEarned`),
- breakdown podle klubů, za které hrál (`Kluby, kterým jsem pomohl`),
- **posledních 10 dokončených online zápasů** (bez ohledu na 30denní okno — to je úmyslně oddělené od formy, viz níže).

### Proč jsou recent matches mimo 30denní okno

Horní statistiky ukazují aktuální formu (posledních 30 dní). Sekce "Moje poslední zápasy" ukazuje užitečnou historii hráče — posledních 10 zápasů celkem, i kdyby byly starší než 30 dní.

### Výpočet bodů hráče

`clubPointsEarned` = součet bodů, které hráč přinesl klubům, za které hrál (`homeClubPoints`/`awayClubPoints` z `OsmaOnlineMatch`, s fallbackem na dopočet ze skóre přes `calculateClubPoints`, stejně jako u klubových statistik).

Zápasy bez klubu (`homeClubId`/`awayClubId` = null) se započítávají do celkové bilance hráče, ale nejsou v `clubs` breakdownu.

### API endpoint (`project-hub-api`)

`GET /api/osma-liga/users/:userId/profile`

- chráněný `X-Project-Hub-Key`, volá ho jen server-side `osma-liga`,
- nikdy nevrací `discordId`, e-mail ani tokeny,
- 404 `{ "error": "User not found" }`, pokud `OsmaUser` neexistuje.

### Server-side helper (`osma-liga`)

`lib/playerProfile.ts` → `getMyPlayerProfile(userId)`

- volá Hub API s `PROJECT_HUB_API_KEY`, jen server-side,
- při chybě/výpadku API vrací `null` — stránka nespadne, zobrazí se hláška, že profil se nepodařilo načíst,
- nesmí být importovaný do client komponenty.

### SEO

- `/muj-profil` má `robots: { index: false, follow: false }` v metadatech,
- `/muj-profil` je v `app/robots.ts` v `disallow`,
- `/muj-profil` **není** v `app/sitemap.ts`.

### Header

Po přihlášení vede avatar/jméno v `AuthStatus` na `/muj-profil`.

## Mimo scope (zatím neimplementováno)

- XP systém,
- denní streak,
- sestup do 9. ligy,
- globální žebříček hráčů,
- sezóny,
- editace profilu,
- veřejné profily ostatních hráčů,
- nové achievementy.

Tyto věci nejsou na roadmapě tohoto tasku — pokud se budou řešit, budou to samostatné koncepty.
