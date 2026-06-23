# Osmá liga — Project Card

> Tento dokument je rychlá orientace pro nového vlastníka, partnera nebo kupce. Detaily jsou v `docs/`.

## Co projekt dělá

Osmá liga je webová fotbalová "liga" parodující nižší soutěže (8. liga, 5. liga, 6. liga...) s herním
režimem ve stylu retro arkádového fotbalu hraného v prohlížeči. Hráč si vybere klub, hraje zápasy proti
botovi, proti jinému hráči online (1v1 multiplayer), nebo proti "tréninkové výzvě" — pravidelně
generovanému AI soupeři, který se navenek tváří jako reálný klub hledající zápas.

Druhá vrstva projektu je "liga" jako fikční svět — kluby, tabulky, výsledky, profily hráčů — psaná
s humorem (názvy klubů, hlášky komentátora, fiktivní soupeři typu "TJ Tupoljany").

## Pro koho je

- Hráči, kteří chtějí rychlou, vtipnou arkádovou fotbálkovou zábavu v prohlížeči (žádná instalace).
- Komunita kolem Discordu — přihlášení přes Discord OAuth, sociální/komunitní rozměr.
- Potenciálně: ukázka schopností pro portfolio, nebo malý nezávislý herní/komunitní produkt k prodeji.

## Aktuální stav

- **Funkční MVP.** Singleplayer (vs bot), online multiplayer 1v1, tréninkové výzvy s AI soupeřem,
  Discord login, ukládání výsledků zápasů, tabulky klubů.
- **Verze `0.1.0`** — pre-release, žádné formální vydání.
- **Žádné testy** (frontend ani backend) — žádný Jest/Vitest/Playwright soubor v repu.
- **Žádné CI/CD** — nasazení backendu je manuální (SSH + git pull na Hetzneru), frontend jede přes Vercel.
- Provoz běží reálně (produkční domény `osmaliga.cz` / `api.osmaliga.cz`), ne jen jako demo.

## Hlavní části systému

| Část | Repo | Popis |
|---|---|---|
| Frontend | `osma-liga` (tento repo) | Next.js 15 / React 19 na Vercelu. UI, lokální (klientský) herní engine pro singleplayer, Discord login, proxy API routy. |
| Backend / realtime | `project-hub-api` (sourozenecký repo) | Fastify + Socket.IO + Prisma na Hetzneru. Server-authoritative herní engine pro multiplayer a tréninkové výzvy, databáze výsledků a klubů. |
| Databáze | PostgreSQL na Hetzneru (Docker) | Žádné přímé veřejné připojení, jen přes backend API. |
| Cron joby | Hetzner crontab | Generování tréninkových výzev (hodinově) a denní DB backup. |

Detailní architektura: `docs/architecture/overview.md`. Provozní detaily: `docs/ops/production-runbook.md`.

## Možné monetizační směry

- Komunitní/herní produkt s "battle pass"/kosmetikou (skiny klubů, jiné komentátorské hlášky) — engine
  na to není připraven, ale architektonicky to nevylučuje.
- Prodej jako hotový "starter kit" pro retro arkádový multiplayer web-fotbal (kód + engine + komunitní
  mechaniky) jinému vývojáři/studiu.
- Sponzoring/branding fiktivních klubů (humorný "product placement" v rámci ligy).
- Bez většího refaktoru **není** vhodný pro white-label nasazení pro více nezávislých komunit zároveň —
  engine a config jsou psané pro jednu instanci ligy.

## Hlavní rizika

1. **Duplikovaná herní logika mezi repozitáři** — klientský engine (`game/` v `osma-liga`) a serverový
   engine (`src/gameEngine/` v `project-hub-api`) jsou dvě nezávislé implementace stejné fyziky/AI.
   Nová mechanika (stamina, fauly, karty) by se musela psát na 4 místech bez sdíleného kódu.
2. **Žádné testy na herní fyzice ani na auth/cron endpointech** — regrese se odhalí jen manuálním
   hraním.
3. **Chybí rate limiting a CI/CD na backendu** — API i WebSocket jsou prakticky bez ochrany proti
   zneužití kromě API klíče / herního tokenu.
4. **Záloha databáze je jen lokální** (na stejném Hetzner serveru) — bez off-server kopie hrozí úplná
   ztráta dat při výpadku serveru.
5. **Repo obsahuje balast** (ChatGPT screenshoty, `.DS_Store`, "(kopie)" soubory v `public/`) — snižuje
   důvěryhodnost při code review kupujícím.

## Co zatím nedělat

- Nespojovat oba herní enginy do jednoho monorepa/balíku "velkým bangem" — interní audity
  (`docs/audits/engine-unification-plan.md`) to explicitně nedoporučují v této fázi; navrhují fázovaný
  postup (sjednocení datových konvencí → parity testy → až poté případná unifikace).
- Nepřidávat nové herní mechaniky (stamina, fauly, karty), dokud nejsou enginy alespoň datově sladěné —
  jinak roste duplikace.
- Neměnit DB schéma ani prod databázi bez migrace a backupu.
- Nezveřejňovat, že soupeři v tréninkových výzvách jsou boti (viz `TODO.md` — herní jazyk má zůstat
  "klub hledá soupeře").
