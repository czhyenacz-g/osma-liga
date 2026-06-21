# Regresní audit herní logiky po sjednocení enginů

Datum: 2026-06-21
Rozsah: `project-hub-api` (online engine) + `osma-liga` (`/hra/bot`, klient pro online/training challenge)

## 1. Název problému

Po sérii úprav online enginu (own-goal tracking, teammate support behavior,
active-player hysteresis, `behaviorConfig` pro multiplayer vs. training
challenge) bylo potřeba ověřit, že se nerozbilo dříve funkční chování a že
se `/hra/bot`, multiplayer a training challenge liší jen parametry, ne
duplicitní/rozbitou logikou.

## 2. Shrnutí — rozbilo se něco?

**Ne.** Audit nenašel žádný regresní bug. `tickGame` se volá přesně jednou
za interval se správným configem, support v multiplayeru nestřílí za
člověka, training challenge je prokazatelně agresivnější než `/hra/bot`,
own-goal detekce funguje (ověřeno simulací) a `/hra/bot` zůstal beze změny
své herní logiky (jen přibylo ukládání vybraného klubu k výsledku, což je
mimo gameplay). Nebyla provedena žádná oprava kódu — jde čistě o audit.

## 3. Kontrola `tickGame` volání

`project-hub-api/src/modules/osmaLiga/onlineGames.ts:341-344`:

```ts
const behaviorConfig = room.isTrainingChallenge
  ? TRAINING_CHALLENGE_BEHAVIOR_CONFIG
  : DEFAULT_BEHAVIOR_CONFIG;
tickGame(room.gameState, DT, behaviorConfig);
```

`grep -n "tickGame" src/modules/osmaLiga/onlineGames.ts` vrací jen tento
jeden call site (plus import). Žádné druhé/staré volání `tickGame(state, DT)`
bez configu nezůstalo — žádný double-tick.

## 4. Stav `/hra/bot`

- `game/ai.ts`, `game/updateGame.ts`, `game/supportPositioning.ts`,
  `game/constants.ts` — beze změny v posledních commitech (`git log` na tyto
  soubory nejde dál než starší práce; commit `2d18e04` se jich nedotkl).
- Hystereze (`ACTIVE_PLAYER_SWITCH_MARGIN = 18`) i support positioning pro
  domácí (lidský) tým fungují stejně jako dřív.
- Bot (away tým) je nadále pomalejší a méně agresivní než hráč/online AI:
  `BOT_SPEED = 165` (vs. `PLAYER_SPEED = 210`), `BOT_KICK_FORCE = 460` (vs.
  `KICK_FORCE = 540`), `BOT_KICK_COOLDOWN = 0.85 s` (vs. `KICK_COOLDOWN =
  0.25 s`) — žádná z těchto konstant se neměnila.
- Own-goal tracking v bot enginu (`state.lastTouchTeam`) je nezávislý na
  online enginu a nebyl dotčen.
- Jediná změna v `/hra/bot` oblasti byla mimo gameplay: ukládání
  `homeClubSlug` k výsledku zápasu (`app/api/match-results/route.ts`,
  `components/game/MatchPageClient.tsx`, commit `2d18e04`) — čistě
  perzistence vybraného klubu, nemění chování hry.

## 5. Stav multiplayeru

- Active hráč je řízen výhradně `state.inputs.home` / `state.inputs.guest`
  (`tick.ts:215`, `movePlayerByInput`) — nezměněno.
- Support spoluhráči se hýbou (`computeTeamSupportInputs` →
  `moveTowardSupportTarget`), nestojí na base, pokud `teammateSupportMode !==
  'none'`.
- `MULTIPLAYER_TEAM_BEHAVIOR.supportCanShoot = false` pro oba týmy
  (`teamBehavior.ts:25-31`) — v `tick.ts:286` je kop support hráče podmíněn
  `teamConfig.supportCanShoot`, takže v multiplayeru support nikdy nekope.
  Ověřeno simulací (90 ticků, support hráč posazený přímo na míč, žádný
  skok rychlosti odpovídající kopu).
- Active-player hysteresis funguje pro home i away (ověřeno simulací — 0
  přepnutí za 200 ticků s míčem mezi dvěma přibližně stejně vzdálenými
  hráči).
- Own-goal a běžné góly fungují, skóre se připisuje správné straně
  (ověřeno simulací, viz bod 8).
- Snapshot (`buildSnapshot` v `onlineGames.ts:400-420`) obsahuje `isOwnGoal`
  a všechna ostatní pole beze změny struktury.

## 6. Stav training challenge

- `room.isTrainingChallenge` korektně vybírá
  `TRAINING_CHALLENGE_BEHAVIOR_CONFIG` (`onlineGames.ts:341-343`).
- Domácí fiktivní klub (`TRAINING_CHALLENGE_HOME_BEHAVIOR`) má
  `teammateSupportMode: 'aggressive'`, `supportCanShoot: true`,
  `supportChaseWeight: 0.7` — support hráči mohou kopat, jen pro tuto
  stranu.
- Hostující lidský tým (`TRAINING_CHALLENGE_GUEST_BEHAVIOR`) je identický s
  `MULTIPLAYER_TEAM_BEHAVIOR` (`basic`, `supportCanShoot: false`).
- Aktivní AI hráč domácího klubu (`computeTrainingChallengeInput` v
  `ai.ts`) se pohybuje přes stejnou `movePlayerByInput`/`PLAYER_SPEED`
  cestu jako lidský hráč (210 px/s, `KICK_FORCE = 540`, `KICK_COOLDOWN =
  0.25 s`) — to je výrazně agresivnější než bot v `/hra/bot` (165 px/s,
  460, 0.85 s). Training challenge je tedy prokazatelně těžší než
  `/hra/bot`, jak má být.
- Gólové zprávy (`goalMessage`, vlastní gól) a `match_finished` event v
  `onlineGames.ts` beze změny.
- `onlineMatchResultService.ts` (perzistence výsledku) nebyl dotčen
  žádným z posledních tří commitů (`dbc27be`, `a0da38a`, `3ce562a`).
- Grep přes `src/**/*.ts` na `\bbot\b|\brobot\b` v projektu nenašel žádný
  výskyt v uživatelsky viditelných textech — veřejně se mluví jen o
  "tréninkové výzvě" a jménech klubů.

## 7. Tabulka porovnání parametrů mezi módy

| Parametr | `/hra/bot` (home/human) | `/hra/bot` (away/bot) | Multiplayer (oba týmy) | Training challenge — human guest | Training challenge — AI home |
|---|---|---|---|---|---|
| Active player switch margin | 18 px | — (bot vždy nejbližší, bez hystereze) | 18 px | 18 px | 18 px |
| Teammate support mode | basic (`applySupportPositioning`) | none (return to base) | basic | basic | aggressive |
| Support can shoot | ne | n/a | ne | ne | **ano** |
| Support speed | `SUPPORT_PLAYER_SPEED = 120` | `BOT_SPEED * 0.5 = 82.5` (return to base) | `SUPPORT_PLAYER_SPEED = 120` | 120 | 120 |
| Support spacing | implicitní (pevné offsety v `supportPositioning.ts`) | n/a | 110 px | 110 px | 90 px |
| Active hráč speed / kick force / cooldown | 210 / 540 / 0.25 s | 165 / 460 / 0.85 s | 210 / 540 / 0.25 s (lidský input) | 210 / 540 / 0.25 s (lidský input) | 210 / 540 / 0.25 s (AI input, stejná cesta jako člověk) |
| Own-goal support | ano (`lastTouchTeam`) | ano | ano | ano | ano |
| Result persistence | ano (`/api/match-results`, ukládá i `homeClubSlug`) | — | ano (`saveOnlineMatchResult`) | ano | ano |

Pozn.: `/hra/bot` a online engine jsou stále dvě oddělené implementace
(klient vs. `project-hub-api`), ale klíčové konstanty (`PLAYER_SPEED`,
`KICK_FORCE`, `KICK_RANGE`, `ACTIVE_PLAYER_SWITCH_MARGIN`,
`SUPPORT_PLAYER_SPEED`, rozměry hřiště) jsou mezi nimi numericky shodné —
rozdíl v obtížnosti vzniká configem/rolí (bot vs. AI vs. human), ne
rozdílnou fyzikou.

## 8. Nalezené bugy

Žádné. Audit prošel bez nálezu regresního chování.

## 9. Provedené opravy

Žádné — pouze audit a verifikace pomocí simulací proti zkompilovanému
enginu (`dist/gameEngine`). Validační simulace zahrnuly:

- own-goal do vlastní brány s izolovanými hráči (mimo dosah ball-control
  fyziky) → správně skóruje soupeři a nastaví `isOwnGoal`/zprávu,
- běžný gól → správně skóruje útočícímu týmu,
- support hráč posazený přímo na míč v multiplayer configu → žádný
  kop (žádný skok rychlosti míče odpovídající kopu),
- active-player hysteresis s míčem mezi dvěma přibližně stejně vzdálenými
  hráči → 0 přepnutí za 200 ticků.

## 10. Co zůstalo beze změny

- `tick.ts` hlavní herní smyčka, `physics.ts`, `constants.ts` (kromě
  konstant přidaných v předchozích taskech: `SUPPORT_PLAYER_SPEED`,
  `SUPPORT_KICK_FORCE`, `ACTIVE_PLAYER_SWITCH_MARGIN`).
- DB schema, cron joby, Discord login, EU gate, homepage, public copy.
- `/hra/bot` herní logika (`game/ai.ts`, `game/updateGame.ts`,
  `game/supportPositioning.ts`).
- `onlineMatchResultService.ts` a perzistence výsledků.

## 11. Výsledek typecheck/build — `project-hub-api`

```
npm run typecheck → OK (bez chyb)
npm run build     → OK (bez chyb)
```

## 12. Výsledek lint/build — `osma-liga`

```
npm run lint  → 1 preexistující warning (nepoužitá proměnná isMyTeam
                v components/online/OnlineGameCanvas.tsx), nesouvisí
                s touto prací, build neblokuje
npm run build → OK, všechny route úspěšně vygenerovány
```

## 13. Doporučené ruční testy

### `/hra/bot`
1. Spustit zápas proti botovi.
2. Ověřit, že bot reaguje pomaleji a kope méně agresivně než dřív.
3. Ověřit, že vlastní spoluhráči (support) se hýbou a drží formaci.
4. Vstřelit gól i vlastní gól, ověřit hlášky.
5. Dohrát zápas a zapsat výsledek s vybraným klubem — ověřit, že se klub
   uloží k výsledku.

### Multiplayer
1. Založit multiplayer, připojit se z druhého (anonymního) okna.
2. Ověřit, že každý hráč ovládá svého active hráče.
3. Ověřit, že support spoluhráči se hýbou, ale nestřílí za hráče.
4. Vstřelit gól i vlastní gól, ověřit konec zápasu.

### Training challenge
1. Nastoupit do aktivní training challenge.
2. Ověřit, že fiktivní domácí klub je agresivnější než běžný bot v
   `/hra/bot` (rychlejší, častěji kope).
3. Ověřit, že hostující (lidský) tým má jen basic support.
4. Dohrát zápas a ověřit uložení výsledku.

## 14. Commit hash — `project-hub-api`

Žádný nový commit — audit nevyžadoval změnu kódu. Aktuální stav `main`:
`3ce562a` (poslední commit z předchozí práce, beze změny v tomto auditu).

## 15. Commit hash — `osma-liga`

Tento report (`docs/audits/game-logic-regression-after-unification.md`).

## 16. Push status

Bude pushnuto společně s tímto reportem (`docs: audit game mode behavior
after unification`).
