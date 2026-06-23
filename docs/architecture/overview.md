# Architektura — přehled

> Stručný, spojený pohled na frontend i backend. Detaily herní logiky a jejich duplicit:
> `docs/audits/game-mode-logic-differences.md`, `docs/audits/engine-unification-plan.md`,
> `docs/refactoring/gameplay-code-structure-review.md`.

## Big picture

```
Hráč (prohlížeč)
   │
   ▼
osma-liga (Next.js, Vercel)
   │  - UI, ligové stránky, kluby, profily
   │  - klientský herní engine pro singleplayer (/hra/bot)
   │  - API proxy routy (auth, match-results, online-games, training-challenges)
   │  - Discord OAuth (přihlášení)
   │
   ▼ (HTTPS + WebSocket, autorizováno přes PROJECT_HUB_API_KEY)
project-hub-api (Fastify + Socket.IO, Hetzner, Docker)
   │  - serverový (autoritativní) herní engine pro multiplayer a tréninkové výzvy
   │  - byznys logika ligy (kluby, výsledky, online zápasy)
   │  - cron endpoint pro generování tréninkových výzev
   │
   ▼
PostgreSQL (Docker, interní síť, bez veřejného portu)
```

## Frontend (`osma-liga`)

- **Next.js 15 / React 19**, App Router, nasazeno na Vercelu.
- `app/` — stránky lig (8., 5., 6., 7., 3., 4. liga jako samostatné landing pages), herní routy
  (`/hra/bot`, `/hra/online`, `/hra/multiplayer`), detail zápasu, kluby, profil hráče, a API routy které
  **proxují** požadavky na backend (frontend nemá přímé DB připojení v produkci).
- `components/game/`, `components/online/`, `components/league/` — UI rozdělené podle domény.
- `lib/auth/session.ts` — vlastní session vrstva (HMAC-SHA256 signed cookie, žádný externí auth
  framework).
- `middleware.ts` — geo-gate: `/satna` a `/hra/*` jsou omezené na EU (GDPR/legislativní důvody),
  mimo EU redirect na `/obecni-prebor`.
- `prisma/schema.prisma` — jeden model `MatchResult`, legacy/lokální účel; primární zdroj pravdy je
  backend.

## Backend (`project-hub-api`)

- **Fastify 5 + Socket.IO + Prisma 6**, TypeScript, běží jako Docker kontejner na Hetzneru.
- `src/modules/osmaLiga/` — REST endpointy: výsledky zápasů, kluby/tabulky, online hry, tréninkové
  výzvy.
- `src/gameEngine/` — server-authoritative herní smyčka (`tick.ts`), správa online lobby
  (`onlineGames.ts`), AI chování (`ai.ts`, `teamBehavior.ts`), fyzika (`physics.ts`).
- `src/ws/onlineGameSocket.ts` — Socket.IO handler: `join_game`, `start_game`, `input` eventy.
- `src/shared/` — auth hooky pro API klíč (`apiKeyAuth.ts`) a cron bearer token
  (`trainingCronAuth.ts`).
- `prisma/schema.prisma` — modely `OsmaMatchResult`, `OsmaOnlineMatch`, `OsmaUser`, `OsmaClub`,
  `OsmaOnlineMatchEvent`.

## Realtime multiplayer

- Server je autoritativní: klient odesílá pouze vstup (`up/down/left/right/kick/switchPlayer`), server
  počítá fyziku a stav (tick rate ~30/s, snapshot rate ~15 Hz — viz
  `project-hub-api/docs/operations/online-multiplayer.md`).
- Lobby je **jen v paměti** (Node `Map`), žádná persistence — restart serveru = ztráta aktivních lobby.
  Lobby expiruje po 30 minutách nečinnosti.
- Vstup do hry: `gameCode` + `playerToken` (128bit entropie). Token neváže hru na ověřenou Discord
  identitu — kdokoliv se znalostí kódu hry se může pokusit připojit (zmíněno jako riziko v auditu).

## Training challenge (tréninková výzva)

- Není samostatný třetí engine — je to **multiplayer zápas s AI na domácí straně**, používá stejný
  serverový engine jako reálný multiplayer.
- Generováno hodinovým cronem na Hetzneru (06:00–22:00), endpoint
  `POST /internal/training-challenges/generate` chráněný `TRAINING_CRON_SECRET`.
- AI profil je dnes stejný jako běžný bot; `TODO.md` ve frontendu plánuje silnější/agresivnější AI
  profil specificky pro tréninkové výzvy (zatím nerealizováno).
- Veřejně se nesmí prezentovat jako "bot" — UI text používá herní jazyk ("klub hledá soupeře").

## Herní módy — shrnutí

| Mód | Engine | Kde běží | Persistence výsledku |
|---|---|---|---|
| Singleplayer vs. bot (`/hra/bot`) | klientský (`game/` ve frontendu) | v prohlížeči | `MatchResult` přes API proxy |
| Online multiplayer 1v1 (`/hra/online`) | serverový (`src/gameEngine/`) | Hetzner | `OsmaOnlineMatch` + events |
| Tréninková výzva | serverový, stejný kód jako multiplayer + AI na domácí straně | Hetzner | `OsmaOnlineMatch` + events |

Dva enginy (klientský vs. serverový) jsou **nezávislé implementace** se stejnou fyzikou ale odlišnými
datovými konvencemi (`{pos:{x,y}, vel:{x,y}}` vs. `{x,y,vx,vy}`). Detailní mapování duplicit a plán
sjednocení: `docs/audits/engine-unification-plan.md`.

## Datové toky

1. **Přihlášení:** prohlížeč → `osma-liga` `/api/auth/login` → Discord OAuth → callback →
   `osma-liga` ověří state → zavolá `project-hub-api` (`/api/osma-liga/users/discord-upsert`,
   autorizováno `PROJECT_HUB_API_KEY`) → vytvoří/aktualizuje `OsmaUser` → nastaví HMAC session cookie.
2. **Singleplayer zápas:** vše v prohlížeči, na konci POST na `osma-liga` API routu →
   `project-hub-api` `/api/osma-liga/match-results`.
3. **Online zápas:** klient se připojí přes Socket.IO na `project-hub-api` s `gameCode` +
   `playerToken` → server tickuje hru → na konci zápasu server zapíše `OsmaOnlineMatch` +
   `OsmaOnlineMatchEvent` záznamy.
4. **Tréninková výzva:** Hetzner cron → `project-hub-api` vygeneruje lobby s AI soupeřem → hráč se
   připojí stejně jako u online zápasu.

## Důležité složky a soubory

**Frontend:**
- `app/api/` — proxy routy do backendu (nikdy přímý DB přístup z klienta).
- `game/updateGame.ts`, `game/physics.ts`, `game/ai.ts` — jádro klientského enginu.
- `lib/auth/session.ts` — session/cookie logika.
- `middleware.ts` — geo-gate.
- `docs/audits/`, `docs/refactoring/` — existující interní analýzy herní logiky, čtěte před jakoukoliv
  změnou enginu.

**Backend:**
- `src/gameEngine/tick.ts` — hlavní herní smyčka serveru.
- `src/gameEngine/onlineGames.ts` — lobby lifecycle, TTL, tokeny.
- `src/modules/osmaLiga/trainingChallengeRoutes.ts` — generování tréninkových výzev.
- `src/ws/onlineGameSocket.ts` — realtime protokol.
- `docs/operations/`, `docs/ops/` — provozní dokumentace (nasazení, zálohy, migrace, cron).
