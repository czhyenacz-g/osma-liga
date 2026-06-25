# Audit: inteligence hráčů a komplexita pravidel — aktuální stav

Status: **pouze analýza**, žádný herní kód, UI ani DB schema nebyly měněny. Žádný
build/test nebyl potřeba — čistě statická analýza zdrojového kódu k 2026-06-25,
ve dvou repozitářích (`osma-liga`, `project-hub-api`), čtením aktuálního stavu
`game/updateGame.ts`, `game/ai.ts`, `game/supportPositioning.ts`,
`game/passAndSwitch.ts`, `game/physics.ts`, `game/constants.ts`, `game/types.ts`,
`project-hub-api/src/gameEngine/tick.ts`, `teamBehavior.ts`, `ai.ts`,
`passAndSwitch.ts`, `physics.ts`, `constants.ts`. Navazuje na
[`movement-kick-physics-analysis.md`](./movement-kick-physics-analysis.md) a
[`game-mode-logic-differences.md`](./game-mode-logic-differences.md), ale je
užší — zaměřuje se na rozhodovací logiku (kdo je aktivní, kdo se kam hýbe, kdo
koho odstrkuje), ne na fyziku míče samotnou.

## 1. Active player selection

### Lokální engine (`/hra/bot`)

Vše v `game/updateGame.ts:173-274`, jeden tým (`homePlayers`) najednou:

1. **Nejbližší k míči** (`nearest`/`nearestDist`, řádky 181-189) — prostý lineární scan.
2. **Automatický pick s hysterezí** (`auto`, řádky 191-216) — `autoActivePlayerId` se
   nepřepne na `nearest`, dokud `nearest` není blíž o `computeSwitchMargin(currentDist)`
   (řádky 81-88: 18px margin, lineárně mizí do 0 na vzdálenost 300px od míče).
3. **Cooldown nad hysterezí** (řádky 195-216) — `autoSwitchCooldownRemaining`
   (`AUTO_PLAYER_SWITCH_COOLDOWN_MS = 1000`, `game/constants.ts:64`): i kdyby margin
   dovolil switch, dřív než za 1s od posledního switche se nestane. Při switchnutí se
   cooldown nastaví znovu (řádek 213-215).
4. **Manual override (Q/PŘEP.)** (řádky 226-267) — edge-detected (`switchEdge`),
   buď pass-and-switch (má-li `previousActive` míč pod kontrolou), nebo
   `findNearestTeammateToBall()` (vybere nejbližšího spoluhráče k míči, ne
   "další v pořadí"). Po switchi nastaví `manualLockRemaining = MANUAL_SWITCH_LOCK_DURATION`
   (2s) nebo `passAndSwitchConfig.manualLockSeconds` (taky 2s, viz `passAndSwitch.ts:27`).
5. **Manual lock vs. auto** (řádky 269-272) — pokud `manualLockRemaining > 0`,
   `active = manualPlayer`; jinak `active = auto`. Lock se dekrementuje i bez
   stisku (řádek 265-267).
6. **Temporary removal override** (řádky 218-224) — pokud je `manualActivePlayerId`
   zrovna temporary removed (bench/leaving), lock se okamžitě zruší a auto převezme
   roli ihned, bez čekání na vypršení locku.

### Online engine (multiplayer + training challenge, sdílený)

Stejná struktura, ale per-team (`['home','away']`), v
`project-hub-api/src/gameEngine/tick.ts`:

- `findAutoActivePlayer()` (řádky 214-251) = totéž co `auto` výše, včetně
  `autoSwitchCooldownRemaining[team]` cooldownu.
- `resolveActivePlayer()` (řádky 259-330) = totéž co manual override + lock,
  + `findNearestTeammateToBall()` (řádek 313) na bezmíčovou volbu.
- Temporary removal override na řádcích 267-273, identické s frontendem.

**Rozdíl od frontendu:** backend řeší **oba** týmy stejnou cestou (i AI tým
training challenge prochází `resolveActivePlayer`/`findAutoActivePlayer` —
`computeTrainingChallengeInput()` jen generuje `InputState`, který se pak
chová jako "lidský" vstup pro účely výběru aktivního hráče). Lokálně frontend
řeší jen `home`; `away` (bot) nemá `manualActivePlayerId`/`autoSwitchCooldown`
vůbec — bot "aktivního hráče" řeší jen jako `chaser` přímo v `ai.ts:69-77`
(nejbližší k míči, bez hysterze, bez cooldownu, bez manual locku — protože
tam žádný lidský vstup nikdy nepřijde).

### Otázky ze zadání

**Může ještě dojít k flickeru aktivního hráče?**
Teoreticky ano, ale jen na hraně přesně dvou nezávislých mechanismů najednou:
- Margin/fade hystereze (`ACTIVE_PLAYER_SWITCH_MARGIN` + fade) řeší jemné
  oscilace blízko míče.
- 1s cooldown řeší situaci, kdy margin/fade dovolí switch vícekrát rychle po
  sobě (např. dva hráči běží kolem míče a margin se kvůli rychlému pohybu
  na pár tiků "otevře" oběma směry).
Po zavedení cooldownu je praktická šance viditelného flickeru nízká, ale ne
nulová — pokud se hráč přesně na hraně 1s okna přepne dvakrát rychle za
sebou, vizuálně to může působit jako jedno přepnutí "se zpožděním", ne jako
flicker. Skutečný rychlý oscilační flicker (víc než 1 switch/s) je cooldownem
vyloučen.

**Jsou tam dvě pravidla, která řeší totéž?**
Margin/fade hystereze a cooldown řeší **podobný**, ne **stejný** problém:
margin/fade je o *prostorové* stabilitě (kdo je "dost blíž", aby si zasloužil
switch), cooldown je o *časové* stabilitě (jak často se switch směl stát).
Jsou komplementární, ne duplicitní — ale jsou to **dvě samostatné vrstvy
ochrany proti stejnému symptomu** (viditelné přeskakování), což zvyšuje
kognitivní zátěž při čtení kódu (čtenář musí pochopit obě, aby věděl, kdy
přesně k switchi dojde).

**Je některé pravidlo po zavedení 1s cooldownu možná zbytečné?**
Margin/fade (`ACTIVE_PLAYER_SWITCH_MARGIN_FADE_DISTANCE`) pravděpodobně
**není** zbytečný — bez něj by se po vypršení cooldownu mohl pick okamžitě
přehodit zpátky, pokud jsou dva hráči stále stejně blízko (cooldown sám o
sobě nerozhoduje *kdo* je vybrán, jen *kdy se to smělo stát*). Bez marginu by
to vedlo k "tikajícímu" přepínání přesně jednou za sekundu, což by bylo jen
pomalejší flicker, ne řešení. Margin a cooldown se tedy doplňují: margin řeší
*kdo*, cooldown řeší *kdy*.

**Je logika čitelná pro dalšího vývojáře?**
Středně. `computeSwitchMargin()` + `autoSwitchCooldownRemaining` +
`manualLockRemaining` + `previousActive` (která se počítá z `manualLockRemaining`
nebo `auto`) je čtyři propletené proměnné, které všechny ovlivňují "kdo je
teď aktivní". Komentáře u každého kusu jsou dobré izolovaně, ale není tam
jedno centrální místo, které by shrnulo *pořadí priorit* (manual lock > auto
s cooldownem > nearest fallback). Nový vývojář si to musí složit čtením
celého bloku 173-274 lineárně.

## 2. Q/PŘEP. logic

### Q bez míče vs. Q s míčem

`game/updateGame.ts:242-264` (frontend), `tick.ts:292-320` (backend) — identická
struktura:

1. `canPass = passAndSwitchConfig.enabled && hasBallControl(previousActive, ball, config)`
   — `hasBallControl()` (`passAndSwitch.ts:35-40`) testuje vzdálenost
   (`< controlDistance`, default `BALL_CONTROL_RADIUS` = 44px) a rychlost míče
   (`< maxBallSpeedForControl` = 240px/s).
2. Pokud `canPass`, `findBestPassTarget()` (`passAndSwitch.ts:94-118`) vybere
   nejlépe skórovaného spoluhráče (vzdálenost, postup dopředu, volný prostor,
   blokovaná přihrávková "ulička" — `scoreCandidate()` řádky 62-94). Pokud
   vrátí `null` (žádný smysluplný cíl), **spadne do bezmíčové větve níže**, i
   když `canPass` bylo `true` — to je důležitá implicitní vlastnost, ne
   exotický edge case (např. samotný hráč na hřišti).
3. Bez míče (`passTarget === null`): `findNearestTeammateToBall()`
   (`passAndSwitch.ts:120-141` resp. backendová verze) — nejbližší spoluhráč k
   míči, **vždy vynechá** `previousActive.id`.

### Mobil (PŘEP.)

`components/game/MobileTouchControls.tsx:132-171` — tlačítko PŘEP. jen nastaví
`t.switchPlayer = true/false` na pointer down/up, stejně jako klávesa Q na
desktopu (`InputState.switchPlayer`). `GameCanvas.tsx:62-72` merguje touch a
keyboard input přes OR (`switchPlayer: input.switchPlayer || touch.switchPlayer`).
Od chvíle, kdy je `InputState.switchPlayer === true`, hra **neví a nepotřebuje
vědět**, jestli to přišlo z klávesnice nebo z dotyku — `switchEdge` detekce
(`input.switchPlayer && !state.switchKeyWasDown`) je úplně shodná pro oba.

### Otázky ze zadání

**Je chování konzistentní mezi desktopem a mobilem?**
Ano, beze zbytku — `switchPlayer` je jediný boolean flag sloučený před tím,
než se dostane do `updateGame()`/`tickGame()`. Žádná logika v `updateGame.ts`
ani `tick.ts` neví, že existuje mobil. To je čistá vlastnost architektury
(input abstrakce), ne shoda náhod.

**Není Q/PŘEP. přetížené příliš mnoha významy?**
Ano, jedna klávesa/tlačítko dnes znamená čtyři různé akce podle kontextu:
(a) přihraj a přepni (s míčem, je cíl), (b) přepni na nejbližšího k míči (bez
míče, je kandidát), (c) nedělej nic vizuálně, ale nastav passTarget jako
nového aktivního hráče i bez fyzické přihrávky (pass-and-switch větev *vždy*
nastaví `manualActivePlayerId`, i kdyby `computePassVelocity` dala téměř nulový
efekt), (d) zůstaň na současném hráči (žádný jiný teammate k dispozici).
Hráč nemá žádný vizuální rozdíl mezi (a) a (b) předem — uvidí jen výsledek.
To je přetížení v sémantice tlačítka, ne v kódu (kód to rozlišuje jasně),
ale z pohledu hráče je to jeden vstup se čtyřmi možnými výsledky.

**Je pass-and-switch oddělený dost jasně?**
Na úrovni kódu ano — `passAndSwitch.ts` je samostatný modul, `findBestPassTarget`
vs `findNearestTeammateToBall` jsou dvě jasně pojmenované funkce. Na úrovni
**chování pro hráče** je to méně jasné: oba případy dělají totéž (změna
`manualActivePlayerId` + `manualLockRemaining`), liší se jen tím, jestli se
navíc přidá `passVel` k míči. Hráč co se snaží předvídat výsledek Q/PŘEP. musí
znát přesné prahy `hasBallControl()` (44px, 240px/s) — to není nikde
indikováno v UI.

**Může Q/PŘEP. dělat něco překvapivého?**
Ano, jeden konkrétní case: pokud `previousActive` má míč "skoro pod
kontrolou" (`hasBallControl` true), ale `findBestPassTarget` nenajde žádného
rozumného příjemce (např. hráč je osamocen v rohu), `canPass` bylo `true`,
ale `passTarget` je `null` → spadne do `findNearestTeammateToBall()` větve.
Výsledek: **stisk Q s míčem pod nohou v rohu hřiště přepne aktivního hráče
beze přihrávky** — míč zůstane ležet u (už neaktivního) hráče. To může
působit jako bug ("kde mi zmizel míč"), i když je to záměrný fallback.

## 3. Support teammate intelligence

### `/hra/bot` (lokální)

`game/supportPositioning.ts:11-75`, voláno z `updateGame.ts:414`
(`applySupportPositioning(homePlayers, active, ball, dt)`) — **pevné role**:
`nonActive[0]` = defender, `nonActive[1]` = runner (index v poli, ne
vzdálenost/role). Defender cílí `(FIELD_L + 25% šířky, clampovaná výška míče)`
— statická hloubka. Runner cílí `(ball.x + 120, ball.y ± 80)` s jedním
"nudge" pravidlem (řádky 50-55): pokud je runner cíl blíž než 70px od
aktivního hráče, posune se výškově o 40px. Žádná konfigurace, žádný
`supportChaseWeight`-like parametr.

### Online (multiplayer + training challenge)

`project-hub-api/src/gameEngine/teamBehavior.ts:126-154`
(`computeTeamSupportInputs`) — **role podle vzdálenosti od vlastní brány**
(`[anchor, runner] = teammates.sort(...)`, řádek 140-142), ne podle indexu v
poli. Anchor: `computeAnchorTarget()` (řádky 63-76, statická hloubka 18 %
šířky hřiště + 50 % výšky míče). Runner: `computeRunnerTarget()` (řádky
95-119) — `leadOffset = attackDir * 120 * supportChaseWeight` (multiplayer
0.35 → 42px, training challenge home 0.7 → 84px), plus `pushApart()` od
aktivního hráče **a** od anchor cíle (`supportSpacing` — 110 multiplayer, 90
training challenge).

### Rozdíly

| | `/hra/bot` | Online |
|---|---|---|
| Role assignment | index v poli (`nonActive[0]/[1]`) | vzdálenost od vlastní brány |
| Konfigurovatelnost | žádná (hardcoded) | `TeamBehaviorConfig` (per team) |
| Runner lead offset | fixní 120px | `120 * supportChaseWeight` (0.35–0.7) |
| Odstup od aktivního | jen "nudge" při <70px | `pushApart()` vždy, `supportSpacing` |
| Odstup od druhého support hráče | žádný explicitní | `pushApart()` od anchor cíle |
| `supportCanShoot` | neexistuje (bot support nikdy nekope) | jen training challenge home |

### Otázky ze zadání

**Neperou se support targety se same-team separací?**
**Ano, částečně — ve třech vrstvách najednou pro online engine:**
1. `computeTeamSupportInputs` / `applySupportPositioning` — *cílová pozice*
   (kam se support hráč snaží jít).
2. Online: `enforceMinDistance()` (`tick.ts:529-541`, jen pokud
   `teammateSupportMode !== 'none'`) — *tvrdá korekce* po pohybu vůči
   `active.x/y` a mezi dvěma teammates, na `supportSpacing`.
3. Online i lokální: `separateSameTeamPlayers()` (`physics.ts`, voláno
   nepodmínečně) — *měkký push* na `TEAMMATE_SEPARATION_RADIUS` (42px),
   aktivní hráč nikdy posunut.

Vrstvy 2 a 3 dělají **podobnou věc** (drž support hráče dál od ostatních),
ale s jinými prahy (90–110px vs. 42px), jiným mechanismem (tvrdý teleport vs.
měkký push) a jinou podmínkou (gated vs. vždy). Protože `supportSpacing`
(90–110px) je výrazně větší než `TEAMMATE_SEPARATION_RADIUS` (42px), vrstva 3
v praxi nikdy nezasáhne, pokud vrstva 2 už funguje (support hráč by se do 42px
dostal jen kdyby `enforceMinDistance` selhalo nebo bylo vypnuté přes
`teammateSupportMode: 'none'`) — to je přesně proč byla vrstva 3 zavedena
(baseline pojistka nezávislá na configu), ale výsledkem jsou **dvě
samostatná, nekoordinovaná pravidla se stejným cílem**.

**Není některé spacing pravidlo duplicitní?**
`enforceMinDistance()` (online, support-specific) a `separateSameTeamPlayers()`
(both engines, obecné) se překrývají v účelu, ne v parametrech. Nejde o
1:1 duplicitu (jiné prahy, jiný mechanismus), ale o **dva nezávislé bezpečnostní
sítě nad stejným problémem** — viz tabulka v sekci 6.

**Jsou spoluhráči opravdu užiteční, nebo jen vizuálně aktivní?**
Omezeně užiteční:
- Lokálně: support hráči **nikdy nekopou** (`applySupportPositioning` nemá
  žádnou kick logiku) — jediný jejich přínos je nepřímý dotek míče přes
  `resolvePlayerBallCollisions()` (bump), což může míč nešťastně odrazit, ne
  pomoct.
- Online multiplayer: stejně — `supportCanShoot: false`.
- Training challenge home: **jediný mód, kde support hráč aktivně kope**
  (`supportCanShoot: true`, `tick.ts:514-525`, síla `SUPPORT_KICK_FORCE` = 320,
  náhodný úhel `±30°`). Tady jsou support hráči skutečně "druhá hrozba", ne
  jen kulisa.

**Kdy support hráč hráči pomáhá a kdy překáží?**
Pomáhá: zaplňuje prostor, takže soupeřův bot/AI nemá volné pole (formace
vypadá smysluplně), a v training challenge skutečně střílí. Překáží: protože
support hráči **nekopou** v `/hra/bot` a multiplayeru, jejich kontakt s míčem
je čistě fyzikální bump (`BUMP_FORCE`) — pokud support hráč nešťastně stojí
mezi aktivním hráčem a brankou, může míč odkopnout nečekaným směrem bez
jakéhokoli záměru, což hráč nemůže ovlivnit ani předvídat.

## 4. Bot and AI behavior

### `/hra/bot` (lokální bot)

`game/ai.ts:60-172` — `chaser` = nejbližší bot k míči, `chaseTarget()`
(řádky 41-58) offsetuje cíl 36px od nejbližší zdi (přístup ze strany, ne čelně
do zdi). Kop: `BOT_KICK_FORCE = 460`, `BOT_KICK_RANGE = 40px`,
`BOT_KICK_COOLDOWN = 0.85s` (0.55× u zdi = 0.47s). Mix útočného směru a
"wall-avoidance" (45 %/55 % u zdi). Ostatní (non-chaser) boti se vrací na
`basePos` rychlostí `BOT_SPEED * 0.5`.

### `/hra/bot-dis`

`game/updateGame.ts:422-428` — `updateAI()` se **vůbec nezavolá**
(`gameModeConfig.disableOpponentAI`). Away tým zůstává zcela bez pohybu (žádné
`vel`, žádný kop). `separateSameTeamPlayers()` pro away tým se taky nezavolá
(je součástí `updateAI()`), což je v pořádku — bez pohybu nemůže dojít k
novému překrytí mezi boty samými (výchozí pozice z `createInitialState()` se
nepřekrývají).

### Training challenge AI (online)

`project-hub-api/src/gameEngine/ai.ts:14-45`
(`computeTrainingChallengeInput`) — generuje **`InputState`**, ne přímý pohyb.
Najde nejbližšího bota k míči, vrátí směrový vstup (`up/down/left/right`) +
`kick: true` v dosahu `KICK_RANGE` (40px). Tento vstup pak jde **stejnou
cestou jako lidský vstup** přes `resolveActivePlayer`/`movePlayerByInput` v
`tick.ts` — efektivní rychlost = `PLAYER_SPEED` (210px/s, ne `BOT_SPEED`
165px/s). Žádné wall-avoidance, žádná variace úhlu kopu — `computeKickDirection()`
v `tick.ts:176-188` použije buď held klávesy, nebo fixní směr k brance
(`team === 'home' ? 1 : -1`).

### Srovnání

| | `/hra/bot` (lokální) | Training challenge (online) |
|---|---|---|
| Rychlost chase | `BOT_SPEED` = 165px/s | efektivně `PLAYER_SPEED` = 210px/s |
| Kop síla | `BOT_KICK_FORCE` = 460 | `KICK_FORCE` = 486 (stejná jako lidský hráč!) |
| Kop cooldown | 0.85s (0.47s u zdi) | `KICK_COOLDOWN` = 0.25s (stejný jako lidský hráč) |
| Wall-avoidance | ano (45/55 blend) | ne |
| Variace úhlu kopu | ano (±10–25°) | ne (přesný směr k brance) |
| Support kope | ne | ano (`supportCanShoot: true`, training challenge home) |
| Support agresivita | n/a (žádná konfigurace) | `supportChaseWeight: 0.7`, `supportSpacing: 90` |

### Otázky ze zadání

**Je rozdíl mezi `/hra/bot` a training challenge záměrný a čitelný?**
**Záměrný ano** (komentáře v kódu explicitně říkají proč — `tick.ts:428-431`,
`teamBehavior.ts:4-7`), **čitelný napůl**. Je čitelné, *že* se liší (configy
jsou explicitní), ale není čitelné *jak silně* se liší, dokud nesrovnáte
konkrétní čísla (jako v tabulce výše) — kód samotný to nikde nesrovnává.
Rozdíl kop-síly (460 vs. 486) a cooldownu (0.85s vs. 0.25s) je výrazný a může
působit jako nesladěná hodnota mezi dvěma nezávisle psanými AI, ne jako
vědomé designové rozhodnutí (viz audit `movement-kick-physics-analysis.md`
sekce 3, nález #2 — toto pozorování tam bylo už dřív zaznamenané a od té
doby se nezměnilo).

**Není training challenge moc agresivní jen kvůli starým konstantám?**
Možná. `supportChaseWeight: 0.7` a `supportSpacing: 90` (vs. multiplayer 0.35
a 110) + `supportCanShoot: true` dělají training challenge home tým
objektivně útočnější — runner běží blíž k míči (84px lead offset vs. 42px) a
navíc střílí. Kombinace s vyšší efektivní kop-silou (486 vs. lokální bot 460)
a kratším cooldownem (0.25s vs. 0.85s) znamená, že training challenge AI je
**v každém měřitelném parametru** agresivnější než lokální bot — není jasné,
jestli to je designový záměr ("training challenge má být těžší") nebo
nezáměrný drift mezi dvěma samostatnými implementacemi.

**Existuje pravidlo, které by mělo být konfigurovatelné místo hardcoded?**
Lokální bot (`game/ai.ts`) má **vše** hardcoded — `BOT_KICK_FORCE`,
`BOT_SPEED`, wall-avoidance blend (45/55), variace úhlu (20°/50°) — žádný
ekvivalent `TeamBehaviorConfig`. Online engine **už má** tuto strukturu
(`TeamBehaviorConfig`), lokální engine ne. Pokud by měl `/hra/bot` mít víc
obtížností (easy/normal/hard) nebo budoucí "bot-dis"-like varianty, hardcoded
konstanty v `ai.ts` by museli být extrahovány do podobné config struktury
nejdřív.

**Co by šlo zjednodušit, aniž by se zhoršila hra?**
- Sladit `BOT_KICK_FORCE` (460) s online `KICK_FORCE` (486) — buď úmyslně
  nastavit obě na stejnou hodnotu, nebo dokumentovat *proč* se liší (žádný
  komentář to dnes nevysvětluje).
- `BOT_KICK_COOLDOWN` (0.85s) vs. online AI cooldown (0.25s, shodný s
  lidským hráčem) — výrazný rozdíl bez vysvětlení.

## 5. Kick / ball-control interactions

Pořadí v jednom ticku (`updateGame.ts:308-410`, shodně `tick.ts:392-499`):

1. **Ball control** (řádky 315-355) — pouze pokud `!input.kick` a
   `activeDist < BALL_CONTROL_RADIUS` (44px). Tlumí míč (`BALL_CONTROL_DAMPING`
   = 0.86) a táhne ho k bodu před hráčem.
2. **Ball retention** (uvnitř ball control bloku, řádky 338-354) — jen pokud
   `activeDist < BALL_RETENTION_RADIUS` (42px, **menší** než control radius),
   `ballSpeed < BALL_RETENTION_MAX_BALL_SPEED` (180px/s) a žádný soupeř blíž
   než `BALL_RETENTION_NO_OPPONENT_RADIUS` (70px). Blendne `ball.vel` směrem k
   `active.vel` o `BALL_RETENTION_STRENGTH` (0.14), navíc extra damping
   (`BALL_STOP_DAMPING` = 0.82) pokud hráč nedrží směr.
3. **Kop** (řádky 357-410) — **explicitně podmíněn `!input.kick` výše**, takže
   ball control/retention se **deaktivuje přesně na frame, kdy `input.kick`
   je `true`** (komentář řádek 313: "Deactivated on kick so the control
   impulse never dampens shots"). Retention/control tedy **nemůže** bojovat
   proti aktuálnímu stisku KOP — ale **může** ovlivnit míč na frame *před*
   uvolněním kopu (charged kick čeká na release, ne na press — během držení
   `input.kick` je stále `true`, takže control/retention je po celou dobu
   nabíjení vypnutý, ne jen na moment výstřelu).
4. **Snap míče** (`snapBallInFrontOfKicker`, řádek 384) — provede se **uvnitř**
   kop bloku, těsně před výpočtem `forceMultiplier`/kontaktního nudge, tedy po
   tom, co byl `input.kick` uvolněn a kop se reálně spustil.
5. **Contact-kick/scrum** (řádky 386-400) — `inContact` test (soupeř blíž než
   `KICK_CONTACT_RANGE` = 50px) **po** snapu, takže nudge (`KICK_CONTACT_BALL_NUDGE`
   = 12px) posouvá míč **z** už-snapnuté pozice, ne z původní (pre-snap) pozice.

### Otázky ze zadání

**Není některé pravidlo už po snapu míče zbytečné?**
Contact-kick nudge (12px) **není** zbytečný po zavedení snapu — řeší jiný
problém. Snap řeší "ať míč není uvnitř kolizního poloměru **kickera**" (vždy,
při každém kopu). Contact-nudge řeší "ať míč navíc uteče **soupeři**, který
stojí ve scrumu" — to snap neřeší, protože snap pozicuje míč relativně k
**kickerovi**, ne relativně k nejbližšímu soupeři. Obě pravidla jsou
komplementární, ne duplicitní — ale fungují **na sebe navazujícím pořadí**
(snap nejdřív, nudge na výsledek snapu), což znamená, že úprava jednoho bez
znalosti druhého může vést k překvapivým výsledným pozicím míče.

**Nemůže ball retention bojovat proti střele?**
Ne v aktuálním kódu — `if (!input.kick && ...)` na řádku 315 obaluje **celý**
control+retention blok, takže během `input.kick === true` (od stisku do
uvolnění, tj. po celou dobu nabíjení charged kicku) se retention nevykoná ani
jednou. Jakmile se kop uvolní, retention se ten samý frame nevykoná (protože
v tom frame `input.kick` je `false`, ale spadne do `else` větve, která řeší
kop, ne control blok). Riziko kolize těchto dvou pravidel je tedy
architektonicky vyloučeno pořadím `if/else`, ne nešťastnou shodou — je to
robustní, ne fragilní.

**Nemůže contact-kick/scrum vytvářet chaos?**
Potenciální riziko: `inContact` test používá **aktuální** vzdálenost soupeře
od míče (`nearestOpponentDistance`) **po** snapu (řádek 390), ne před ním.
Pokud snap přesune míč **blíž** k nějakému soupeři (např. kicker kope směrem,
kde soupeř náhodou stojí), může se `inContact` vyhodnotit jinak, než by se
vyhodnotilo z původní (pre-snap) pozice míče. To je okrajový edge case (snap
posune míč jen ~32px ve směru kopu, ne libovolně), ale je to závislost mezi
dvěma pravidly, která nejsou navržena společně od začátku — spíš poskládána
v různých commitech (audit `movement-kick-physics-analysis.md` to
identifikoval jako budoucí riziko, teď je to implementováno a riziko je
nízké, ale existuje).

**Je rozdíl mezi normální střelou a pass-and-switch jasný?**
Na úrovni kódu jasný — jsou to dvě **zcela oddělené** cesty (`updateGame.ts`
kop blok vs. `passAndSwitch.ts` `computePassVelocity`), nikdy se nevolají
navzájem. Force range se liší (`KICK_FORCE * forceMultiplier` ~437–729 pro
normální kop vs. `[minForce, maxForce]` = `[320, 520]` pro přihrávku,
`passAndSwitch.ts:25-26`/konstanty). Přihrávka **nemá** charged mechaniku
(žádné držení), **nemá** snap (přihrávka nikdy nepřesouvá míč, jen mu dává
velocity), a **nemá** contact-kick nudge. Pro hráče je rozdíl jasný akcí
(Space/KOP vs. Q/PŘEP.), ne sdílenou implementací.

## 6. Anti-overlap / spacing rules

Souhrnná tabulka — **kolik různých pravidel dnes drží hráče od sebe**:

| Pravidlo | Kde | Týmy | Mechanismus | Práh | Podmínka |
|---|---|---|---|---|---|
| `separateSameTeamPlayers()` | oba enginy, `physics.ts` | home **i** away/oba | měkký push, aktivní = kotva | `TEAMMATE_SEPARATION_RADIUS` 42px | vždy (nepodmínečně) |
| `enforceMinDistance()` (jen online) | `tick.ts:529-541` | home i away (per team) | tvrdá korekce (teleport na min. vzdálenost) | `supportSpacing` 90–110px | jen `teammateSupportMode !== 'none'` |
| Runner `pushApart()` od active i anchor (jen online) | `teamBehavior.ts:110-113` | home i away | cílová pozice, ne korekce pohybu | `supportSpacing` 90–110px | jen `teammateSupportMode !== 'none'` (uvnitř `computeTeamSupportInputs`) |
| Support "nudge" od aktivního (jen lokální) | `supportPositioning.ts:50-55` | jen home | posun cíle, ne korekce pohybu | 70px (hardcoded, ne konstanta) | vždy v rámci `applySupportPositioning` |
| `resolvePlayerBallCollisions()` (ne player-player, ale ovlivňuje rozestupy nepřímo) | oba enginy, `physics.ts` | všichni hráči vs. míč | bump | `PLAYER_RADIUS + BALL_RADIUS` (28px) | vždy, ale jen vůči míči, ne mezi hráči |

**Kolik různých pravidel dnes drží hráče od sebe?**
**Čtyři** explicitní same-team mechanismy (první čtyři řádky tabulky), plus
jeden nepřímý efekt (`resolvePlayerBallCollisions`, který odsouvá míč, ne
hráče, ale tím nepřímo měnívá relativní pozice). To je hodně na jeden
koncept "nestoupej si na spoluhráče".

**Neřeší dvě pravidla totéž?**
Ano — `enforceMinDistance()` a runner `pushApart()` (oba jen online, oba
gated `teammateSupportMode !== 'none'`, oba používají `supportSpacing`) řeší
prakticky totéž z **dvou různých úhlů**: `pushApart()` upravuje **cílovou
pozici** (kam se support hráč snaží jít), `enforceMinDistance()** upravuje
**výslednou pozici** (kde support hráč skutečně skončí po pohybu). Jsou to
dvě vrstvy nad stejným číslem (`supportSpacing`), což je obhajitelné (cíl
může být "správný", ale rychlejší aktivní hráč do support hráče vrazí dřív,
než support stihne zareagovat — proto komentář na `tick.ts:150-154`
explicitně říká "guarantee... regardless of relative speeds"), ale je to
přesně ten typ duplicity, který audit má zachytit.

`separateSameTeamPlayers()` (baseline, 42px) je oproti tomu **záměrně
nezávislá** vrstva (mirrors komentáře explicitně říkají "independent of
supportSpacing") — funguje jako pojistka **pro případ**, že by
`teammateSupportMode` bylo `'none'` a první dvě vrstvy by se nevykonaly vůbec.
V dnešních presetech (`MULTIPLAYER_TEAM_BEHAVIOR`, `TRAINING_CHALLENGE_*`)
**žádný** mód nemá `teammateSupportMode: 'none'`, takže tahle pojistka dnes
**nikdy reálně nezasáhne** (42px je vždy menší práh než 90–110px, support
hráč se do 42px nedostane, pokud 90-110px vrstva funguje) — je to čistě
budoucí pojistka, ne aktivně používaná logika.

**Které pravidlo je ochranná pojistka a které je skutečná AI logika?**
- **Skutečná AI logika** (rozhoduje *kam* support hráč chce jít):
  `computeTeamSupportInputs`/`applySupportPositioning` (cílové pozice, role
  anchor/runner).
- **Ochranná pojistka** (zaručuje, že se *nestane* něco nechtěného, bez
  ohledu na to, co AI logika navrhla): `enforceMinDistance()`,
  `separateSameTeamPlayers()`, support "nudge" v lokálním enginu.
- Runner `pushApart()` je hybrid — je součástí *návrhu cíle* (AI logika), ale
  jeho jediný účel je *zabránit* překrytí (pojistková motivace), jen
  implementovaná jako úprava cíle, ne jako korekce po pohybu.

**Dá se něco sloučit nebo zjednodušit?**
Ano — `enforceMinDistance()` a runner `pushApart()` v online enginu by šly
nahradit jedním mechanismem (buď nechat `pushApart()` navrhovat cíl správně a
spolehnout se jen na `separateSameTeamPlayers()`/`enforceMinDistance()` jako
jedinou bezpečnostní síť, nebo naopak). Lokální engine na to nemá ani
ekvivalent (jen "nudge" + nově `separateSameTeamPlayers()`), takže by sjednocení
muselo řešit i rozdíl mezi enginy, ne jen uvnitř jednoho. Tohle není
**triviální** sloučení (různé mechanismy, různé prahy), ale je to směr, kam
by zjednodušení mělo směřovat.

## 7. Mode differences

| | `/hra/bot` | `/hra/bot-dis` | Multiplayer | Training challenge |
|---|---|---|---|---|
| **Kdo ovládá home** | lidský hráč (klávesnice/touch) | lidský hráč | lidský hráč | lidský hráč (guest) |
| **Kdo ovládá away** | `game/ai.ts` bot | **nikdo** (`disableOpponentAI`) | lidský hráč (2. připojení) | `computeTrainingChallengeInput()` AI |
| **Support (home)** | `applySupportPositioning` (fixní role index) | stejné jako `/hra/bot` (nezměněno) | `computeTeamSupportInputs`, `teammateSupportMode: 'basic'` | stejné jako multiplayer guest (`TRAINING_CHALLENGE_GUEST_BEHAVIOR` = kopie multiplayer configu) |
| **Support (away)** | žádné (boti nemají support koncept) | n/a (away nehybný) | `teammateSupportMode: 'basic'` | `teammateSupportMode: 'aggressive'`, `supportCanShoot: true` |
| **Kop (home)** | charged (`KICK_FORCE` 486, tap 0.9–1.5×) | stejné jako `/hra/bot` | charged (stejné konstanty) | charged (guest, stejné konstanty) |
| **Kop (away)** | instant, `BOT_KICK_FORCE` 460, cooldown 0.85s | n/a (žádný kop) | charged (lidský hráč) | instant, `KICK_FORCE` 486, cooldown 0.25s |
| **Active player (home)** | hystereze + 1s cooldown + manual lock | stejné jako `/hra/bot` | stejné, server-authoritative | stejné, server-authoritative |
| **Active player (away)** | `chaser` (jen nejbližší, žádná hystereze) | n/a | stejné jako home (server-authoritative) | stejné jako home, jen řízené AI vstupem |
| **Spacing (home)** | `separateSameTeamPlayers` (42px, baseline) | stejné | `separateSameTeamPlayers` + `enforceMinDistance`/`pushApart` (90–110px) | stejné jako multiplayer |
| **Spacing (away)** | `separateSameTeamPlayers` (42px) | n/a (žádný pohyb) | stejné jako home | stejné jako home, ale agresivnější (90px, `supportChaseWeight: 0.7`) |
| **Match duration** | `MATCH_DURATION` 90s | `matchDurationSeconds` 600s (config override) | `MATCH_DURATION` 90s | `MATCH_DURATION` 90s |
| **Restituce odrazu** | 0.75× (`BALL_WALL_RESTITUTION`) | stejné | 0.75× (sjednoceno, viz dřívější audit) | stejné |
| **Own-goal tracking** | ano (`lastTouchTeam`) | ano (nezměněno) | dle dřívějšího auditu: ne | dle dřívějšího auditu: ne |

**Co je záměrný rozdíl:** `/hra/bot-dis` (vypnuté AI, delší čas — explicitně
pro trénink), training challenge agresivnější support (`aggressive` mode,
`supportCanShoot` — explicitně pro výzvu proti AI bez lidského protihráče),
charged vs. instant kop (lidský vs. AI ovládání — `usesChargedKick` flag).

**Co vypadá jako historický drift:** `BOT_KICK_FORCE` (460, lokální) vs.
`KICK_FORCE` použitý pro online AI (486) — žádný komentář nevysvětluje rozdíl.
`BOT_KICK_COOLDOWN` (0.85s) vs. online AI cooldown (0.25s, shodný s
charged-kick cooldownem lidského hráče) — výrazný rozdíl, pravděpodobně
proto, že online AI prochází **stejnou** kop-aplikační větví jako lidský
hráč (jen s `usesChargedKick: false`), zatímco lokální bot má **vlastní**
implementaci s vlastním (nižším) tempem.

## 8. Překombinovanost a kandidáti na odstranění

| Pravidlo / mechanika | Kde je | Proč existuje | Je stále potřeba? | Riziko odstranění | Doporučení |
|---|---|---|---|---|---|
| Active-player hysteresis (margin + fade) | `updateGame.ts:81-88`, `tick.ts:68-75` | Zabránit jitteru, když jsou dva hráči stejně daleko od míče | Ano — řeší *kdo*, cooldown řeší jen *kdy* | Střední — bez něj by po vypršení cooldownu vznikl pravidelný "tik" switch | `keep` |
| Auto-switch cooldown (1s) | `constants.ts` (oba), `updateGame.ts:195-216`, `tick.ts:231-247` | KISS pojistka proti zbytkovému flickeru po hysterezi | Ano — nedávno zavedeno cíleně proti reálně pozorovanému problému | Nízké — čistě časový limiter, snadno vypnutelný nastavením na 0 | `keep` |
| Manual lock (2s) | `constants.ts`, `updateGame.ts:226-267`, `tick.ts:281-323` | Po Q/PŘEP. zabránit okamžitému přebrání auto-pickem | Ano — bez něj by manual switch mohl být zrušen už příští tik | Vysoké — bez něj je manual switch nepoužitelný | `keep` |
| Q smart switch (`findNearestTeammateToBall`) | `passAndSwitch.ts` (oba) | Nahradit "next in order" cyklování smysluplným výběrem | Ano — explicitně požadovaná nedávná úprava | Nízké, ale ztratila by se nedávno přidaná hodnota | `keep` |
| Pass-and-switch | `passAndSwitch.ts`, `updateGame.ts:242-256`, `tick.ts:292-320` | Q s míčem = smysluplná přihrávka, ne jen switch | Ano — jádrová mechanika ovládání | Vysoké — zásadní herní mechanika | `keep` |
| Charged kick | `updateGame.ts:357-410`, `tick.ts:452-489` | Tap = slabší, hold = silnější — záměrný gameplay prvek | Ano | Vysoké — viditelná herní mechanika | `keep` |
| Snap míče před kickera | `physics.ts` (oba), voláno z kop bloků | Zabránit reverzu střely vlastní kolizí | Ano — řeší konkrétní reportovaný bug | Střední — bez něj se vrátí původní bug | `keep` |
| Ball retention | `updateGame.ts:338-354`, `tick.ts:422-444` | Míč "nesklouzne" při zastavení/otočce | Ano, ale úzce gated (jen `usesChargedKick` týmy) | Nízké — gating je už konzervativní | `keep but simplify` (zvážit, jestli 5 podmínek/konstant nejde sloučit do 2-3) |
| Contact-kick/scrum | `updateGame.ts:386-400`, `tick.ts:471-484` | Kop ve scrumu nesmí "zapadnout" do soupeřů | Ano, ale interaguje se snapem (viz sekce 5) | Střední — funguje, ale pořadí se snapem je implicitní, ne zdokumentované | `keep but simplify` (zdokumentovat pořadí snap→nudge explicitně, případně sjednotit do jednoho výpočtu) |
| Teammate separation (= `separateSameTeamPlayers`) | `physics.ts` (oba) | Baseline anti-overlap, nezávislý na configu | Ano — explicitně navržen jako pojistka | Nízké samo o sobě, ale duplicitní s `enforceMinDistance` | `keep but simplify` (viz merge below) |
| `supportSpacing` (`enforceMinDistance` + runner `pushApart`) | `tick.ts:529-541`, `teamBehavior.ts:110-113` | Support hráči nesmí stát na sobě/na aktivním | Ano, ale dvě vrstvy nad stejným číslem | Střední — odstranění jedné vrstvy by mohlo odhalit edge cases, které druhá řešila | `merge with separateSameTeamPlayers` (zvážit nahrazení `enforceMinDistance` jen voláním `separateSameTeamPlayers` s vyšším radiusem, nebo naopak) |
| Same-team anti-overlap (aktivní = kotva) | `physics.ts` (oba) | Aktivní hráč se nemá "odhazovat" support hráči | Ano — nedávno explicitně požadováno | Nízké | `keep` |
| Support target logic (anchor/runner) | `supportPositioning.ts` (lokální), `teamBehavior.ts` (online) | Support hráči mají vypadat užitečně, ne stát na místě | Ano jako vizuální/formační prvek | Nízké odstranit, ale ztratí se "živost" formace | `keep but simplify` (lokální engine nemá konfigurovatelnost, kterou online má — zvážit sjednocení rozhraní, ne nutně chování) |
| `supportCanShoot` | `teamBehavior.ts`, `tick.ts:514-525` | Training challenge potřebuje druhou hrozbu bez lidského hráče | Ano — jediný mód, kde support skutečně přispívá ke skóre | Nízké, je to izolovaný flag | `keep` |
| Training challenge aggression (`supportChaseWeight: 0.7`, `supportSpacing: 90`, instant kop 486/0.25s) | `teamBehavior.ts:42-49` | Kompenzovat absenci lidského protihráče vyšší obtížností AI | Pravděpodobně, ale neověřeno hraním | Nízké upravit hodnoty, vysoké pokud se sníží moc a hra se "rozsype" | `needs playtest` |

## 9. Doporučení dalších kroků

### 3 malé bezpečné úpravy (nezasahují do gameplay feelu, jen do čitelnosti/konzistence)

1. **Zdokumentovat/sladit `BOT_KICK_FORCE` (460) vs. online AI `KICK_FORCE` (486)**
   — buď přidat komentář vysvětlující záměrný rozdíl, nebo navrhnout sladění
   čísel v budoucím tasku (ne v tomto auditu).
2. **Přidat jeden souhrnný komentář na začátek `updateGame.ts`/`tick.ts` aktivního
   výběru** (sekce 173-274/259-330), který shrne pořadí priorit (manual lock >
   auto s cooldownem+hysterezí > nearest fallback) — dnešní kód to vysvětluje
   po kusech, ne najednou.
3. **Přidat explicitní komentář k pořadí snap→contact-nudge** v obou kop blocích,
   že `inContact` test běží na již-snapnuté pozici, ne na pre-snap pozici —
   dnes je to pravda jen díky pořadí řádků, nikoho to nezmiňuje.

### 3 věci, které raději zatím neměnit

1. **Sloučení `enforceMinDistance`/runner `pushApart`/`separateSameTeamPlayers`**
   (sekce 6, 8) — vypadá jako duplicita, ale tři různé mechanismy (cíl vs.
   tvrdá korekce vs. měkký push) mohou řešit subtilně různé edge cases
   (rychlost, gating, anchor-vs-runner). Sloučení bez playtestu riskuje
   regresi v support formacích.
2. **Sjednocení lokálního bota (`game/ai.ts`) s `TeamBehaviorConfig` strukturou**
   online enginu — velký zásah (jiný runtime, jiná datová reprezentace, viz
   `engine-unification-plan.md`), ne vedlejší produkt čtení tohoto auditu.
3. **Snížení training challenge agresivity** (`supportChaseWeight`,
   `supportSpacing`, kop síla/cooldown) — bez ručního playtestu nelze
   posoudit, jestli je dnešní úroveň "moc agresivní" nebo "správně těžká pro
   mód bez lidského protihráče".

### 3 otázky pro ruční playtest v `/hra/bot-dis`

1. **Cítí se same-team separace (aktivní = kotva) přirozeně**, když je hráč
   blízko nehybného soupeře a support spoluhráč se snaží zaujmout formační
   pozici skrz/kolem hráče? (away tým je v `/hra/bot-dis` nehybný, takže tohle
   je čistý test home-team support chování bez rušení od bota.)
2. **Je 1s auto-switch cooldown příjemný, nebo působí zaseknutě**, když hráč
   rychle přihrává mezi dvěma spoluhráči a snaží se nechat hru automaticky
   vybrat nejbližšího k odraženému míči?
3. **Je snap míče + charged kick spolehlivý ve všech směrech** (vlevo, vpravo,
   diagonálně), bez nehybného soupeře, který by mohl maskovat problém přes
   `inContact` větev? `/hra/bot-dis` je ideální izolované prostředí na ověření
   čistého kopu bez scrum/contact interakce.

---

Tento dokument záměrně nenavrhuje konkrétní kódové změny — to je předmět
navazujícího rozhodnutí. Cílem bylo zmapovat, co hra **dnes skutečně dělá**,
kde se pravidla doplňují, kde se překrývají, a kde vznikla komplexita jako
vedlejší produkt postupných, samostatně odůvodněných oprav.
