# Club Stats — Concept & Roadmap

## Aktuální stav (implementováno)

Online zápas nyní ukládá `homeClubId` a `awayClubId` do `OsmaOnlineMatch`.

### Jak to funguje

1. Hráč vybere klub v dropdown (lobby nebo room page).
2. `clubId` se pošle server-side přes Next.js API route → Project Hub API.
3. API validuje, že `clubId` existuje v DB a `isActive = true`.
4. Klub se uloží do room state (`homeClubId` / `awayClubId`).
5. Po skončení zápasu se klub persistuje k `OsmaOnlineMatch`.
6. Detail zápasu (`/zapasy/[id]`) zobrazuje název klubu u každého hráče.

### Datový model

```
OsmaOnlineMatch
  homeClubId  String?  → FK OsmaClub.id (ON DELETE SET NULL)
  awayClubId  String?  → FK OsmaClub.id (ON DELETE SET NULL)
```

### API

`GET /api/osma-liga/online-matches` a `GET /api/osma-liga/online-matches/:id`
vrací volitelně:
```json
{
  "homeClub": { "id": "nahoda-fc", "slug": "nahoda-fc", "name": "Náhoda FC", ... },
  "awayClub": null
}
```

---

## Co zatím není implementováno

- **Bodování klubů** — výsledky online zápasů se zatím na body klubů nepřepočítávají.
- **Tabulka klubů** — žádná tabulka s 3/1/0 body.
- **Top hráči klubu** — vazba hráč ↔ klub není zatím vedena.
- **Statistiky klubů** — počty gólů, výher, proher per klub.
- **Sezóny** — klubová data jsou bez sezónní struktury.

---

## Plánovaný další krok

### Bodování 3/1/0

Při save online match vypočítat body:
- výhra: 3 body pro vítěze
- remíza: 1 bod oběma
- prohra: 0 bodů

Přidat model `OsmaClubSeason` nebo pole `points`, `wins`, `draws`, `losses` přímo na `OsmaClub`.

### Top hráči klubu

Propojit `OsmaUser` s `OsmaClub` přes volitelný `OsmaUser.defaultClubId`.
Pak lze zobrazit, kolik zápasů odehrál každý hráč za daný klub.
