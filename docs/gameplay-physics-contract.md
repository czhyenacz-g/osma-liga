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
| Hranice hřiště (ovládaný hráč) | `clampPos` na `FIELD ± PLAYER_RADIUS` | `clamp` na `FIELD ± PLAYER_RADIUS` (od 1b3c957, dřív bez clampu: −192) | y_min 68 / 68 | = | – | `run into top boundary` |
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

## Profily V2 a V3 (V3 je od 2026-10-31 ostrá, viz níže)

Profily patří do existujícího `GameplayProfileConfig`
(`game/gameplayProfiles.ts`). Konstanty jsou v `BALL_PHYSICS_V2` a
`BALL_PHYSICS_V3`.

| Profil | `kickSelfTrapProtectionEnabled` | `turnAssistEnabled` | `dribblePrepEnabled` |
|---|---|---|---|
| `classic` (produkce) | ne | ne | ne |
| `v2-shot` | ano | ne | ne |
| `v2-turn` | ano | ano | ne |
| `v3-dribble` | ano | ne | ano |

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

### V3 — příprava míče před otočkou (`game/dribblePrep.ts`)

**Kdy se zapne:** jen při skutečném vedení míče.
- Míč je od ovládaného hráče blíž než 57 px.
- Relativní rychlost míče vůči hráči je pod 160 px/s, a to aspoň 0,12 s.
- Kop není držený a neběží ochrana vlastní střely.
- Žádný soupeř není od míče blíž než 70 px. Výjimkou je stažení míče od
  soupeře (viz níže).

Volný ani právě odkopnutý míč se nikdy nepřitahuje.

**Spuštění:** Příprava začne, když míč leží aspoň 60° mimo nově držený směr.
Měří se poloha míče vůči hráči, ne rozdíl dvou posledních vstupů. Proto
přechod přes diagonálu (vpravo → vpravo+dolů → dolů) funguje stejně jako
přímá otočka.

**Průběh přípravy:**
- **Délka:** 0,35 s, u 180° až 0,55 s (lineárně podle úhlu).
- **Hráč:** běží 90 px/s.
- **Míč:** relativní rychlost míče vůči hráči se přibližuje cílové rychlosti
  rychlostí 30/s (exponenciálně) se zrychlením nejvýš 3000 px/s². Cílová
  rychlost má dvě složky:
  - **tečnou:** po oblouku, nejvýš 280 px/s, zpomaluje s ubývajícím úhlem;
  - **radiální:** drží 34 px od hráče, takže míč nejde přes jeho tělo.
- **Žádná pevná trajektorie:** míč se nikdy neteleportuje a polohu míče kód
  nezapisuje, mění jen jeho rychlost. Kolize zůstávají.
- **Strana oblouku** se zvolí na začátku přípravy. U otočky 180° vede tam,
  kde je víc místa od čáry.

**Konec přípravy:**
- Míč je do 25° před hráčem, relativně pomalý a ve vzdálenosti 24–48 px.
- Nebo vyprší okno přípravy.
- Potom hráč za 0,15 s lineárně zrychlí zpět na 210 px/s.

**Okamžité přerušení:** soupeř do 70 px, puštění ovládání, kop nebo míč
dál než 57 px.

**Stažení míče od soupeře (shield turn, od 2026-10-31):** Otočka aspoň o
120° *od* soupeře, typicky couvnutí nebo obrat k vlastní bráně, když
soupeř napadá zepředu, je asistovaná i se soupeřem do 70 px. Platí to,
pokud každý soupeř do 70 px:
- stojí na straně, od které se hráč odvrací (skalární součin polohy soupeře
  vůči hráči a nového směru je záporný);
- nedotýká se míče (střed je od míče dál než 36 px).

Ostrá otočka (≥ 120°), která začala bez soupeře, pokračuje podle stejných
pravidel, i když se soupeř během otáčení přiblíží. Oblouk vede na stranu
dál od soupeře i od čáry. Otočka *do* soupeře nebo souboj o míč, kterého
se soupeř už dotýká, zůstává beze změny jako v classic.

**Řetězec otoček:** Změna směru uprostřed přípravy ji přesměruje. Celkový
čas přípravy v řetězci je ale omezený na 1,2 s. Potom musí přijít 0,3 s bez
asistence, takže nekonečný slalom s asistencí nejde.

**Výsledky (simulace 30/60/120/144 Hz, bez soupeře):**
- 90° a stažení od čáry: míč je před hráčem za 0,3 s, ztráta 0 s. Classic
  ztrácí míč na 0,7–0,9 s.
- 180°: míč je před hráčem za 0,5 s.
- Mřížka 270 situací (výchozí úhel míče, délka rozběhu, pozice: střed,
  čára, roh):

  | Otočka | Úspěšnost V3 (mimo čáru) |
  |---|---|
  | 90° | 100 % |
  | 135° | 97 % |
  | 180° | 80–93 % |

  Neúspěch nastává jen při otočce do čáry, u které hráč stojí.

**Soupeř do 70 px:** V3 se chová přesně jako classic, s výjimkou stažení
míče od soupeře. Couvnutí od stojícího obránce 50–90 px před míčem: V3 má
ztrátu 0 s a míč je před hráčem za 0,5 s, classic ztratí míč na víc než
1 s. Proti napadajícímu botovi si V3 při couvnutí míč udrží, classic ho
ztratí pokaždé.

**Co V3 neřeší:**
- Classic kontrola mimo přípravu dál tlumí za frame. Po přípravě se proto
  míč na 120/144 Hz drží o 10–20° víc stranou než na 30 Hz.
- Bez soupeře je otočka 90° prakticky vždy úspěšná. Riziko nese hlavně
  soupeř a čára.

## Automatické testy

`game/physicsContract/` (vitest, běží v `npm test`):

- **`spec.ts`** obsahuje deklarativní scénáře (start, offset míče, držené
  vstupy), tolerance a `KNOWN_DIVERGENCES`.
- **`runner.ts`** je měřicí smyčka nezávislá na enginu.
- **`harness.ts`** napojuje scénáře na lokální engine.
- **`server-baseline.json`** obsahuje výsledky stejných scénářů na
  serverovém enginu, s commitem uvnitř souboru. Generuje se stejným
  `runner.ts` nad `project-hub-api`.
- **`local-baseline.json`** je baseline `classic`, `v2-shot` a `v2-turn`
  pro 30/60/120/144 Hz. Je vygenerovaná z enginu **před** zavedením V3,
  takže hlídá, že se V3 nedotkla starších profilů.
- **`game/dribblePrep.test.ts`** kontroluje u V3:
  - frekvenční stabilitu;
  - že 180° je pomalejší než 90°;
  - že soupeř asistenci vypne;
  - stažení míče od napadajícího soupeře, oblouk na volnou stranu, žádnou
    asistenci při otočce do soupeře nebo u míče, kterého se soupeř dotýká;
  - že se míč neotáčí kolem hráče (orbit);
  - že asistence není nekonečná (limit řetězce);
  - že rychlost a zrychlení míče jsou omezené;
  - že se nepřitahuje volný míč;
  - reset při přepnutí profilu;
  - V3 proti aktivnímu botovi.

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

## V3 v ostrých režimech (od 2026-10-31)

V3 je výchozí fyzika všech hratelných režimů. Ladění přijde později,
teď jde o základní hratelnost.

- **`/hra/bot`** (lokální engine) hraje `LIVE_GAMEPLAY_PROFILE` =
  `v3-dribble` (`game/gameplayProfiles.ts`).
- **Multiplayer a tréninková výzva** (server, `tickGame`): lidské týmy mají
  `TeamBehaviorConfig.preparedTurns = true`. Patří k tomu
  `src/gameEngine/dribblePrep.ts`, port 1:1 se stejnými konstantami
  (`BALL_PHYSICS_V3` v `constants.ts`), a ochrana vlastní střely
  (`KICK_SELF_TRAP_PROTECTION_SECONDS` 0,25 s). Stav je zvlášť pro každý tým:
  `OnlineGameState.dribblePrep` a `kickSelfTrap`.
- **Bot výzvy** (`trainingChallengeAi`) má `preparedTurns = false`, takže
  hraje beze změny.
- **Clamp hráče na serveru:** ovládaný hráč se nově drží uvnitř hřiště
  stejně jako lokálně.
- **`/hra/bot-test`** dál umožňuje přepínat všechny profily, classic zůstává
  pro srovnání.
- **Kontrakt:** test „local vs server“ teď porovnává `LIVE_GAMEPLAY_PROFILE`
  se serverem. `server-baseline.json` je z commitu `1b3c957`.
- **Výsledky na serveru (30 Hz):**
  - 90° a stažení od čáry: před hráčem za 0,3 s, ztráta 0;
  - 180°: 0,5 s, ztráta 0;
  - diagonála: 0,4 s;
  - obránce zepředu nebo zboku: beze změny;
  - rychlé změny směru: ztráta 0,7 s (lokálně 0 s, rozdíl dělá poloměr
    kontroly 44 vs 57).

Zbývající rozdíly lokál↔server jsou poloměry kontroly a retence,
`KICK_RANGE`, nabíjení kopu a útlum za frame proti útlumu za tick.

## Původní plán přenosu V3 na server (proveden, viz výše)

1. **Modul.** `dribblePrep.ts` je čistá funkce nad stavem a `dt`. Na server
   se přenese jako `src/gameEngine/dribblePrep.ts` se stejnými konstantami.
   Pro každý tým stačí `DribblePrepState` v `OnlineGameState`.
2. **Napojení.** V `movePlayerByInput` (`tick.ts`) se omezí rychlost
   ovládaného hráče. V bloku kontroly míče se během přípravy nahradí
   klasická kontrola. Je to stejné místo jako lokálně.
3. **Předpoklad.** Nejdřív sjednotit poloměry kontroly a retence a
   `KICK_RANGE`, a opravit clamp hráče. Jinak V3 na serveru startuje
   z jiného výchozího stavu.
4. **Ověření.** Stejné kontraktní scénáře se na serveru spustí přes
   `scripts/physics-contract-server-baseline.mts`. Rozdíl lokál↔server
   u V3 scénářů pak musí být v toleranci, ne v `KNOWN_DIVERGENCES`.
5. **Výzva a multiplayer.** Obojí volá `tickGame`, takže profil musí být
   parametr stavu zápasu a pro oba režimy stejný.
