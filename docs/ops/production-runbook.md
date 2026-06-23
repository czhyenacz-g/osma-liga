# Production Runbook — Osmá liga

> Spojuje provozní informace z obou repozitářů (`osma-liga` frontend + `project-hub-api` backend) do
> jednoho dokumentu. Detailní zdroje: `project-hub-api/docs/operations/`, `project-hub-api/docs/ops/`,
> `osma-liga/docs/operations/project-hub-api.md`.

## Topologie produkce

| Komponenta | Kde běží | Poznámka |
|---|---|---|
| Frontend (`osma-liga`) | Vercel | Next.js, automatický deploy z `main` (Vercel CLI 54.1.0 lokálně — zvážit update). |
| Backend (`project-hub-api`) | Hetzner VPS (`178.104.20.225`) | Docker Compose, Nginx reverse proxy, Certbot HTTPS. |
| Databáze | Hetzner, Docker síť `project-hub-net` | PostgreSQL 17-alpine, **bez veřejného portu**. |
| Domény | `osmaliga.cz` (frontend), `api.osmaliga.cz` (backend) | DNS mimo scope tohoto repa. |

## Vercel (frontend)

- Build: `next build`, start: `next start`. `postinstall` spouští `prisma generate`.
- Env proměnné (nastavit ve Vercel dashboardu, nikdy do `.env.example` s reálnou hodnotou):
  `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOATCOUNTER_CODE` (optional), `PROJECT_HUB_API_URL`,
  `PROJECT_HUB_API_KEY`, `NEXT_PUBLIC_PROJECT_HUB_WS_URL`, `AUTH_SECRET`, `AUTH_URL`,
  `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`.
- `DATABASE_URL` se v produkci **nepoužívá** (zakomentováno) — veškerá data jdou přes
  `project-hub-api`.
- Geo-gate (`middleware.ts`) omezuje `/satna` a `/hra/*` na EU — pokud se objeví nečekané 404/redirect
  hlášení od uživatelů mimo EU, je to očekávané chování, ne bug.

## Hetzner (backend)

- Přístup: SSH na `178.104.20.225` (klíč mimo repo, neukládat sem).
- Aplikace běží jako Docker Compose stack se dvěma službami:
  - `project-hub-api` — Fastify, naslouchá na `127.0.0.1:3001` (jen localhost, ne veřejně).
  - `project-hub-postgres` — `postgres:17-alpine`, volume `project_hub_postgres_data`, žádný veřejný
    port.
- Nginx na portu 80/443 proxuje na `localhost:3001`, HTTPS přes Certbot (auto-renew; certifikát dle
  interní inventury platí do 2026-09-15 — ověřit blíž k datu, pokud auto-renew selže).
- Deploy = manuální: SSH → `git pull` → `docker compose up -d --build`. **Žádné CI/CD.**

## Docker služby — bezpečné provozní příkazy

```bash
# Stav služeb
docker compose ps

# Logy (bez -f pro jednorázový výpis, ať se neporuší terminál)
docker compose logs project-hub-api --tail=200
docker compose logs project-hub-postgres --tail=200

# Restart jen aplikační služby (DB zůstává běžet)
docker compose restart project-hub-api

# Nasazení nové verze (po git pull)
docker compose up -d --build project-hub-api

# Zdravotní kontrola
curl -s http://localhost:3001/health
```

## ZAKÁZANÉ / NEBEZPEČNÉ příkazy

**Nikdy nespouštět bez explicitního schválení vlastníka a čerstvé zálohy:**

- `docker compose down -v` — **smaže volume**, tedy celou produkční databázi. Tento příkaz byl
  explicitně vyloučen i ze zadání tohoto auditu.
- `docker compose down` (bez `-v`) — zastaví služby (výpadek), ale nesmaže data; přesto nespouštět na
  produkci bez ohlášení.
- `prisma migrate reset` — zahodí a znovu vytvoří schéma, ztráta dat.
- Jakýkoliv přímý `psql` `DELETE`/`DROP`/`TRUNCATE` na produkční databázi bez zálohy.
- `git push --force` na `main` v `project-hub-api` (může rozbít deploy bez možnosti snadného návratu).
- Mazání/přepis souborů v `/opt/backups/project-hub/daily/` ručně.

## Databáze a migrace

- Schéma se historicky zakládalo ručně SQL, poté reconciliováno přes
  `prisma migrate resolve --applied` (zdokumentováno v
  `project-hub-api/docs/operations/prisma-migration-reconciliation.md`). Od té doby 7 standardních
  migrací.
- Pro budoucí změny schématu používat `prisma migrate dev` (lokálně) → commit migrace → na produkci
  `prisma migrate deploy`. **Tento audit DB schéma neměnil a nedoporučuje měnit bez samostatného
  review.**

## Zálohy (backups)

- Denní cron na Hetzneru (`17 3 * * *`) spouští `backup-project-hub-db.sh` → `pg_dump` →
  gzip → `/opt/backups/project-hub/daily/`.
- Retence: 14 dní (starší zálohy se automaticky mazaly).
- Log: `/opt/backups/project-hub/logs/backup.log`.
- **Riziko (P0 v auditu):** záloha je jen na stejném serveru. Při ztrátě/zničení Hetzner instance
  zmizí produkční data i jejich záloha současně. Doporučení: doplnit off-server sync (rclone do
  Backblaze B2 / Hetzner Storage Box) — bylo plánováno, ale dle interní dokumentace ještě
  nerealizováno.
- **Restore postup nebyl dosud zdokumentován** — než se na produkci sáhne s čímkoliv riskantním, je
  potřeba nejprve sepsat a aspoň jednou vyzkoušet restore z `.sql.gz` zálohy na testovacím prostředí.

## Cron pro tréninkovou výzvu (training challenge)

- Hetzner crontab: `0 6-22 * * * /opt/project-hub-api/scripts/generate-training-challenge.sh`
  (hodinově, 06:00–22:00, tedy 16× denně).
- Skript volá `POST /internal/training-challenges/generate` s `Authorization: Bearer
  $TRAINING_CRON_SECRET`.
- Endpoint sám přeskočí generování, pokud už existuje aktivní tréninková výzva (ochrana proti spamu).
- Pokud `TRAINING_CRON_SECRET` není nastaven, endpoint je dle dokumentace deaktivovaný (fail-safe, ne
  fail-open).

## Monitoring

- Žádný formální monitoring/alerting v produkci (potvrzeno auditem). `GET /health` existuje, ale nic
  ho aktivně nehlídá zvenčí.
- Doporučení (mimo rozsah tohoto auditu, jen k zápisu do roadmapy): jednoduchý externí uptime check
  (např. cron + curl na vlastním stroji, nebo třetí strana) na `https://api.osmaliga.cz/health`.

## Co dělat, když něco spadne

1. `docker compose ps` — zjistit, která služba neběží.
2. `docker compose logs project-hub-api --tail=200` — najít chybu.
3. Pokud je problém v aplikaci (ne v DB): `docker compose restart project-hub-api`.
4. Pokud je podezření na poškozená data: **nezasahovat do DB ručně**, nejdřív zkontrolovat poslední
   zálohu v `/opt/backups/project-hub/daily/` a kontaktovat vlastníka před jakýmkoliv restore.
5. Frontend výpadek: zkontrolovat Vercel deployment status/log přes Vercel dashboard nebo `vercel
   logs`.
