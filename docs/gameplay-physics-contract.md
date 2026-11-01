# Fyzikální kontrakt Osmé ligy

Stav k 2026-11-01. Lokální engine `osma-liga` (`game/updateGame.ts`,
proměnné `dt` z `requestAnimationFrame`, max 0,05 s), server
`project-hub-api` `c73713b` (`src/gameEngine/tick.ts`, pevný tick 33 ms).

| Režim | Engine | Kdo hraje |
|---|---|---|
| `/hra/bot` | lokální, `LIVE_GAMEPLAY_PROFILE` = `v3-dribble` | člověk vs. lokální bot |
| tréninková výzva | server `tickGame`, `TRAINING_CHALLENGE_BEHAVIOR_CONFIG` | serverový bot (home) vs. člověk |
| multiplayer | server `tickGame`, `DEFAULT_BEHAVIOR_CONFIG` | člověk vs. člověk |

Fyzikální zákony (míč, kolize, kop, kontrola, V3) platí pro člověka
v obou enginech stejně. **Obtížnost bota** je vědomě oddělený parametr
(viz poslední řádky tabulky), ne fyzika.

## Pravidla V3

„Test“ = scénář v `game/physicsContract/spec.ts`, ✔ = lokál (60 Hz) i server
v toleranci, ≈ = rozdíl jen ve velikosti kroku (viz *Známé rozdíly*).

| Parametr | Hodnota | Lokálně | Server | Test | Výjimka |
|---|---|---|---|---|---|
| Rychlost hráče | 210 px/s (GK 150) | `stats.speed` | `movePlayerByInput` | `straight run` ✔ | – |
| Hranice ovládaného hráče | `FIELD ± PLAYER_RADIUS` | `clampPos` | `clamp` | `run into top boundary` ✔ | – |
| Tření míče | `0.35^dt`, nejdřív posun, pak tření | `updateGame` | `updateBallPhysics` (od `d5375bc`) | `short kick` ✔ | – |
| Max. rychlost míče / odraz od stěn | 800 / 0,75 | `constants.ts` | `constants.ts` | – | – |
| Kontrola míče: poloměr | 57 | `BALL_CONTROL_RADIUS` | `BALL_CONTROL_RADIUS` (od `49c9614`) | `dribble straight` ≈ | bot výzvy 44 |
| Kontrola: síla / offset / útlum | 130 / 210 / 34, útlum 0,86 na krok | `updateGame` | `tick.ts` | otočky ≈ | – |
| Retence | poloměr 55, soupeř < 40 (V3; classic/v2 < 70), blend 0,14 na krok | `updateGame` | `tick.ts` | `defender contact` ≈ | bot výzvy bez retence |
| Vzdálenost míče se měří | z pozice hráče **před** pohybem v kroku | `activeDist` | `preMoveBallDist` | `kick at the edge of reach` ✔ | bot výzvy po pohybu |
| Dosah kopu | 57 (≥ poloměr kontroly) | `PLAYER_RADIUS + 39` | `KICK_RANGE` | `kick at the edge of reach (50 px)` ✔, `no kick out of reach (75 px)` ✔ | bot výzvy 40 |
| Síla kopu | 486 × 0,9 (tap) … 1,5 | `KICK_FORCE` | `KICK_FORCE` | `charge tap … 1500 ms` ✔/≈ | – |
| Plné nabití | 500 ms, delší držení nic nepřidá | `KICK_MAX_CHARGE_MS` | `KICK_MAX_CHARGE_MS` | `charge 1000/1500 ms` ✔ | bot výzvy kope hned |
| Cooldown kopu | 0,25 s (bot 0,85) | | | – | – |
| Ochrana vlastní střely | 0,25 s po kopu bez kontroly míče střelcem | `kickSelfTrap*` | `kickSelfTrap` per tým | `short kick` ✔ | – |
| V3 příprava otočky | `BALL_PHYSICS_V3` (níže) | `game/dribblePrep.ts` | `src/gameEngine/dribblePrep.ts` | otočky, `shot after a 180° turn` ≈ | bot výzvy `preparedTurns=false` |
| Náraz hráč→míč | `BUMP_FORCE` 110 na krok | `updateGame` | `tick.ts` | `defender *` ≈ | – |
| Brankář | zóna, 150 px/s, reakce 390 px, útlum 0,18 + bump 60 | `goalkeeperAI.ts` | `goalkeeperAI.ts` | `goalkeeper blocks shot` ✔ | – |
| Kontakt s brankářem | hitbox 28 (hráč 18 + míč 10), průchod tělem hlídá swept kontrola (níže) | `sweepBallAgainstGoalkeepers` | `sweepBallAgainstGoalkeepers` | `goalkeeperCollision.test.ts` | – |
| Žolík | 30 s, jednorázový, vstup (150, 450), role útočník/obránce | `bench*.ts` | `bench*.ts` | `žolík entry + expiry` ✔ | – |
| Dočasné oslabení | 10 s pod spodní čarou | `temporaryRemoval.ts` | `temporaryRemoval.ts` | `temporary weakening` ✔ | – |
| **Bot: rychlost** | lokální bot 165, bot výzvy 210 | `BOT_SPEED` | `ai.ts` | – | obtížnost |
| **Bot: dosah / kontrola** | 40 / 44, kop bez nabíjení, bez V3 | `BOT_KICK_RANGE` | `AI_KICK_RANGE`, `AI_BALL_CONTROL_RADIUS` | `ballHandling.test.ts` | obtížnost |

## Známé ponechané rozdíly

Všechny jsou v `KNOWN_DIVERGENCES` s úzkým výčtem metrik a jsou seskupené
podle příčiny:

- **STEP — velikost kroku.** Útlum kontroly (0,86), blend retence (0,14),
  `BALL_STOP_DAMPING` a `BUMP_FORCE` se aplikují *na krok*. Server dělá krok
  33 ms, lokál typicky 16,7 ms, takže dráha míče při vedení se liší o pár
  px a pár stupňů. Server@30 Hz ≈ lokál@30–60 Hz. Na 120/144 Hz drží
  lokál míč po otočce víc stranou (≈ 16° vs 5° v 0,6 s) a blíž (30 vs
  33 px). **Nenormalizováno záměrně:** dt-normalizace by změnila pocit
  na 120/144 Hz, který hráči už znají, a fixed timestep je mimo rozsah.
- **CHARGE.** Nabíjení se počítá po krocích, takže stejná doba držení
  dá na serveru o krok jinou sílu (rozdíl jen v `ballX`).
- **BUMP.** Odraz od obránce je v jednom kroku 110 px/s; na 30 Hz je
  chaotičtější. Rozdíl je jen v poloze/rychlosti míče, ne v tom, kdo míč má.
## Kontakt s brankářem (od 2026-10-31)

Míč nesmí projít tělem brankáře bez kontaktu. Překryv se dřív řešil jen
podle koncové polohy míče: když jeden krok dostal míč za střed brankáře,
vytlačení „od středu“ ho poslalo dál do sítě. Stávalo se to hlavně
**při kopu přitisknutém k brankáři**: posazení míče před kopajícího
(32 px) + kontaktní posun (12 px) míč přeneslo přímo za brankáře, a to
na všech frekvencích (30–144 Hz) v obou enginech. Lokálně k tomu ještě
**zásek snímku** (`dt` až 0,05 s = 40 px na krok).

Oprava (`sweepBallAgainstGoalkeepers`, v obou enginech stejně):
- jen pro brankáře; hráči v poli a V3 vedení míče beze změny;
- kontroluje se úsečka pohybu míče v kroku (od polohy na začátku kroku
  kvůli kopu a od polohy před posunem v `updateBallPhysics`);
- když míč vstoupí do kruhu 28 px a vyjde z něj, nebo skončí za bodem
  nejbližším středu, vrátí se na místo vstupu (1 px vně) a odrazí se
  stejným útlumem a bumpem jako běžný kontakt. Jeden kontakt na krok;
- míč, který jen vnikne zepředu, řeší dál běžný překryv. Hitbox se
  nemění; brankář se kreslí o 15 % větší (20,7 px), to je jen vzhled.

Teč brankáře, po které míč stejně skončí v síti, je dál možná a počítá
se střelci (viz `docs/goal-attribution.md`).

## Jak fyziku bezpečně rozšířit

1. Novou konstantu přidej do **obou** `constants.ts` (nebo
   `BALL_PHYSICS_V3`) se stejnou hodnotou a komentářem „mirrors …“.
2. Logiku piš jako čistou funkci nad stavem a `dt`, port 1:1 do
   `src/gameEngine/` (vzor: `dribblePrep.ts`).
3. Obtížnost bota drž zvlášť (`AI_*`, `TeamBehaviorConfig`), ne změnou
   sdílené konstanty.
4. Přidej scénář do `spec.ts`, přegeneruj obě baseline a projdi diff.
   Nový rozdíl dej do `KNOWN_DIVERGENCES` jen s konkrétními metrikami a
   příčinou, nikdy `'*'` bez zdůvodnění.
5. Ověř 30/60/120/144 Hz (drift test v `physicsContract.test.ts`).

## Jak spustit kontraktní testy

```
npx vitest run game/physicsContract          # lokál vs server + drift profilů
# po změně serverového enginu (lokální checkout backendu):
npx tsx scripts/physics-contract-server-baseline.mts ../project-hub-api \
  > game/physicsContract/server-baseline.json
# backend:
npx vitest run src/gameEngine                # engine (bez DB)
DATABASE_URL=… PROJECT_HUB_API_KEY=… NOCNI_HLIDAC_API_TOKEN=… npx vitest run src
```

Celý backend `vitest run src` potřebuje PostgreSQL; stačí lokální
kontejner s `prisma migrate deploy`, **nikdy** produkční DB.

## Checklist před deployem

- [ ] `server-baseline.json` je z commitu, který se nasazuje (`commit` v souboru).
- [ ] `npx vitest run` (frontend) a `npx vitest run src` (backend) zelené.
- [ ] `tsc`, lint, `npm run build` v obou repech.
- [ ] Žádná nová položka v `KNOWN_DIVERGENCES` bez příčiny.
- [ ] Backend: žádná probíhající hra ani aktivní výzva (`GET /api/osma-liga/online-games`),
      rollback image otagovaná, existující záloha DB ověřená, restart jen `project-hub-api`.
- [ ] Po deployi `/health` a smoke test `/hra/bot` + online lobby.

## Profily V2 a V3 (V3 je od 2026-10-31 ostrá ve všech režimech)

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
- Žádný soupeř není od míče blíž než 40 px (od 2026-11-01, dřív 70 px).
  Výjimkou je stažení míče od soupeře (viz níže).

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

**Okamžité přerušení:** soupeř do 40 px, puštění ovládání, kop nebo míč
dál než 57 px.

**Stažení míče od soupeře (shield turn, od 2026-10-31):** Otočka aspoň o
120° *od* soupeře, typicky couvnutí nebo obrat k vlastní bráně, když
soupeř napadá zepředu, je asistovaná i se soupeřem do 40 px. Platí to,
pokud každý soupeř do 40 px:
- stojí na straně, od které se hráč odvrací (skalární součin polohy soupeře
  vůči hráči a nového směru je záporný);
- nedotýká se míče (střed je od míče dál než 36 px).

Ostrá otočka (≥ 120°), která začala bez soupeře, pokračuje podle stejných
pravidel, i když se soupeř během otáčení přiblíží. Oblouk vede na stranu
dál od soupeře i od čáry. Otočka *do* soupeře nebo souboj o míč, kterého
se soupeř už dotýká, zůstává beze změny jako v classic.

**Hráč s míčem a poloměr soupeře (od 2026-11-01):**
- Hráč, který vede míč (míč do 57 px, relativní rychlost pod 160 px/s,
  neběží ochrana vlastní střely), běží 0,9 × `stats.speed` (189 px/s).
  Bez míče běží plnou rychlostí. Strop se kombinuje s přípravou otočky
  (platí nižší). `BALL_PHYSICS_V3.carrierSpeedFactor`.
- Příprava otočky i retence se vypnou až se soupeřem do 40 px od míče
  (`noOpponentRadius`, `retentionNoOpponentRadius`); dotyk těla s míčem
  je 28 px, dosah kopu bota 40 px. Otočka může začít se soupeřem 40–70 px
  od míče; když se přiblíží do 40 px, skončí (ostrá otočka ≥ 120° pak běží
  podle pravidel stažení). Otočka do obránce se dál prohrává jako v classic.
- Classic/v2 profily beze změny (retence 70 px, bez zpomalení).
- Server: totéž pro týmy s `preparedTurns` (`carrierSpeedCap` v
  `src/gameEngine/dribblePrep.ts`). Pomalejší hráč posunul načasování
  kontaktů, proto má pár scénářů nové položky v `KNOWN_DIVERGENCES`
  (STEP/CHARGE/BUMP, lokál na 30 Hz ≈ server).

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

**Soupeř do 70 px (stav před 2026-11-01):** V3 se chová přesně jako classic, s výjimkou stažení
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

- **`spec.ts`** — scénáře (start, offset míče, držené vstupy), tolerance a
  `KNOWN_DIVERGENCES`.
- **`runner.ts`** — měřicí smyčka nezávislá na enginu (ztráta kontroly se
  měří vlastním `controlRadius` adaptéru).
- **`harness.ts`** — napojení na lokální engine.
- **`server-baseline.json`** — stejné scénáře na serverovém enginu,
  commit uvnitř souboru.
- **`local-baseline.json`** — `classic`, `v2-shot`, `v2-turn`,
  `v3-dribble` pro 30/60/120/144 Hz; hlídá, že se profily nehnou.
- **`game/dribblePrep.test.ts`** a backend `dribblePrep.test.ts`,
  `ballHandling.test.ts` — V3 a dosah/nabíjení kopu.

| Metrika | Tolerance |
|---|---|
| Pozice | 6 px |
| Dráha a rychlost míče | 8 % |
| Ztráta kontroly | 0,12 s |
| Úhel | 20° |
| Lavička | 0,1 s |

- Nový rozdíl lokál↔server mimo `KNOWN_DIVERGENCES` = selhání (regrese).
- Známý rozdíl, který zmizí, vypíše varování → vyřadit ze seznamu.
- Drift profilu proti `local-baseline.json` = selhání.
