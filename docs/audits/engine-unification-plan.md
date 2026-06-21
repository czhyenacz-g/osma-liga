# Plán: sjednocení lokálního a online herního enginu

Status: plán/návrh, žádný engine kód není měněn. Navazuje na `game-mode-logic-differences.md`
(bod 7.4) a `refactoring/gameplay-code-structure-review.md` (body 4, 6, 7). Oba audity
shodně doporučují tohle řešit jako samostatný, pečlivě naplánovaný task — toto je ten plán.

## 1. Cíl a rozsah

Cíl: snížit riziko, že nová herní mechanika (stamina, fauly, karty) musí být napsána
dvakrát — jednou v `osma-liga/game/*` (klient, `/hra/bot`), jednou v
`project-hub-api/src/gameEngine/*` (server, multiplayer + training challenge) — bez
záruky, že obě implementace zůstanou v souladu.

Mimo rozsah tohoto plánu: samotná implementace sdílení kódu. Tady jen popisuji fáze,
rizika a akceptační kritéria, podle kterých se dá rozhodnout, kdy a jak postupovat dál.

## 2. Proč je to rizikové (shrnutí)

- **Jiný runtime.** Klient běží v prohlížeči (RAF smyčka), server běží v Node
  (`setInterval`, ~30 ticků/s). Sdílený kód musí být runtime-agnostic (žádné DOM/Canvas
  volání v engine logice — to už dnes platí, ale je to implicitní předpoklad, ne vynucený).
- **Jiná datová reprezentace stavu.** Klient: `Player.pos.x/pos.y`, `Player.vel.x/vel.y`
  (`game/types.ts`). Server: `OnlinePlayer.x/y`, `OnlinePlayer.vx/vy`
  (`gameEngine/types.ts`). Stejná fyzika, jiný shape — sdílet funkce dnes nejde bez
  adapteru nebo přepisu jedné strany.
- **Jiný transport/input model.** Klient čte klávesnici/touch přímo do herní smyčky.
  Server čte `InputState` poslaný přes Socket.IO. Cizí pro engine logiku to není (obě
  strany mají `InputState`-like tvar), ale synchronizace vstupu má jinou latenci a jiné
  edge-case chování (výpadek spojení vs. lokální vstup nemůže "vypadnout").
- **Dva oddělené repozitáře.** `osma-liga` (Next.js) a `project-hub-api` (Fastify) jsou
  fyzicky odlišené git repozitáře/deploy pipeline. Jakékoli sdílení kódu mezi nimi
  vyžaduje balíčkovací mechanismus (private npm package, git submodule, nebo monorepo) —
  není to jen "přesun souboru".
- **Engine review (17. 6.) explicitně varuje** před monorepem a velkým rewrite enginu,
  dokud nebude ověřená potřeba — riziko je vyšší než dnešní bolest z duplicity.

## 3. Co se v tomto plánu NEdělá

- Žádný big-bang rewrite/merge obou enginů do jednoho.
- Žádný monorepo ani shared npm package — to je explicitně až **Fáze 3**, podmíněná, ne
  výchozí cesta.
- Žádný zásah do `GameCanvas.tsx`, `useOnlineGame.ts`, `ai.ts` bez konkrétní potřeby
  (review to výslovně zakazuje "jen proto, že refaktorujeme").
- Žádná změna herní mechaniky/fyziky pod záminkou refactoru.

## 4. Fázový plán

### Fáze 0 — Předpoklad: UI/render duplicita pryč (mimo engine samotný)

Už navrženo v `gameplay-code-structure-review.md` (Krok 1–2), nezávisle proveditelné
už teď, nízké riziko:

- `MobileOrientationOverlay.tsx` — extrahovat z `MatchPageClient.tsx` + `OnlineGameClient.tsx`.
- `game/supportPositioning.ts` — vyčlenit z `updateGame.ts`.
- `game/cornerClear.ts` — vyčlenit z `updateGame.ts`.
- `game/renderField.ts` (`drawField`/`drawGoals`) — sdílet mezi `renderGame.ts` a
  `OnlineGameCanvas.tsx`.

Tohle nesjednocuje engine logiku (fyzika zůstává duplicitní), ale snižuje velikost
souborů, do kterých by se engine refactor musel zasahovat, a je to bezpečné udělat
nezávisle na zbytku plánu.

### Fáze 1 — Sjednotit datové konvence v online enginu

Cíl: udělat `OnlinePlayer`/`OnlineGameState` strukturálně kompatibilní s klientským
`Player`/`GameState`, **beze změny chování**, čistě uvnitř `project-hub-api`.

- Změnit `OnlinePlayer { x, y, vx, vy }` → `OnlinePlayer { pos: {x,y}, vel: {x,y} }`
  (`gameEngine/types.ts`).
- Upravit `tick.ts`, `physics.ts`, `ai.ts`, `createInitialState.ts` na nový shape.
- Upravit serializaci v `onlineGames.ts` (`buildSnapshot`) a `onlineGameSocket.ts`, aby
  snapshoty na klienta zůstaly ve stávajícím plochém tvaru (`x,y`), tedy mapovat
  `pos.x/pos.y` → `x/y` až na hranici snapshotu — **frontend (`OnlineGameCanvas.tsx`,
  `useOnlineGame.ts`) se nemění**.
- Validace: `npm run typecheck` + `npm run build` v `project-hub-api`, manuální test
  jednoho multiplayer zápasu a jedné training challenge (oba běží na stejném enginu,
  takže stačí ověřit oba scénáře jednou).

Riziko: střední, ale izolované — celá změna je uvnitř jednoho repozitáře a nemění
veřejné API (Socket.IO snapshot shape) ani DB schéma.

### Fáze 2 — Parity test suite (ověření shody bez sdílení kódu)

Tohle je nejdůležitější fáze a dá se začít hned, nezávisle na Fázi 1: namísto sdílení
kódu napsat sadu testů, které ženou **identickou sekvenci vstupů** přes obě fyzikální
implementace (`game/physics.ts` a `gameEngine/physics.ts`) a porovnávají výsledný stav
(pozice míče/hráčů po N ticích, detekci gólu, vlastní gól) s tolerancí na rozdílný dt.

- Kde: nový adresář testů, např. `osma-liga/__tests__/engineParity/` (nebo skript, který
  importuje engine z `project-hub-api` jako lokální dependency pro testovací účely).
- Co testovat konkrétně: shoda konstant (`FIELD_*`, `PLAYER_SPEED`, `KICK_FORCE`,
  `BALL_CONTROL_*`, `CORNER_CLEAR_*` mezi `game/constants.ts` a `gameEngine/constants.ts`),
  shoda výstupu `checkGoal()` pro stejnou pozici/rychlost míče, shoda `isOwnGoal` logiky.
- Přínos: i bez sdíleného kódu tohle zachytí budoucí rozjetí (např. když někdo upraví
  `KICK_FORCE` na jedné straně a zapomene na druhé) v CI, ne až live testem hráčů.
- Riziko: nízké — pouze testovací kód, nemění produkční chování.

### Fáze 3 — Reálné sdílení kódu (podmíněné, NE výchozí)

Provádět **pouze pokud** Fáze 1+2 ukážou, že konvence jsou sjednocené a parity testy
jsou stabilní, **a** přibude konkrétní mechanika (stamina/fauly/karty), kde duplicita
nákladů citelně převýší cenu nastavení sdíleného balíčku. Možnosti, v pořadí
preferencee od nejmenšího zásahu:

1. **Private npm package** (např. `@osma-liga/game-engine-core`) publikovaný do
   privátní registry nebo instalovaný přes git URL — oba repozitáře ho importují.
   Nejmenší zásah do existující repo struktury.
2. **Git submodule** se sdíleným engine kódem — méně pohodlné pro tooling, ale bez
   nutnosti registry.
3. **Monorepo** — sloučení `osma-liga` a `project-hub-api` (nebo jen engine částí) do
   jednoho repozitáře s workspaces. Největší zásah, nejvyšší jednorázová cena migrace.
   Review z 17. 6. tohle explicitně odkládá jako "overengineering v tomto stádiu" — platí
   i teď.

Tahle fáze se má naplánovat samostatně, až bude konkrétní mechanika, která ji vyžaduje.

## 5. Akceptační kritéria (jak poznat, že je plán naplněn)

- Fáze 0+1: `npm run build`/`typecheck` čisté v obou repozitářích, manuální test
  multiplayeru i training challenge bez regresí, žádná změna ve veřejném snapshot tvaru.
- Fáze 2: parity test suite existuje, běží v CI (nebo alespoň lokálně přes `npm test`),
  pokrývá goal detection, own-goal detection a základní pohyb/kop.
- Fáze 3: netýká se akceptace teď — spustí se jen na žádost s konkrétní mechanikou jako
  důvodem.

## 6. Doporučení

Začít Fází 0 (bezpečné UI extrakce, nezávislé) a Fází 2 (parity testy — nemění žádné
produkční chování, jen odhalí budoucí rozjetí) souběžně. Fázi 1 (sjednocení konvencí
v online enginu) zařadit až jako další krok, protože je to jediná fáze, která se dotýká
produkčního enginu (i když beze změny chování). Fázi 3 neplánovat, dokud pro ni nebude
konkrétní mechanický důvod.
