# Project Hub API — provozní poznámky

## Architektura

```
osmaliga.cz (Vercel)
  ├── server-side: components/league/RecentResults.tsx
  │     → fetch https://api.osmaliga.cz/api/osma-liga/match-results
  └── API route: app/api/match-results/route.ts
        → POST/GET https://api.osmaliga.cz/api/osma-liga/match-results
              → project-hub-api (Docker, Hetzner 178.104.20.225)
                    → PostgreSQL (Docker, interní síť)
```

## Env proměnné (Vercel)

| Proměnná | Kde se používá | Poznámka |
|---|---|---|
| `PROJECT_HUB_API_URL` | server-side pouze | `https://api.osmaliga.cz` |
| `PROJECT_HUB_API_KEY` | server-side pouze | nesmí být v client kódu |

### Bezpečnostní pravidla

- `PROJECT_HUB_API_KEY` **nesmí** mít prefix `NEXT_PUBLIC_` — to by ho vystavilo do client bundle.
- Klíč se používá pouze v `app/api/match-results/route.ts` a `components/league/RecentResults.tsx` (server component bez `'use client'`).
- `MatchPageClient.tsx` volá lokální Next.js route `/api/match-results`, **ne** Hub API přímo — klíč nikdy neopustí server.

### DATABASE_URL

`osma-liga` na Vercelu **nemá** přímý přístup k PostgreSQL. `DATABASE_URL` v `.env.example` je zakomentovaný. Databáze je za Hub API na Hetzneru a není veřejně dostupná.

---

## Hetzner VPS — projekt project-hub-api

```
/opt/project-hub-api/
  docker-compose.yml
  .env               ← není v Gitu, obsahuje reálné heslo a API key
```

Kontejnery:
- `project-hub-api` — Fastify API, port `127.0.0.1:3001`
- `project-hub-postgres` — PostgreSQL 17, pouze interní Docker síť `project-hub-net`

Postgres **není** exponovaný na veřejný internet.

Nginx/Certbot forwarduje `api.osmaliga.cz → 127.0.0.1:3001` s HTTPS (Let's Encrypt, expiry 2026-09-15, auto-renew přes certbot systemd timer).

---

## Smoke testy

```bash
# Healthcheck (bez auth)
curl https://api.osmaliga.cz/health

# GET výsledků (API key z .env na serveru)
curl "https://api.osmaliga.cz/api/osma-liga/match-results?limit=5" \
  -H "X-Project-Hub-Key: <secret>"

# POST výsledku
curl -X POST "https://api.osmaliga.cz/api/osma-liga/match-results" \
  -H "Content-Type: application/json" \
  -H "X-Project-Hub-Key: <secret>" \
  -d '{"homeScore":3,"awayScore":2,"durationSeconds":90}'

# Ověř 401 bez klíče
curl -o /dev/null -w "%{http_code}" https://api.osmaliga.cz/api/osma-liga/match-results
# očekávej: 401
```

---

## Zálohy

Denní lokální zálohy jsou nastavené. Viz detailní dokumentaci:
[`docs/operations/backups.md`](backups.md) v repozitáři `project-hub-api`.

Souhrn:

| Položka | Hodnota |
|---|---|
| Skript | `/opt/project-hub-api/scripts/backup-project-hub-db.sh` |
| Backup dir | `/opt/backups/project-hub/daily/` |
| Logy | `/opt/backups/project-hub/logs/` |
| Cron | `17 3 * * *` (každý den v 03:17) |
| Rotace | 14 dní |
| Off-server backup | záměrně odložen (hobby/demo projekt) |

Lokální záloha chrání hlavně před chybnou migrací nebo nechtěným smazáním dat.
**Nechrání před ztrátou celého VPS.** Off-server backup (Hetzner Storage Box, B2) je doporučený krok před produkčním provozem.

### Kritické — nikdy nepoužívat bez vědomého rozhodnutí

```bash
# TENTO PŘÍKAZ MAŽE DOCKER VOLUMES VČETNĚ DAT — nespouštět bez úmyslu
docker compose down -v
```

---

## Restart / update project-hub-api

```bash
ssh root@178.104.20.225
cd /opt/project-hub-api
git pull
docker compose up -d --build
docker compose exec project-hub-api npx prisma migrate deploy
curl http://127.0.0.1:3001/health
```

---

## Online lobby

Online lobby používá Hub API (`/api/osma-liga/online-games`).
API key zůstává server-side v Next.js routes.
Client volá `/api/online-games` (lokální Next.js proxy).

Stránky:
- `/hra/online` — seznam aktivních her, vytvoření nové hry
- `/hra/online/[code]` — šatna pro konkrétní hru

Proxy routes:
- `app/api/online-games/route.ts` — GET list, POST create
- `app/api/online-games/[code]/route.ts` — GET detail
- `app/api/online-games/[code]/join/route.ts` — POST join

---

## Plánované kroky

- [ ] Automatické denní pg_dump zálohy s rotací (cron + rclone do B2)
- [ ] Alerting na healthcheck (UptimeRobot nebo podobné)
- [ ] Migrace na Prisma migrate místo db push
- [ ] WebSocket gameplay (přenos pohybu v reálném čase)
