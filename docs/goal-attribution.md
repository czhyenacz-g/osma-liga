# Přisuzování gólů a vlastní góly

Platí od 2026-10-31 ve všech třech režimech (`/hra/bot`, tréninková výzva,
multiplayer). Jedna čistá funkce, v obou repech stejná:

- lokálně `game/goalAttribution.ts`;
- server `project-hub-api` `src/gameEngine/goalAttribution.ts`.

Skóre se počítá jen z toho, do které branky míč přešel. Pravidlo mění
**jen** popisek gólu („VLASTNÍ GÓL!“ a hlášku) a příznak `isOwnGoal`
v serverové gólové události.

## Pravidlo

O gólu rozhoduje **poslední aktivní akce**, tedy `lastKickTeam`.

| Kdo naposledy aktivně hrál | Výsledek |
|---|---|
| tým, který skóroval | jeho gól |
| tým, který inkasoval | **vlastní gól** |
| nikdo od výkopu, nebo míč posunul automatický výkop z rohu | běžný gól, nikdy vlastní |

**Aktivní akce** je kop člověka (tap i nabitý), přihrávka *pass & switch*,
kop bota a kop podpůrného AI hráče.

**Pasivní kontakt** autora nemění. Patří sem:
- odraz od hráče nebo brankáře, blok, teč;
- zákrok brankáře (brankář v enginu nikdy aktivně nekope);
- kontrola míče a vedení;
- odraz od mantinelu.

`lastTouchTeam` se dál eviduje, ale o vlastním gólu už nerozhoduje.

`lastKick*` se nuluje při výkopu po gólu, při novém zápase a při
automatickém výkopu z rohu.

## Proč ne časové okno ani „mířila střela na bránu“

Monte Carlo na lokálním enginu, 3000 střel s náhodnými obránci a
brankářem. Za pravdu se bralo kontrafaktuální přehrání stejné střely bez
dotýkajících se soupeřů: padl by gól i tak?

| Varianta | Chybné vlastní góly | Zachycené skutečné „teče do vlastní“ |
|---|---|---|
| původní (poslední dotek) | 211 z 265 | 41 |
| A: okno 1,5 s po pasivní teči | 0 | 0 z 45 |
| **B: jen aktivní akce (zvoleno)** | **0** | 0 z 45 |
| C: B + směřovala střela na bránu | 27 | 29 z 45 |

- **A** dává stejný výsledek jako B, ale potřebuje časový stav. Po uplynutí
  okna vrací chybu zpět, například u pomalé střely, která do brány dojde
  po víc než 1,5 s.
- **C** odhaduje přímku bez odrazů. Je zhruba stejně často chybně jako
  správně, takže spolehlivě nerozliší.

**Nejednoznačný případ** je střela mimo bránu, kterou obránce náhodou
stočí dovnitř. Počítá se střelci jako neutrální gól, protože správné skóre
a žádný falešný vlastní gól mají přednost.

## Testy

- `game/goalAttribution.test.ts` (lokální engine, 30/60/144 Hz);
- `src/gameEngine/goalAttribution.test.ts` (server).

Scénáře v testech:
- čistá střela;
- lehká teč obránce a lehká teč brankáře;
- zákrok brankáře, po kterém míč i tak skončí v brance;
- střela mimo bránu stočená obráncem;
- kop do vlastní branky (z obou stran hřiště);
- převzetí míče, vedení a kop do vlastní branky;
- střela kolem dvou obránců;
- odraz od mantinelu a pak teč;
- gól víc než 1,5 s po střele;
- vlastní kop krátce po střele soupeře;
- střela Žolíka;
- gól bez kopu od výkopu;
- střela pod tlakem (obránce v kontaktu s míčem);
- dřívější odraz od soupeře a pak čistá střela;
- reset `lastKick` po gólu a restartu.

Historické zápasy se nepřepočítávají.
