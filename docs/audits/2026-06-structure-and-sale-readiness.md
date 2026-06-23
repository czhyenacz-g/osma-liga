# Audit: struktura, kvalita kódu a připravenost k převzetí/prodeji

Datum: 2026-06-23
Rozsah: `osma-liga` (frontend, Vercel) + `project-hub-api` (backend, Hetzner)
Cíl: zmapovat stav pro budoucího vlastníka/partnera/kupce. Žádné funkční změny, žádný velký refactoring.

---

## 1. Audit struktury souborů

### osma-liga (frontend)

- `app/` — Next.js App Router: 6 ligových landing pages, herní routy (`/hra/bot`, `/hra/online`,
  `/hra/multiplayer`), zápasy, kluby, profil, API proxy routy (auth, match-results, online-games,
  training-challenges). Orientace dobrá, routy odpovídají URL struktuře webu.
- `components/` — rozdělené na `game/`, `online/`, `league/`, `auth/`, `ui/`. Logické dělení podle
  domény, žádné "god komponenty" mimo pár výjimek (viz kapitola 2).
- `game/` — klientský (browser) herní engine pro singleplayer. Samostatné soubory pro update loop,
  rendering, fyziku, AI, vstup, zvuk — rozumně modulární.
- `lib/` — sdílené utility: auth/session (HMAC), audio, geo (EU gate), formátování, SEO, herní pomocné
  funkce. V pořádku.
- `data/` — statická data klubů a zvukové banky. V pořádku, čistě oddatováno od logiky.
- `scripts/` — dva obrazové skripty (slice loga, konverze pozadí) — jednorázové nástroje, nejsou
  součástí běhu appky.
- `prisma/` — jediný model `MatchResult`, používaný jen pro lokální/legacy účely; primární datový
  zdroj je backend.

**Nález:** struktura je čitelná a logická, žádné chaotické rozházení souborů. Hlavní slabina nejsou
zdrojové soubory, ale **kořenový adresář a `public/`** — viz níže.

### project-hub-api (backend)

- `src/shared/` — auth hooky (API klíč, cron bearer token), logger, error helpery. Malé, čisté.
- `src/gameEngine/` — serverový (autoritativní) herní engine: `tick.ts` (499 řádků), `onlineGames.ts`
  (432 řádků), `onlineMatchResultService.ts` (366 řádků), plus menší moduly (AI, fyzika, konstanty,
  chování týmu, dočasné odstranění hráče).
- `src/modules/osmaLiga/` — byznys logika: routy pro výsledky, online hry, tréninkové výzvy, seed
  klubů.
- `src/ws/` — Socket.IO handler pro realtime multiplayer (103 řádků).
- `prisma/` — 4 modely (`OsmaMatchResult`, `OsmaOnlineMatch`, `OsmaUser`, `OsmaClub`,
  `OsmaOnlineMatchEvent`), 7 migrací, jedna ruční reconciliace zdokumentovaná v
  `docs/operations/prisma-migration-reconciliation.md`.
- `docs/operations/` a `docs/ops/` — solidní provozní dokumentace (nasazení, backupy, cron, lobby,
  multiplayer protokol, migrace) — nadprůměrné pro projekt této velikosti.

**Nález:** backend má lepší dokumentační hygienu než by se čekalo u hobby projektu — to je plus pro
prodej. Struktura kódu je přehledná, moduly odpovídají odpovědnostem.

### Balast a junk soubory (nalezeno v `git status` / `public/`)

V kořenovém adresáři `osma-liga` a `public/` se nachází needitorské/needitovatelné soubory, které
**nepatří do repozitáře produktu k prodeji**:

- `.DS_Store` (root i `public/.DS_Store`) — macOS metadata, nikdy by nemělo být v gitu.
- `ChatGPT Image 16. 6. 2026 16_51_22.png`, `ChatGPT Image 16. 6. 2026 19_57_36.png` — pracovní
  screenshoty z generování obrázků, ~1–1.6 MB každý.
- `banners (kopie).png`, `nahoda_banner (kopie).webp` — zálohové kopie assetů s "(kopie)" v názvu —
  vypadá to jako provizorní práce, ne finální asset pipeline.
- `predloha.png` (2.5 MB) — "předloha" (template/reference), nejasné, zda se používá v kódu.
- `TODO.md` v rootu — funkčně v pořádku jako poznámka, ale patří spíš do `docs/product/` než do
  kořene repozitáře, který si prohlíží každý nový vývojář/kupec jako první.

**Dopad na prodej:** nic z toho není bezpečnostní riziko, ale je to první věc, kterou uvidí kupec při
`ls` nebo `git clone`. Působí to neuspořádaně a snižuje vnímanou profesionalitu repozitáře.

---

## 2. Audit kvality kódu

### Velké soubory (nad ~400 řádků)

| Soubor | Repo | Řádky | Komentář |
|---|---|---|---|
| `src/gameEngine/tick.ts` | backend | 499 | Hlavní herní smyčka — fyzika, pohyb, AI, gól. Hustý, ale jde o jádro enginu — čekatelné. |
| `src/gameEngine/onlineGames.ts` | backend | 432 | Správa lobby, TTL, tokeny. Kandidát na rozdělení (lobby lifecycle vs. token validace). |
| `components/game/MatchPageClient.tsx` | frontend | 428 | Životní cyklus zápasu + state machine ukládání výsledku. |
| `app/hra/online/[code]/page.tsx` | frontend | 419 | Lobby logika online hry. |
| `game/updateGame.ts` | frontend | 402 | Klientský tick — pohyb, fyzika, AI, rohový clear, detekce gólu. |
| `src/gameEngine/onlineMatchResultService.ts` | backend | 366 | Blízko hranice, sledovat při dalších změnách. |

Žádný ze souborů nepřesahuje rozumnou míru pro herní engine, ale `tick.ts` a `onlineGames.ts` jsou
první kandidáti, pokud se bude engine dál rozšiřovat (stamina, fauly, karty by je ještě zvětšily).

### Duplicitní/rizikové vzory

- **Dva nezávislé herní enginy** (klient vs. server) se stejnou fyzikou implementovanou dvakrát s
  různými datovými konvencemi (`{pos:{x,y}, vel:{x,y}}` vs `{x,y,vx,vy}`). Detailně v kapitole 6 a v
  `docs/architecture/overview.md`.
- Backend: žádné komentáře typu TODO/FIXME nalezeny — kód je buď hotový, nebo bez stopy po rozpracovanosti.
- Frontend: jediný TODO (`lib/leagueLandingPages.ts:8`, hostname routing — nízká priorita, popsáno).
- `console.log`/`console.error`/`console.warn` výskyty na obou stranách jsou ladicí/error výpisy, ne
  úniky citlivých dat. Backend nemá strukturované logování (Fastify má `pino` k dispozici, ale
  nevyužitý) — pro produkční monitoring je to slabina, ne bezpečnostní díra.
- Hardcoded Discord CDN URL v backendu (`cdn.discordapp.com/avatars/...`) — funkční, ale bez fallbacku
  při výpadku CDN. Nízká priorita.

### Testy

- **Žádné testy v žádném repozitáři** (frontend ani backend) — 0 `.test.ts`/`.spec.ts` souborů.
  Nejkritičtější mezera je u herní fyziky (`tick.ts`, `physics.ts`, `updateGame.ts`) — regrese se dnes
  odhalí jen ručním odehráním zápasu.

---

## 3. Audit dokumentace

**Co je dobré:**
- Backend má nadstandardní provozní dokumentaci (`docs/operations/`, `docs/ops/`): nasazení, zálohy,
  lobby lifecycle, multiplayer protokol, migrace, cron pro tréninkové výzvy.
- Frontend má 4 existující interní audity herní logiky (`docs/audits/*.md`) — kvalitní, konkrétní,
  s jasnými doporučeními (fázovaný postup, žádný big-bang rewrite).
- `README.md` v obou repozitářích popisuje setup smysluplně.

**Co chybí (a tento audit to částečně řeší):**
- Neexistoval jednostránkový "card" popisující projekt jako celek pro nového člověka — nyní
  `PROJECT_CARD.md`.
- Neexistoval jednotný přehled architektury napříč oběma repozitáři (frontend i backend dohromady) —
  nyní `docs/architecture/overview.md`.
- Neexistoval provozní runbook spojující Vercel + Hetzner + cron + DB do jednoho dokumentu — nyní
  `docs/ops/production-runbook.md`.
- Chybí dokumentovaný postup obnovy ze zálohy (backup *restore*), pouze zálohování je popsané.

---

## 4. Audit provozní připravenosti

| Oblast | Stav | Komentář |
|---|---|---|
| Nasazení frontendu | OK | Vercel, standardní Next.js flow. |
| Nasazení backendu | Manuální | SSH + `git pull` + `docker compose up` na Hetzneru. Žádné CI/CD. |
| Databáze | OK, ale izolovaná | PostgreSQL v Docker síti, bez veřejného portu — bezpečné, ale závislé na jednom serveru. |
| Zálohy DB | Jen lokální | Denní cron (03:17), 14denní rotace, **bez off-server kopie**. |
| Obnova ze zálohy | Nedokumentováno | Záloha existuje, restore postup ne. |
| Monitoring/alerting | Chybí | Žádné metriky, žádné alerty při výpadku. |
| Cron joby | OK, zdokumentováno | Tréninkové výzvy (hodinově 06–22h), DB backup (denně). |
| HTTPS | OK | Nginx + Certbot, auto-renew (cert do 2026-09-15 dle interní dokumentace — ověřit blíže k datu). |
| CI/CD | Chybí | Žádné GitHub Actions ani jiný pipeline. |

---

## 5. Audit bezpečnosti

**V pořádku:**
- Žádné hardcoded secrets v kódu (ověřeno v obou repozitářích).
- Auth secrety (`AUTH_SECRET`, `DISCORD_CLIENT_SECRET`, `PROJECT_HUB_API_KEY`) jsou server-side only,
  žádný `NEXT_PUBLIC_` leak.
- Session cookie: HMAC-SHA256 signed, httpOnly, sameSite=lax, secure v produkci — solidní řešení bez
  zbytečných závislostí (žádný JWT decode-only risk).
- OAuth state ověřován, API klíč i cron token používají bezpečné (timing-safe) porovnání.
- PostgreSQL nedostupné z internetu, port backendu vázán jen na localhost za reverzní proxy.
- Prisma ORM všude — žádné riziko SQL injection.

**Rizika:**
- **Chybí rate limiting** na API endpointech backendu — jediná ochrana je API klíč. Riziko brute-force
  / zneužití zdrojů.
- **WebSocket bez ověření identity hráče** — připojení k herní místnosti vyžaduje jen `gameCode` +
  `playerToken` (128bit entropie, kryptograficky OK), ale nic neváže token na konkrétní Discord
  identitu uživatele. Kdokoliv se znalostí kódu hry se může pokusit připojit.
- **Žádné per-socket throttling vstupů** — klient může zahltit server vstupními eventy.
- **Zálohy DB jen na stejném serveru** — viz kapitola 4, bezpečnostní i provozní riziko zároveň.

---

## 6. Duplicitní logika mezi herními módy / enginy

Toto je největší **strukturální** (ne bezpečnostní) riziko projektu, podrobně už zmapované ve
4 interních dokumentech (`docs/audits/engine-unification-plan.md`,
`docs/audits/game-logic-regression-after-unification.md`,
`docs/audits/game-mode-logic-differences.md`,
`docs/refactoring/gameplay-code-structure-review.md`):

- Existují **dva nezávislé enginy**: klientský (`game/` v `osma-liga`, používá ho jen `/hra/bot`) a
  serverový (`src/gameEngine/` v `project-hub-api`, používá ho jak multiplayer, tak tréninkové výzvy —
  trénink je multiplayer s AI na domácí straně, ne třetí engine).
- Stejné herní konstanty, fyzika míče, kontrola míče, "corner clear" logika a vykreslování hřiště jsou
  ručně duplikované mezi repozitáři s odlišnými datovými konvencemi.
- Vlastní gól (own-goal) je dnes funkční **jen v `/hra/bot`** — serverový engine sledování posledního
  dotyku míče (`lastTouch`) ještě nemá.
- Interní audity **explicitně nedoporučují** big-bang sjednocení (jiný runtime, jiný transport, jiné
  repo) a navrhují fázovaný postup: (0) extrakce UI, (1) sladění datových konvencí v serverovém enginu,
  (2) parity testy. Tento audit se s tímto doporučením shoduje a nepřidává nic nového nad rámec — jen ho
  potvrzuje jako stále platné.
- **Riziko pro budoucí vývoj:** každá nová mechanika (stamina, fauly, karty) by se musela psát na 4
  místech (`game/types.ts`, `game/updateGame.ts`, server `types.ts`, server `tick.ts`) bez sdíleného
  kódu — to je důležité upozornění pro kupce/nového vývojáře, ne jen poznámka pro current tým.

---

## 7. Audit připravenosti na převzetí/prodej

**Co zvyšuje důvěryhodnost:**
- Existující interní audity a provozní dokumentace ukazují, že projekt byl vedený s rozvahou, ne
  narychlo "vibe-coded" bez přemýšlení.
- Žádné nalezené úniky secrets, žádné vypnuté auth kontroly.
- Jasné oddělení frontend/backend odpovědností (frontend = UI + proxy, backend = pravda o datech a
  herní stav).

**Co snižuje důvěryhodnost (a je snadné to opravit bez rizika):**
- Balast v `public/` a rootu (ChatGPT screenshoty, `.DS_Store`, "(kopie)" soubory) — první dojem při
  code review.
- Chybějící testy — kupec/nový vývojář nemá žádnou jistotu, že refaktoring nerozbije herní fyziku.
- Chybějící CI/CD — nasazení je "tribal knowledge" (SSH + ruční kroky), ne repakovatelný proces.
- Dvě kopie herní logiky bez sdíleného kódu — nutné to transparentně komunikovat, aby to kupce
  nepřekvapilo při code review po podpisu.

---

## 8. Seznam rizik podle priority

**P0 — kritická, řešit první**
- Žádná off-server záloha databáze (riziko úplné ztráty dat).
- Žádný dokumentovaný postup obnovy ze zálohy.

**P1 — vysoká, řešit brzy**
- Chybí rate limiting na backend API a WebSocketu.
- WebSocket bez vazby tokenu na ověřenou identitu hráče.
- Nulové testy na herní fyzice a auth/cron endpointech.

**P2 — střední, plánovat**
- Duplicitní herní logika mezi `osma-liga` a `project-hub-api` (engine unification — již existuje plán,
  jen ho realizovat fázovaně).
- Chybí CI/CD pro backend.
- Chybí strukturované logování (pino) na backendu.

**P3 — nízká, kosmetická/úklidová**
- Balast v `public/` a rootu (`ChatGPT*.png`, `.DS_Store`, `*(kopie)*`, `predloha.png`).
- `TODO.md` přesunout z rootu do `docs/product/`.
- Hardcoded Discord CDN URL bez fallbacku.
- `tick.ts` a `onlineGames.ts` rozdělit na menší moduly, pokud poroste engine.

---

## 9. Doporučený roadmap cleanup prací

1. **Týden 1 (P0):** Nastavit off-server zálohu (rclone/Backblaze/Storage Box) a zapsat restore postup
   do `docs/ops/production-runbook.md`. Bez kódových změn v appce.
2. **Týden 1–2 (P3, rychlé):** Odstranit balast soubory z `public/` a rootu, přesunout `TODO.md` do
   `docs/product/`. Nulové riziko, okamžitě zvyšuje důvěryhodnost repa.
3. **Týden 2–3 (P1):** Doplnit `@fastify/rate-limit` na backend, zvážit vazbu WS tokenu na Discord
   identitu (vyžaduje návrh, ne jen config).
4. **Měsíc 1–2 (P1):** Základní testovací sada (Vitest/Jest) pro `src/gameEngine` (fyzika, gól, AI) a
   pro `lib/auth/session.ts` — nejkritičtější netestovaný kód.
5. **Měsíc 2+ (P2):** Fázovaná realizace `engine-unification-plan.md` — fáze 0 a 1 (extrakce UI,
   sladění datových konvencí), bez velkého rewrite.
6. **Kontinuálně:** Strukturované logování na backendu, jednoduchý CI pipeline (lint + typecheck +
   build na PR).

Žádný z těchto kroků nevyžaduje změnu DB schématu ani zásah do produkční databáze nad rámec běžného
zálohování.
