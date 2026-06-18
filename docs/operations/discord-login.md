# Discord Login — provozní dokumentace

## Jak to funguje

Vlastní OAuth flow bez externí auth knihovny:

1. Uživatel klikne "Přihlásit" → GET `/api/auth/login`
2. Server vygeneruje `state`, uloží do httpOnly cookie, přesměruje na Discord OAuth
3. Discord přesměruje na `/api/auth/callback?code=...&state=...`
4. Server ověří `state`, vymění `code` za access token, načte profil z Discord API
5. Zavolá `project-hub-api` pro upsert záznamu `OsmaUser` v DB
6. Vytvoří podepsanou session cookie `osma-session` (HMAC-SHA256, 30 dní)
7. Přesměruje na `/`

Logout: POST `/api/auth/logout` → smaže cookie `osma-session`.

Session je HMAC-SHA256 podepsaný JSON (`AUTH_SECRET`), uložený jako httpOnly cookie.  
Žádné JWT knihovny, žádný next-auth — pouze Node.js `crypto`.

## Požadované env vars

### osma-liga

```env
# Náhodný 32bytový secret (openssl rand -base64 32)
AUTH_SECRET=...

# Veřejná URL aplikace (bez trailing slash)
# Na Vercelu auto-detekováno; nastaviť jen pokud callback nefunguje
AUTH_URL=https://osmaliga.cz

# Discord OAuth app credentials
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

### project-hub-api

Nic nového — endpoint `/api/osma-liga/users/discord-upsert` je chráněn existujícím `PROJECT_HUB_API_KEY`.

## Nastavení Discord aplikace

1. Jdi na https://discord.com/developers/applications
2. Vytvoř nebo vyber aplikaci → OAuth2 → Redirects
3. Přidej redirect URI:
   - `http://localhost:3000/api/auth/callback` (lokální vývoj)
   - `https://osmaliga.cz/api/auth/callback` (produkce)
4. Scope: `identify` (stačí pro jméno a avatar)
5. Zkopíruj `Client ID` a `Client Secret` do env vars

## Deployment

### project-hub-api (Hetzner)

```bash
ssh root@178.104.20.225
cd /opt/project-hub-api
git pull
docker compose up -d --build
docker compose exec app ./node_modules/.bin/prisma migrate deploy
```

### osma-liga (Vercel)

Přidej env vars v Vercel Dashboard → Settings → Environment Variables:
- `AUTH_SECRET`
- `AUTH_URL`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`

Git push → Vercel auto-deployuje.

## Soubory

```
osma-liga/
  lib/auth/session.ts               # Encode/decode podepsané session cookie
  app/api/auth/login/route.ts       # Initiates Discord OAuth (state cookie + redirect)
  app/api/auth/callback/route.ts    # Handles callback, upsert, session cookie
  app/api/auth/logout/route.ts      # POST: smaže session cookie
  components/auth/AuthStatus.tsx    # Server component pro header

project-hub-api/
  prisma/schema.prisma              # Model OsmaUser přidán
  prisma/migrations/20260617000002_add_osma_user/migration.sql
  src/modules/osmaLiga/
    validation.ts                   # DiscordUpsertSchema
    service.ts                      # upsertDiscordUser()
    routes.ts                       # POST /api/osma-liga/users/discord-upsert
```

## Bezpečnost

- `AUTH_SECRET` a `DISCORD_CLIENT_SECRET` jsou pouze server-side (žádné `NEXT_PUBLIC_` prefix)
- Session cookie: `httpOnly`, `sameSite: lax`, `secure` v produkci
- OAuth state ověřován timing-safe porovnáním
- HMAC ověřování session tokenu timing-safe (`crypto.timingSafeEqual`)
- `PROJECT_HUB_API_KEY` nikdy v client bundle
