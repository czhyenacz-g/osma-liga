# Audit: rozdíly mezi herními režimy a sdílená logika

Status: pouze analýza, žádný kód nebyl měněn. Žádný build/test nebyl potřeba (čistě statická analýza zdrojového kódu).

Rozsah: `/hra/bot`, klasický online multiplayer (`/hra/multiplayer` → `/hra/online/[code]`),
automatická tréninková výzva (training challenge).

## 1. Shrnutí

Dnes existují **dva fyzicky odlišné enginy**, ne tři:

- **Lokální engine** (`game/*` v `osma-liga`) — používá výhradně `/hra/bot`. Běží celý v
  prohlížeči, žádný server, žádná perzistence pozice.
- **Online engine** (`project-hub-api/src/gameEngine/*`) — používá **klasický multiplayer i
  training challenge**. Běží na serveru (`project-hub-api`), klient jen vykresluje snapshoty
  přijaté přes Socket.IO.

Training challenge **je** technicky klasický multiplayer s jedním rozdílem: na straně „home"
neseděl žádný reálný hráč, takže byl doplněn jednoduchý AI vstup
(`computeTrainingChallengeInput`) a auto-start při připojení hosta. Frontendová komponenta
(`OnlineGameClient.tsx`) je pro multiplayer i training challenge **stejná** — to je důležité
zjištění, protože to znamená, že first-goal/full-time commentary už dnes **je** sdílená mezi
těmito dvěma režimy (viz sekce 5), na rozdíl od původního podezření v zadání tasku.

Hlavní rozdíl, který skutečně řídí parametr/config (ne duplicitní kód), je tedy jen:
„kdo hraje home stranu a jak se to spouští" — `human` (multiplayer) vs `trainingChallengeAi`
(training challenge). Engine, transport, snapshot formát i UI komponenta jsou identické.

Bot mód (`/hra/bot`) je naopak **kompletně samostatná implementace** fyziky, AI, commentary
i ukládání výsledku — žádný kód se nesdílí s online enginem kromě `lib/game/matchCommentaryMessages.ts`,
který bot mód i online klient oba importují.

## 2. Tabulka rozdílů

| Oblast | `/hra/bot` | multiplayer | training challenge | poznámka |
|---|---|---|---|---|
| **Engine** | lokální `game/updateGame.ts` (běží v browseru) | `project-hub-api/src/gameEngine/tick.ts` (server) | stejný jako multiplayer | dva nezávislé enginy, ne tři |
| **AI/opponent** | `game/ai.ts` — `updateAI()`, honí míč, wall-avoidance, offset chase target | žádné AI — oba hráči lidé | `gameEngine/ai.ts` — `computeTrainingChallengeInput()`, jednodušší (jen chase + kop v dosahu, žádný wall-avoidance) | dvě nezávislé, nepříbuzné AI implementace |
| **Goal detection** | `game/physics.ts` `checkGoal()` čte `state` | `gameEngine/physics.ts` `checkGoal(ball)` | stejné jako multiplayer | online verze nemá přístup k `lastTouch`, jen ke kterému brankové pásmu míč vletěl |
| **First goal commentary** | `GameCanvas.tsx` `onFirstGoal` callback → `MatchPageClient.tsx` → `MatchCommentaryToast` | `OnlineGameClient.tsx` `useEffect` na `snapshot.score` (`totalGoals>=1`) → stejný `MatchCommentaryToast` | **stejný kód jako multiplayer** (shared komponenta) | funguje stejně v multiplayeru i training challenge |
| **Full-time commentary** | `handleMatchEnd` v `MatchPageClient.tsx` → `pickRandomMessage(fullTimeMessages)` | `OnlineGameClient.tsx` `useEffect` na `gameStatus==='finished'` → stejný helper | **stejný kód jako multiplayer** | žádný rozdíl mezi multiplayerem a training challenge |
| **Own-goal detection** | ano — `state.lastTouchTeam`/`lastTouchPlayerId` v `game/types.ts`, nastavováno v `game/physics.ts` a `game/updateGame.ts`, samostatné hlášky `HOME_OWN_GOAL_MESSAGES`/`AWAY_OWN_GOAL_MESSAGES` | **ne** — `gameEngine/physics.ts checkGoal()` nesleduje posledního dotyku | **ne** — stejný engine jako multiplayer | own-goal existuje jen v lokálním bot enginu |
| **Result persistence** | `POST /api/match-results` → `service.ts createMatchResult()` → `OsmaMatchResult` (`mode:'singleplayer'`), **bez** `clubId`, **bez** `userId` | `saveOnlineMatchResult()` v `onlineMatchResultService.ts` → `OsmaOnlineMatch` + `OsmaMatchResult` (`mode:'multiplayer'`), s `homeClubId/awayClubId`, `homeUserId/awayUserId` (nullable) | stejná funkce, `mode:'training_challenge'` | bot mód má jednodušší/oddělený zápis, online má bohatší schéma |
| **Club names/HUD** | `homeTeamName` prop dopravený do `renderGame()`; vybraný klub se **nikdy neuloží** do výsledku (vždy se uloží natvrdo „Náhoda FC"/„FK Pařezov") | `room.homeClubName/awayClubName` v `OnlineGameRoom`, threadováno do snapshotu (`buildSnapshot`) i HUD v `OnlineGameCanvas.tsx` | stejné jako multiplayer, `homeClubName` = vybraný fiktivní klub | bot mód má kosmetický výběr klubu, který se v historii ztratí |
| **Match mode label** (homepage „Poslední výsledky") | `'singleplayer'` → „Trénink proti botovi" | `'multiplayer'` → „Online zápas" | `'training_challenge'` → „Tréninkový zápas" | `RecentResults.tsx formatMatchMode()` |
| **Discord requirement** | ne, hra anonymní, výsledek bez `userId` | ne, join anonymní (`userId` nullable) | **ano** — `onlineRoutes.ts` join handler vrací `401`, pokud `room.isTrainingChallenge && !userId` | jediný režim s vynuceným loginem |

## 3. Goal event flow

### `/hra/bot`
1. `game/physics.ts` detekuje kolizi míče s brankovou čárou uvnitř `updateGame.ts` (`checkGoal(state)`).
2. `updateGame.ts` inkrementuje `state.score[scored]`, nastaví `state.phase = 'goal'`, vyhodnotí `isOwnGoal` podle `lastTouchTeam`, vybere zprávu z `GOAL_MESSAGES`/`HOME_OWN_GOAL_MESSAGES`/`AWAY_OWN_GOAL_MESSAGES` do `state.goalMessage`.
3. `GameCanvas.tsx` v RAF smyčce porovná `prevPhase` vs `gameState.phase`; při prvním přechodu na `'goal'` zavolá `onFirstGoal()`.
4. `MatchPageClient.tsx` (`handleFirstGoal`) zobrazí `MatchCommentaryToast` s `pickRandomMessage(firstGoalMessages)` na 2,5 s.
5. Na konci (`phase === 'ended'`) se zavolá `onMatchEnd` → `handleMatchEnd` → vybere `fullTimeMessage`, zahraje `playFullTimeWhistle()`.
6. Uložení výsledku je **manuální** — hráč musí kliknout „Zapsat výsledek", což zavolá `POST /api/match-results`.

### Multiplayer i training challenge (stejný flow)
1. `gameEngine/tick.ts` zavolá `checkGoal(state.ball)` (z `physics.ts`) → vrátí `'home' | 'away' | null`.
2. `onlineGames.ts` (`startGame()` tick interval) detekuje rozdíl skóre (`prevHome`/`prevAway`) a `room.events.push({type:'goal', teamName: room.homeClubName ?? ..., message: 'Gól domácích!...'})`.
3. Každých pár ticků se emituje `state` event se snapshotem (`buildSnapshot`), který obsahuje `goalMessage` (krátkou generickou hlášku z `randomGoalMessage()` — **ne** stejné jako `firstGoalMessages`/`fullTimeMessages`).
4. Na klientu `OnlineGameClient.tsx`: `useEffect` na `snapshot.score` (suma gólů ≥ 1, poprvé) zobrazí `firstGoalMessage` přes `MatchCommentaryToast`; `useEffect` na `gameStatus==='finished'` zobrazí `fullTimeMessage`.
5. Po `status==='finished'` server zavolá `saveOnlineMatchResult(room)` → zápis do `OsmaOnlineMatch` + `OsmaMatchResult` automaticky, bez manuálního kroku hráče.

Pozor — toto je odlišný design od bot módu: online tick posílá **vlastní** krátkou „Gól domácích!"
zprávu (`goalMessage` v snapshotu, vykreslenou přímo v `OnlineGameCanvas.tsx` jako overlay
„GÓL!") **navíc** k `firstGoalMessage`/`fullTimeMessage` z `matchCommentaryMessages.ts`. Bot mód
tyto dvě vrstvy hlášek nerozlišuje — `goalMessage` ze hry je tam jediná „gólová" hláška a
`firstGoalMessages` je až nadstavba navíc.

## 4. Own-goal stav

- **Funguje:** pouze `/hra/bot` (lokální engine, `game/updateGame.ts` + `game/physics.ts`).
- **Nefunguje:** klasický multiplayer **i** training challenge — oba běží na stejném
  `project-hub-api/src/gameEngine`, který `lastTouch`/`scorer`/`ownGoal` vůbec nesleduje.
  `resolvePlayerBallCollisions()` v `gameEngine/physics.ts` dotyk hráče s míčem vrací (`touched: string | null`),
  ale **návratová hodnota se v `tick.ts` nikdy nezachytává** (`resolvePlayerBallCollisions(state.players, state.ball);` — bez přiřazení).
- **Multiplayer a training challenge mají identický stav** — own-goal feature v online enginu
  neexistuje pro žádný z nich, takže není co „sjednocovat" mezi nimi — je to nová funkce,
  kterou by bylo nutné napsat od nuly pro online engine.
- **Co by bylo potřeba doplnit pro own-goal v online enginu:**
  1. Do `OnlineGameState` (`gameEngine/types.ts`) přidat `lastTouchTeam: 'home' | 'away' | null` (a případně `lastTouchPlayerId`).
  2. V `tick.ts` zachytit návratovou hodnotu `resolvePlayerBallCollisions()` a najít `team` hráče s tímto `id`, nastavit `lastTouchTeam`.
  3. Při `checkGoal()` porovnat `scorer` vs `lastTouchTeam` stejnou logikou jako `game/updateGame.ts` (`isOwnGoal = (scored==='away' && lastTouchTeam==='home') || ...`).
  4. Reset `lastTouchTeam = null` po `resetPositions()` (gól, restart).
  5. Rozšířit `goal` event/`buildSnapshot` o `isOwnGoal` flag a/nebo vlastní hlášky (analogicky `HOME_OWN_GOAL_MESSAGES`/`AWAY_OWN_GOAL_MESSAGES`), buď v `randomGoalMessage()`, nebo v novém poli, aby frontend (`OnlineGameCanvas.tsx`) mohl zobrazit odpovídající text.
  6. **Skóre se nemění** — gól se i dnes správně připisuje týmu, do jehož brány míč spadl (to je футбolově korektní chování), jde jen o doplnění **textu/UI**, ne o změnu pravidel.

## 5. Commentary stav

- **First-goal commentary funguje:** `/hra/bot` ✅, multiplayer ✅, training challenge ✅ —
  všechny tři. U online klienta (`OnlineGameClient.tsx`) je to **jedna sdílená implementace**
  pro multiplayer i training challenge (žádný `if (isTrainingChallenge)` v komponentě —
  je to čistě generický react state navázaný na `snapshot.score`).
- **Full-time commentary funguje:** stejně — `/hra/bot` ✅, multiplayer ✅, training challenge ✅,
  ze stejného důvodu (sdílená komponenta).
- **Proč zadání tasku předpokládalo, že training challenge nemá stejné hlášky:** Pravděpodobně
  jde o reálný problém zaznamenaný dřív v konverzaci — `room.gameState.status` se měnilo na
  `'finished'` korektně, ale **AI strana se dlouho nehýbala** (než byla doplněna
  `computeTrainingChallengeInput`), takže zápasy končily 0:0 a `totalGoals >= 1` se nikdy
  nesplnilo → first-goal hláška se logicky nezobrazila, ne proto, že by chyběl kód. Po
  doplnění AI (`gameEngine/ai.ts`) by first-goal hláška měla padat stejně jako v multiplayeru.
  Druhá možná příčina z dřívějška: bug se zaměnou host/guest tokenu v `sessionStorage`
  způsoboval, že hráč viděl nesprávný stav UI a nemusel se k samotné hře (a tedy ani
  k commentary) vůbec dostat — to bylo opraveno samostatně.
- **Jde použít stejná komponenta/helper:** ano, **už se používá** — `lib/game/matchCommentaryMessages.ts`
  (`firstGoalMessages`, `fullTimeMessages`, `pickRandomMessage`) a `components/game/MatchCommentaryToast.tsx`
  importuje a vykresluje shodně `MatchPageClient.tsx` (bot) i `OnlineGameClient.tsx` (multiplayer
  i training challenge). Žádná duplicitní paralelní implementace commentary neexistuje.

## 6. Co má být sdílené — návrh cílové struktury

```ts
type GameMode = "bot" | "multiplayer" | "trainingChallenge";

type OpponentType = "casualAi" | "human" | "trainingChallengeAi";

type GameModeConfig = {
  mode: GameMode;
  opponentType: OpponentType;
  engine: "local" | "online";       // dnes odvoditelné z opponentType, ale explicitní je čitelnější
  persistResult: boolean;            // bot: true (manuální), multiplayer/training: true (automatické)
  autoSaveResult: boolean;           // bot: false (vyžaduje klik), multiplayer/training: true
  requireDiscord: boolean;           // jen trainingChallenge: true
  showFirstGoalCommentary: boolean;  // všechny: true (dnes už fakticky platí)
  showFullTimeCommentary: boolean;   // všechny: true
  trackOwnGoals: boolean;            // bot: true, multiplayer/training: false (dokud se nedoplní enginu)
  matchLabel: string;                // "Trénink proti botovi" | "Online zápas" | "Tréninkový zápas"
  matchResultMode: "singleplayer" | "multiplayer" | "training_challenge";
};
```

Reálně už dnes existuje hodně tohoto rozlišení implicitně (přes `mode` string v DB,
`isTrainingChallenge` boolean v `OnlineGameRoom`, atd.) — návrh jen sjednocuje, kde se tato
rozhodnutí dělají, do jednoho configu místo rozesetých `if` větví na čtyřech místech
(`onlineMatchResultService.ts`, `RecentResults.tsx`, `onlineRoutes.ts`, `onlineGameSocket.ts`).

## 7. Doporučený refactor po krocích

1. **Sjednotit multiplayer a training challenge commentary** — fakticky už hotovo (sdílená
   `OnlineGameClient.tsx`). Zbývající krok: ověřit end-to-end na živé výzvě, že po doplnění AI
   first-goal/full-time commentary skutečně padá (rychlý manuální test, žádný kód).
2. **Ověřit/doplnit full-time commentary pro training challenge** — podle analýzy už funguje
   díky sdílené komponentě; krok je tedy jen **verifikační**, ne implementační.
3. **Navrhnout own-goal tracking v online enginu** — bezpečný malý krok: přidat `lastTouchTeam`
   do `OnlineGameState`, zachytit návrat `resolvePlayerBallCollisions()` v `tick.ts`, doplnit
   `isOwnGoal` do goal eventu/snapshotu. Nemění skóre ani fyziku, jen rozšiřuje stav a text.
   Dopad na multiplayer i training challenge současně (jsou na stejném enginu).
4. **Až později** zvážit větší sjednocení lokálního bot enginu a online enginu (např. extrahovat
   sdílenou fyziku/AI rozhraní) — to je velký zásah (jiný runtime, jiný transport, jiná datová
   reprezentace stavu) a měl by být samostatný, pečlivě plánovaný task, ne vedlejší produkt
   tohoto refactoru.
5. Drobné, nízkoriziková doplnění mimo prioritní pořadí, ale stojí za zmínku:
   - `/hra/bot` neukládá vybraný klub do výsledku (vždy „Náhoda FC"/„FK Pařezov" v historii) —
     nesouvisí s commentary/own-goal, ale je to stejná třída problému jako dřívější bug
     v `onlineMatchResultService.ts`.
   - Komentář v `onlineGameSocket.ts` („...until a training-challenge AI profile is wired into
     the engine (see TODO.md)") je zastaralý — AI už byla doplněna v pozdějším commitu, komentář
     to neodráží.

## 8. Rizika

- **Zásah do scoringu:** own-goal tracking nesmí změnit, komu se gól připisuje (to už je
  fotbalově správně) — riziko je jen v testování, že implementace omylem přehodí stranu.
- **Zásah do fyziky:** zachycení návratové hodnoty `resolvePlayerBallCollisions()` je čistě
  čtecí operace, fyzika míče/hráčů se nemění — riziko nízké, pokud se striktně jen čte.
- **Rozdílné enginy local vs online:** jakýkoli pokus o „rychlé" sjednocení bot enginu a
  online enginu by byl rizikový — different state shape (`GameState` vs `OnlineGameState`),
  different tick frequency, different input model (lokální keyboard vs network input). Toto
  je největší riziko v celém auditu a důvod, proč je bod 7.4 explicitně odložen.
- **Možnost rozbití multiplayeru:** jakákoli změna `gameEngine/tick.ts`/`physics.ts` ovlivní
  multiplayer i training challenge současně (sdílí stejný kód) — každá změna musí být
  otestována v obou režimech, ne jen v training challenge.
- **Duplicita UI hlášek:** online engine dnes generuje **dvě** vrstvy gólových zpráv
  (`goalMessage` ze serveru pro overlay „GÓL!" + `firstGoalMessage`/`fullTimeMessage` z klienta)
  — při doplňování own-goal textu je riziko, že vznikne třetí, nekonzistentní vrstva. Je třeba
  explicitně rozhodnout, do které vrstvy own-goal text patří.
- **Mobilní layout:** `MatchCommentaryToast` je `position: absolute` přes canvas — pokud se
  přidá další textový prvek (např. own-goal banner), je riziko překrytí s touch ovládáním
  (`MobileTouchControls`) na malých obrazovkách. Nutno ověřit na mobilním breakpointu.

## 9. Doporučení

Doporučený další implementační task je: **ověřit (manuálním testem na živé tréninkové výzvě),
že first-goal a full-time commentary skutečně fungují po doplnění AI, a pokud ano, zaměřit
další práci na bod 7.3 — doplnění `lastTouchTeam`/own-goal trackingu do `project-hub-api`
online enginu (`gameEngine/types.ts`, `tick.ts`, `physics.ts`) tak, aby multiplayer i training
challenge získaly stejnou own-goal hlášku jako `/hra/bot`, beze změny skórování a fyziky.**
Velké sjednocení lokálního a online enginu (bod 7.4) doporučuji řešit až jako samostatný,
samostatně naplánovaný task.
