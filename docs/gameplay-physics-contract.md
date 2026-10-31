# Fyzikální kontrakt Osmé ligy

Stav k 2026-10-31. Lokální engine: `osma-liga` (`game/updateGame.ts`), server:
`project-hub-api` `eaa1539` (`src/gameEngine/tick.ts`).

Tři herní režimy:

- **Lokální engine:** proti botovi (`/hra/bot`, `/hra/bot-test`).
- **Serverový engine:** automatická tréninková výzva a multiplayer.

Výzva i multiplayer volají stejný `tickGame` se stejnými konstantami. Liší
se jen tím, kdo ovládá tým `away`: serverový bot (`ai.ts`) nebo druhý člověk.
Serverový bot používá stejný vstupní kanál, rychlost, dosah kopu i cooldown
jako člověk.

> **Tento dokument NEZNAMENÁ, že se enginy sjednotily.** Popisuje obě
> implementace vedle sebe a výslovně značí nesoulady (❌). Cílové hodnoty
> jsou návrh, nic z nich zatím není nasazené.

Měří se to automaticky v `game/physicsContract/`, viz poslední sekci.

## Legenda

- **=** obě implementace se shodují.
- **❌** nesoulad, který nikdo neschválil.
- **≈** záměrný rozdíl.
- **Lok / Srv** lokální / serverová implementace.

## Pohyb a hráči

| Položka | Lokální | Server | Hodnoty | Stav | Cíl | Testy |
|---|---|---|---|---|---|---|
| Rychlost člověka | `updateGame` → `stats.speed` | `movePlayerByInput` → `stats.speed` | 210 / 210 px/s | = | 210 | `straight run` |
| Rychlost bota | `ai.ts` `BOT_SPEED` | `ai.ts` → `stats.speed` (jako člověk) | 165 / 210 px/s | ≈ obtížnost AI | ponechat jako explicitní parametr obtížnosti | – |
| PlayerStats | `game/playerStats.ts` | `src/gameEngine/playerStats.ts` | hráč 210/shot 1/stop 0/r 18; GK 150/1/1/r 20,7 | = | – | – |
| 8 směrů | normalizovaná diagonála | normalizovaná diagonála | | = | – | `diagonal run` |
| Hranice hřiště (ovládaný hráč) | `clampPos` na `FIELD ± PLAYER_RADIUS` | **bez clampu** | y_min 68 / **−192** | ❌ **chyba serveru** | clamp jako lokálně | `run into top boundary` |
| Oddělení spoluhráčů | 42 px / 0,5 | 42 px / 0,5 | | = | – | – |
| Podpůrní hráči | 120 px/s | 120 px/s | | = | – | – |

## Míč

| Položka | Lokální | Server | Hodnoty | Stav | Cíl | Testy |
|---|---|---|---|---|---|---|
| Tření | `0.35^dt` | `0.35^dt` | | = | – | – |
| Max. rychlost | 800 | 800 | | = | – | – |
| Odraz od stěn | 0,75 | 0,75 | | = | – | – |
| Náraz hráč→míč (`BUMP_FORCE`) | 110, **není škálováno dt** | 110 na tick | | ≈ dt-závislé lokálně | normalizovat při fixed-timestep | – |
| Kontrola míče: poloměr | 57 | **44** | | ❌ | rozhodnout po testu V2 | `dribble straight`, otočky |
| Kontrola míče: síla/offset/útlum | 130 / 210 / 34, útlum 0,86 **na frame** | stejné hodnoty, útlum 0,86 **na tick (30 Hz)** | | ❌ (Hz) | útlum přepočítat na `pow(x, dt·30)` | otočky × Hz |
| Retence: poloměr | 55 | **42** | | ❌ | sjednotit s kontrolou | `defender contact` |
| Retence: soupeř blíž než | 70 | 70 | | = | – | – |
| Retence: blend | 0,14 **na frame** | 0,14 na tick | | ❌ (Hz) | dt-normalizace | – |

## Kop

| Položka | Lokální | Server | Hodnoty | Stav | Cíl | Testy |
|---|---|---|---|---|---|---|
| Dosah kopu | `PLAYER_RADIUS + 39` = 57 | **40** | | ❌ server < kontrola míče (44) → tichý nevystřelený kop | ≥ poloměr kontroly | `short kick` |
| Síla kopu | 486 × (0,9 … 1,5) | 486 × (0,9 … 1,5) | | = | – | `short kick`, `charged kick` |
| Nabíjení do max. | **500 ms** | **1500 ms** | | ❌ | jedna hodnota pro všechny režimy | `charged kick (0.5 s)` |
| Cooldown kopu | 0,25 s | 0,25 s | | = | – | – |
| Vlastní střelu brzdí kontrola míče | ano, závisí na Hz | ano, jen 1–2 ticky | 0,9 s po tapu: 263 / 208 / 16 / 13 px (30/60/120/144 Hz) | ❌ **hlavní Hz bug** | V2-shot: 0,25 s bez kontroly po kopu | `short kick` × Hz |
| Cooldown bota | 0,85 | 0,85 | | = | – | – |

## Brankář

| Položka | Lokální | Server | Stav |
|---|---|---|---|
| Zóna, rychlost 150, hloubka 34, reakce 390 px | `goalkeeperAI.ts` | `goalkeeperAI.ts` | = |
| Útlum míče 0,18 + bump 60 | ano | ano | = |
| Test | `goalkeeper blocks shot` | | rozdíl jen síly střely (viz nabíjení) |

## Žolík a dočasné oslabení

| Položka | Lokální | Server | Stav | Testy |
|---|---|---|---|---|
| Žolík: délka | 30 s | 30 s | = | `žolík entry + expiry` |
| Žolík: jednorázový | ano | ano | = | `žolík entry + expiry` |
| Žolík: vstupní bod | (150, 450) | (150, 450) | = | `žolík entry + expiry` |
| Žolík: role útočník/obránce | ano | ano | = | – |
| Oslabení: 10 s na lavičce pod spodní čarou | ano | ano (`eaa1539` zatím **nenasazen** na VPS) | = v kódu | `temporary weakening` |

## Frekvence fyziky

- **Lokálně:** proměnné `dt` z `requestAnimationFrame`, max 0,05 s.
- **Server:** pevný tick 30 Hz.
- **Normalizace dt:** tření, rychlosti a síly kontroly míče jsou × dt. Útlum
  kontroly, blend retence a `BUMP_FORCE` jsou na frame.

**V2 neřeší úplnou normalizaci.** Odstraňuje jen závislost střel na Hz.
Otočky, vedení a odrazy od hráče zůstávají mírně Hz-závislé: ztráta při
otočce 90° je 0,9 s na 30 Hz a 0,7 s na 144 Hz.

## Experimentální profily V2 (jen `/hra/bot-test`)

Profily patří do existujícího `GameplayProfileConfig`
(`game/gameplayProfiles.ts`). Konstanty jsou v `BALL_PHYSICS_V2`.

| Profil | `kickSelfTrapProtectionEnabled` | `turnAssistEnabled` |
|---|---|---|
| `classic` (produkce) | ne | ne |
| `v2-shot` | ano | ne |
| `v2-turn` | ano | ano |

- **Ochrana střely.** Okno začne jen při skutečně vystřeleném kopu
  (`state.kickSelfTrapPlayerId`). Nestačí k tomu změna `kickCooldown`, protože
  ten se nuluje i bez kopu, třeba při restartu nebo nasazení žolíka. Okno trvá
  0,25 s, počítá se v čase (dt) a týká se jen střelce. Soupeř i spoluhráči
  dál normálně kolidují a míč mohou sebrat.
- **Asistence otočky.** Spustí se, když se směr změní aspoň o 60°, míč je
  v poloměru kontroly a nejbližší soupeř je od míče dál než 70 px. Pak hráč
  běží až 0,3 s rychlostí 130 px/s. Asistence skončí dřív, jakmile je míč do
  45° před hráčem, jakmile je soupeř blízko nebo jakmile míč uteče. Míč
  nedostane žádnou novou sílu.

## Automatické testy

`game/physicsContract/` (vitest, běží v `npm test`):

- **`spec.ts`** obsahuje deklarativní scénáře (start, offset míče, držené
  vstupy), tolerance a `KNOWN_DIVERGENCES`.
- **`runner.ts`** je měřicí smyčka nezávislá na enginu.
- **`harness.ts`** napojuje scénáře na lokální engine.
- **`server-baseline.json`** obsahuje výsledky stejných scénářů na
  serverovém enginu, s commitem uvnitř souboru. Generuje se stejným
  `runner.ts` nad `project-hub-api`.
- **`local-baseline.json`** je baseline produkčního `classic` pro
  30/60/120/144 Hz, vygenerovaná z kódu **před** zavedením V2.

**Tolerance:**

| Metrika | Tolerance |
|---|---|
| Pozice | 6 px |
| Dráha a rychlost míče | 8 % |
| Ztráta kontroly | 0,12 s |
| Úhel | 20° |
| Lavička | 0,1 s |

**Jak se výsledky vyhodnocují:**

- **Nový rozdíl lokál↔server** mimo `KNOWN_DIVERGENCES` znamená selhání
  testu, tedy regresi.
- **Známý rozdíl** test toleruje. Když zmizí, test vypíše varování, ať se
  scénář vyřadí z `KNOWN_DIVERGENCES`.
- **Drift `classic`** proti `local-baseline.json` znamená selhání testu.
- **Schválená odlišnost**, například rychlost bota, se v kontraktních
  scénářích nepoužívá.

Server baseline se po každé změně serverového enginu přegeneruje stejným
runnerem nad lokálním checkoutem backendu:

```
npx tsx scripts/physics-contract-server-baseline.mts ../project-hub-api \
  > game/physicsContract/server-baseline.json
```
