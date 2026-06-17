# Osmá liga

Česká arkádová fotbalová hra z prostředí okresního fotbalu. Veď Náhoda FC z nízké ligy až nahoru.

---

## Lokální spuštění (bez Dockeru)

### 1. Závislosti

```bash
npm install
# npm postinstall automaticky spustí `prisma generate`
```

### 2. Databáze

Spusť lokální PostgreSQL (pouze databáze, ne celá app):

```bash
docker compose up postgres -d
```

Nebo nastav vlastní PostgreSQL a zkopíruj `.env.example` → `.env.local`:

```bash
cp .env.example .env.local
# uprav DATABASE_URL pokud používáš vlastní instanci
```

### 3. Migrace

```bash
npm run db:migrate
# nebo pro rychlý sync schématu bez migračního souboru:
npm run db:push
```

### 4. Dev server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Ověření zápisu výsledku

1. Otevři `/hra`
2. Zahraj zápas (90 sekund nebo počkej na konec)
3. Klikni **Zapsat výsledek**
4. Výsledek se zobrazí na homepage v sekci **Poslední výsledky**

---

## Build

```bash
npm run build
npm start
```

## Spuštění přes Docker (app + DB)

```bash
docker compose up --build
# → http://localhost:3000
```

Docker compose spustí Next.js app i PostgreSQL. Migrace je nutné spustit ručně po prvním startu:

```bash
docker compose exec app npx prisma migrate deploy
```

## Vercel deployment

1. Nastav `DATABASE_URL` v Vercel dashboard (Settings → Environment Variables)
2. Doporučené DB: [Neon](https://neon.tech) nebo [Supabase](https://supabase.com)
3. Propoj GitHub repo → auto-deploy na push do `main`

---

**Budoucí doména:** osmaliga.cz
