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

## Zálohy (checklist — zatím manuální)

> Automatické backupy nejsou zatím nastaveny. Před prvním produkčním nasazením ověř:

- [ ] Název Postgres kontejneru: `project-hub-postgres`
- [ ] Název databáze: `project_hub`
- [ ] DB user: `project_hub_user`
- [ ] Heslo: uloženo v `/opt/project-hub-api/.env` jako `POSTGRES_PASSWORD`
- [ ] Ověřit volné místo na disku: `df -h` na VPS
- [ ] Zálohy ukládat **mimo stejný disk** (jiný server, S3, Backblaze B2, apod.)

### Příklad backup příkazu

> Nejdřív ověř, že container a credentials odpovídají `.env` na serveru.

```bash
docker exec project-hub-postgres pg_dump \
  -U project_hub_user project_hub \
  > backup-project-hub-$(date +%F).sql
```

Pro produkci: komprimované a rotované zálohy, ukládané mimo VPS:

```bash
docker exec project-hub-postgres pg_dump -U project_hub_user project_hub \
  | gzip > backup-project-hub-$(date +%F).sql.gz
# pak: scp nebo rclone na remote storage
```

### Kritické — nikdy nepoužívat bez vědomého rozhodnutí

```bash
# TOTO PŘÍKAZ MAŽE VŠECHNA DATA — nespouštět bez úmyslu
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
