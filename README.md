# Osmá liga

Česká arkádová fotbalová hra z prostředí okresního fotbalu. Veď Náhoda FC z nízké ligy až nahoru.

> Hra je zatím ve fázi landing page / technický základ. Herní engine není součástí tohoto commitu.

---

## Lokální spuštění (bez Dockeru)

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## Spuštění přes Docker

```bash
docker compose up --build
# → http://localhost:3000
```

Nebo jen build image:

```bash
docker build -t osma-liga .
docker run -p 3000:3000 osma-liga
```

## Vercel deployment

Projekt je připravený pro Vercel. Stačí propojit GitHub repo:

1. `vercel login`
2. `vercel --prod`

Nebo automaticky přes GitHub → Vercel dashboard (auto-deploy na push do `main`).

---

**Budoucí doména:** osmaliga.cz
