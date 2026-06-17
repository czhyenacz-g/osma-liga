# Gameplay code structure review

Datum: 2026-06-17  
Verze větve: main (`v0.7.x-seno`)  
Audit-only — žádný runtime kód nebyl měněn.

---

## 1. Shrnutí

Projekt se rychle rozrostl ze základního singleplayeru na mobilní hru s touch ovládáním, online multiplayerem, event logem a support positioningem. Kód je celkově čitelný a funkční, ale začínají se projevovat tři strukturální trendy:

1. **Největší soubory míchají více odpovědností** — `MatchPageClient.tsx` (380 ř.), `renderGame.ts` (374 ř.) a `updateGame.ts` (319 ř.) řeší příliš věcí najednou.
2. **Game engine je zdvojený bez sdílené základny** — client-side `game/` a server-side `src/gameEngine/` implementují totéž (pohyb, ball control, corner clear, fyzika) nezávisle, s různou konvencí pojmenování (`pos.x/vel.x` vs `x/vx`). Synchronizace probíhá ručně.
3. **Orientace + end screen logika se opakuje** — `MatchPageClient` a `OnlineGameClient` sdílí kód pro orientaci, touch reset a end screen, ale každý ho drží ve vlastní kopii.

Tyto problémy jsou zatím zvládnutelné. Rizikové se stanou při přidávání faulů, staminy nebo karet, kde každá nová per-player hodnota musí být synchronizována na obou stranách.

---

## 2. Zkontrolované oblasti

### osma-liga

| Oblast | Soubory |
|---|---|
| Game engine (singleplayer) | `game/updateGame.ts`, `game/physics.ts`, `game/ai.ts`, `game/constants.ts`, `game/types.ts`, `game/renderGame.ts`, `game/createInitialState.ts`, `game/input.ts` |
| Komponenty singleplayer | `components/game/MatchPageClient.tsx`, `components/game/GameCanvas.tsx`, `components/game/MobileTouchControls.tsx` |
| Komponenty online | `components/online/OnlineGameClient.tsx`, `components/online/OnlineGameCanvas.tsx`, `components/online/useOnlineGame.ts` |
| Stránky | `app/hra/bot/page.tsx`, `app/hra/online/[code]/page.tsx`, `app/satna/page.tsx` |

### project-hub-api

| Oblast | Soubory |
|---|---|
| Server engine | `src/gameEngine/tick.ts`, `src/gameEngine/physics.ts`, `src/gameEngine/constants.ts`, `src/gameEngine/types.ts` |
| Moduly | `src/modules/osmaLiga/service.ts`, `src/modules/osmaLiga/onlineMatchResultService.ts` |
| WebSocket | `src/ws/onlineGameSocket.ts` |

---

## 3. Soubory, které rostou / hromadí odpovědnosti

### `components/game/MatchPageClient.tsx` — 380 řádků ⚠️

**Co řeší:**
- Herní fáze (`idle` → `countdown` → `playing`)
- Portrait overlay a detekci orientace/mobilního zařízení
- Countdown timer (1 s, 3-2-1-HRAJ!)
- Touch state a reset při blur/orientationchange
- Fullscreen pokus a fallback
- End-screen HTML overlay (×, "Zpět do šatny", "Odveta")
- Ukládání výsledku do Hub API (save state machine: idle/saving/saved/error)

**Problém:** Komponenta dělá lifestyle management, state machine, overlay UI i síťový fetch. Přidání staminy nebo karet bude muset jít sem, pokud nevznikne vrstva mezi.

---

### `game/renderGame.ts` — 374 řádků ⚠️

**Co řeší:**
- Vykreslení hřiště, čar, branek
- Vykreslení hráčů s aktivním indikátorem (pulsující kroužek + šipka)
- Vykreslení míče s motion trailem
- HUD (skóre, čas)
- Corner countdown warning text
- Goal overlay (text, skóre)
- End overlay (panel, výsledek, komentář, hint na klávesy)
- Pomocné funkce `formatTime`, `matchResultLabel`, `matchComment`, `roundRect`

**Problém:** Každý nový herní prvek (stamina bar, karta, přihrávka indikátor) přidá dalších 20–50 řádků. Soubor nemá přirozenou hranici, kde skončit.

---

### `game/updateGame.ts` — 319 řádků

**Co řeší:**
- Výběr aktivního hráče
- Pohyb aktivního hráče (input → vel → pos + clamp)
- Soft ball control
- Kick mechanika
- Support positioning (defender + runner)
- Bot AI volání (`updateAI`)
- Fyzika a kolize
- Corner clear logika (timer, clearance, cooldown)
- Detekce gólu a vlastního gólu
- Stav fáze hry (playing → goal → ended)

**Hodnocení:** Stále čitelný, ale každá nová mechanika (faulem → stop pohybu, stamina → speed modifier) musí jít do středu tohoto souboru.

---

### `project-hub-api/src/gameEngine/tick.ts` — 238 řádků ⚠️

Serverová kopie `updateGame.ts`. Stejná struktura, jiné konvence:
- `p.x/p.y` místo `p.pos.x/p.pos.y`
- `dist(x1,y1,x2,y2)` místo `dist(vec1, vec2)`
- Ball control přidán ručně po vzoru klientského kódu

**Problém:** Jakákoli mechanická změna (stamina, faulem zastavení hráče) musí být implementována dvakrát a ručně synchronizována.

---

### `components/online/OnlineGameCanvas.tsx` — 246 řádků

**Co řeší:**
- Inicializaci Canvas + RAF loop
- Lerp interpolaci serverového snapshot → render state
- Překreslení hřiště (duplikát `renderGame.ts` bez sdíleného kódu)
- HUD a goal overlay specifický pro online

**Problém:** Pole rendering (field lines, goals, grass stripes) je zkopírované z `renderGame.ts`. Jakákoli vizuální změna hřiště je potřeba duplikovat.

---

## 4. Duplicitní logika mezi bot a online

| Duplicita | Kde | Závažnost |
|---|---|---|
| **Game constants** | `game/constants.ts` ↔ `src/gameEngine/constants.ts` | 🔴 Riziková — každá tuning změna musí být na obou místech |
| **Ball control** | `updateGame.ts:137–157` ↔ `tick.ts:ball control blok` | 🔴 Riziková — přidána ručně, může se rozejít |
| **Corner clear** | `updateGame.ts:209–246` ↔ `tick.ts:corner clear blok` | 🔴 Riziková — stejný problém |
| **Physics (wall bounce + kolize)** | `game/physics.ts` ↔ `src/gameEngine/physics.ts` | 🔴 Riziková — různá `dist` signature, různé bounce constants |
| **Pohyb hráče** | `updateGame.ts:movePlayerByInput` inline ↔ `tick.ts:movePlayerByInput()` funkce | 🟡 Střední — zatím konzistentní |
| **Portrait overlay** | `MatchPageClient.tsx:172–180` ↔ `OnlineGameClient.tsx:170–192` | 🟡 Střední — UI duplikát, ale nezávislý, neškodný |
| **Touch reset (blur/orientationchange)** | `MatchPageClient.tsx:96–110` ↔ `OnlineGameClient.tsx:57–70` | 🟡 Střední — 15 ř. duplikát, zatím OK |
| **Field rendering** | `renderGame.ts:216–272` ↔ `OnlineGameCanvas.tsx:45–95` | 🟡 Střední — vizuální nekonzistence riziková při redesignu hřiště |
| **End screen tlačítka** | `MatchPageClient.tsx:248–323` (HTML) ↔ `OnlineGameClient.tsx:144–165` | 🟢 Neškodná — jiný styl záměrně (canvas overlay vs React) |
| **Typ souřadnic** | `pos.x/vel.x` (klient) ↔ `x/vx` (server) | 🔴 Riziková — zvyšuje riziko chyby při sdílení kódu |

---

## 5. Kandidáti na malé extrakce

### Priorita A — snižují riziko konvergence

**`game/sharedGameConstants.ts` (nebo package):**  
Sdílené konstanty, na které se odkazují oba repozitáře. Aktuálně každá změna konstant musí jít na dvě místa. Výhledově — pokud projekt roste, `@osma-liga/game-constants` npm package nebo git submodule.

**`components/game/MobileOrientationOverlay.tsx`:**  
Portrait overlay existuje dvakrát. 10–15 ř. extrakce. Oba klienti importují jednu komponentu.

```tsx
// navrhovaný interface
<MobileOrientationOverlay show={isMobile && isPortrait} />
```

---

### Priorita B — před přidáváním per-player stavu

**Vyčlenění support positioningu z `updateGame.ts`:**  
`game/supportPositioning.ts` s jednou funkcí `updateSupportPlayers(homePlayers, active, ball, dt)`. Izoluje logiku, která se pravděpodobně bude ladit.

**Vyčlenění corner clear z `updateGame.ts`:**  
`game/cornerClear.ts` s `tickCornerClear(state, dt)`. Momentálně 35 řádků uprostřed `updateGame.ts`.

**Extrakce draw helpers z `renderGame.ts`:**  
`game/renderHelpers.ts` pro `drawField()`, `drawGoals()` — sdílené s `OnlineGameCanvas`. Odstraní vizuální duplikát a zabrání rozdílům při redesignu.

---

### Priorita C — zatím neřešit

- `MatchPageClient` decompose (GameShell, MatchStartOverlay, SaveResultPanel) — velký krok, zatím funkční
- Pass assist mechanika — nová logika, nesouvisí s refactorem
- Sdílení typů klient/server — vyžaduje zásah do obou repozitářů najednou

---

## 6. Rizika pro budoucí mechaniky

### Stamina

**Kde:** Per-player hodnota `stamina: number` musí být v `Player` (klient `game/types.ts`) i `OnlinePlayer` (server `types.ts`). Speed modifier musí jít do pohybové logiky v `updateGame.ts` I `tick.ts`.  
**Riziko:** 🔴 Nutné změny na 4 místech bez sdílené základny. Synchronizace ručně.

---

### Fauly a zastavení hráče

**Kde:** `updateGame.ts` — před pohybem aktivního hráče přidat kontrolu `foul pause`. Server `tick.ts` — stejná logika znovu.  
**Riziko:** 🔴 Stejný problém jako stamina. Navíc foul event musí jít do event logu — `onlineMatchResultService.ts` a potenciálně klientský stav.

---

### Rozhodčí / karty / dočasná vyloučení

**Kde:** Nový per-player state (`yellowCards`, `suspended`, `suspendedUntil`). Musí být v obou type systémech. Render v `renderGame.ts` (ikona karty nad hráčem) + `OnlineGameCanvas.tsx` (stejná ikona znovu).  
**Riziko:** 🔴 Čtyřnásobná změna + render duplikát.

---

### Pass assist

**Kde:** Klientská logika v `updateGame.ts` — detekce nabíhajícího hráče, highlight indicator v `renderGame.ts`. Server-side se netýká (pass assist je hint, ne mechanika).  
**Riziko:** 🟡 Střední — dotýká se jen klientských souborů, bez nutnosti sync.

---

### Závěr rizik

Největší strukturální riziko je **absence sdílené game-engine základny**. Každá per-player mechanika musí být implementována dvakrát (klient + server) s různými konvencemi, různými `dist()` signaturami a bez compile-time záruky konzistence.

---

## 7. Doporučený plán 3 kroků

### Krok 1 — teď, bezpečné, malé

**Extrahovat `MobileOrientationOverlay` komponentu.**

- Soubory: nový `components/game/MobileOrientationOverlay.tsx`, update `MatchPageClient.tsx`, `OnlineGameClient.tsx`
- Proč: Odstraní 15ř. duplikát, dá smysl jako vzor pro další sdílené overlays
- Riziko: Minimální — čistá extrakce existující UI
- Validace: `npm run lint && npm run build`, vizuální check na obou stránkách

**Vyčlenit `supportPositioning.ts` z `updateGame.ts`.**

- Soubory: nový `game/supportPositioning.ts`, update `game/updateGame.ts`
- Proč: Logika support positioningu se bude ladit, izolace usnadní změny
- Riziko: Nízké — přesun kódu bez změny chování
- Validace: `npm run build`, hra chová stejně

---

### Krok 2 — před fauly/staminou

**Sjednotit souřadnicové konvence v `src/gameEngine/types.ts`.**

Změnit `OnlinePlayer { x, y, vx, vy }` na `OnlinePlayer { pos: Vec2, vel: Vec2 }` — stejně jako klient.

- Soubory: `src/gameEngine/types.ts`, `src/gameEngine/tick.ts`, `src/gameEngine/physics.ts`, `src/ws/onlineGameSocket.ts` (serializace)
- Proč: Jakákoli nová per-player logika (stamina speed modifier) bude moci sdílet více kódu
- Riziko: Střední — rozsáhlejší změna, ale obsažená v `project-hub-api`. Vyžaduje `npm run typecheck` + deploy + health check
- Validace: TypeScript build, deploy Hetzner, test online zápas

**Extrahovat `drawField()` + `drawGoals()` do `game/renderField.ts`.**

Sdílenou funkci importovat v `renderGame.ts` i `OnlineGameCanvas.tsx`.

- Soubory: nový `game/renderField.ts`, update `renderGame.ts`, `OnlineGameCanvas.tsx`
- Proč: Odstraní vizuální duplikát hřiště, zabrání asymetrii při redesignu
- Riziko: Nízké — čistá extrakce
- Validace: `npm run build`, vizuální check bot i online

---

### Krok 3 — zatím nechat být

- **Decompose `MatchPageClient.tsx`** — funkční, refactor přinese nové chyby bez jasného zisku
- **Sdílené npm balíčky / monorepo** pro game constants — overengineering v tomto stádiu
- **`renderGame.ts` split** na sub-renderers — přijde přirozeně s přidáváním staminy/karet, ne teď
- **Sjednocení `updateGame.ts` a `tick.ts`** do jediné shared implementace — velký krok, vyžaduje zásah do dvou repozitářů a kompletní integrační testování

---

## 8. Co nedělat teď

- Žádný velký rewrite game enginu
- Žádné monorepo / shared packages před ověřením potřeby
- Žádné změny herní mechaniky pod záminkou refactoru
- Nesahej na `GameCanvas.tsx` — dobře navržený, nekvůli refactoru
- Nesahej na `useOnlineGame.ts` — čistý hook
- Nesahej na `ai.ts` dokud neexistuje potřeba změny bot chování

---

**Nejlepší další technický krok:**

Extrahovat `MobileOrientationOverlay` komponentu a `supportPositioning.ts` z `updateGame.ts`. Oba kroky jsou bezpečné (přesun existujícího kódu, nulová změna chování), sníží velikost největších souborů a vytvoří vzor pro budoucí extrakce před tím, než přijdou větší mechaniky.
