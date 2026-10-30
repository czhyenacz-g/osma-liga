# Zdroj crowd zvuků

Zvuky pro dvě crowd vrstvy v dynamické audio vrstvě zápasu
(`game/audio/inMatchAudio.ts` + `game/audio/inMatchSoundConfig.ts`):
gólová reakce davu (one-shot pool `afterGoalCrowd`) a dlouhá dynamická
crowd pressure vrstva (bed `nearGoalPressureBed`), když je míč blízko
kterékoli branky.

## Zdrojové soubory → odvozené MP3

| Zdrojový soubor | Odvozený soubor | Vrstva | Zpracování |
|---|---|---|---|
| `after_goal.wav` | `after-goal-01.mp3` | `afterGoalCrowd` (one-shot pool) | `volume=0.7`, `libmp3lame -q:a 4` |
| `397434__foolboymedia__crowd-cheer.wav` | `enemy-near-goal-01.mp3` | `nearGoalPressureBed` (long pressure bed) | `volume=0.5` (zdroj měl max_volume 0.0 dB, hlasitější než ostatní tři), `libmp3lame -q:a 4` |
| `649156__tylermyers1992__mlb-crowd-cheer-09032022.wav` | `enemy-near-goal-02.mp3` | `nearGoalPressureBed` (long pressure bed) | `volume=0.7`, `libmp3lame -q:a 4` |
| `652571__thankzalotz__cheers.m4a` | `enemy-near-goal-03.mp3` | `nearGoalPressureBed` (long pressure bed) | `volume=0.7`, `libmp3lame -q:a 4` |

Příklad použitého příkazu:

```
ffmpeg -i after_goal.wav \
  -filter:a "volume=0.7" \
  -codec:a libmp3lame -q:a 4 \
  after-goal-01.mp3
```

## Datum importu

2026-07-05

## Poznámka k délce

`enemy-near-goal-01/02/03.mp3` jsou převzaté celé (beze střihu):

- `enemy-near-goal-01.mp3` (`397434__foolboymedia__crowd-cheer.wav`): ~20,4 s
- `enemy-near-goal-02.mp3` (`649156__tylermyers1992__mlb-crowd-cheer-09032022.wav`): ~25,9 s
- `enemy-near-goal-03.mp3` (`652571__thankzalotz__cheers.m4a`): ~38,7 s

`after-goal-01.mp3` (`after_goal.wav`) je krátký, ~3,6 s — vhodné pro one-shot.

Current `enemy-near-goal-*` files are intentionally used as a long dynamic
pressure bed (`IN_MATCH_BEDS.nearGoalPressureBed` v `inMatchSoundConfig.ts`) —
jeden náhodně vybraný soubor hraje jako řízená smyčka s hlasitostí odvozenou
od `smoothedNearGoalPressure` (viz `GameCanvas.tsx`), ne jako krátký
opakovaně spouštěný one-shot. Jejich délka je proto v pořádku.

Possible future improvement:
Create separate 2–4s enemy-near-goal-sting-* files for short one-shot
reactions (viz připravený, zatím prázdný pool `nearGoalStings` v
`inMatchSoundConfig.ts`).

## Licence (ověřeno 2026-10-30 na Freesound.org)

| Soubor | Freesound | Autor | Název | Licence |
|---|---|---|---|---|
| `397434__foolboymedia__crowd-cheer.wav` | https://freesound.org/s/397434/ | FoolBoyMedia | Crowd Cheer | Creative Commons 0 |
| `649156__tylermyers1992__mlb-crowd-cheer-09032022.wav` | https://freesound.org/s/649156/ | tylermyers1992 | MLB Crowd Cheer - 09032022.wav | Creative Commons 0 |
| `652571__thankzalotz__cheers.m4a` | https://freesound.org/s/652571/ | thankzalotz | Cheers.m4a | Creative Commons 0 |

Délky na Freesound odpovídají souborům v repozitáři (20,4 s / 25,9 s / 38,6 s).

## TODO

- `after_goal.wav` nemá v názvu žádné ID zdroje — licence needotvrzená

## Zrušené reference (2026-10-30)

Kód původně (`38458c2`) počítal ještě se dvěma crowd soubory, které nikdy
nevznikly a v produkci vracely 404:

- `crowd-pressure-loop.mp3` — smyčka `crowdPressure` s hlasitostí podle
  vzdálenosti míče od branky,
- `crowd-near-goal-ooh-01.mp3` — one-shot `nearGoalOoh` při tlaku u branky.

Obojí funkčně nahradil pressure bed `nearGoalPressureBed` (`2158e44`), který
reaguje na stejný tlak u branky s fade-in/fade-out. Doplnění souborů by
znamenalo dvě crowd vrstvy přes sebe, proto byly reference odstraněny místo
přidání nového assetu. Budoucí krátké reakce patří do poolu `nearGoalStings`.

## Zapojení v kódu

`after-goal-01.mp3` je definovaný jako one-shot pool `IN_MATCH_POOLS.afterGoalCrowd`
v `game/audio/inMatchSoundConfig.ts` a přehrávaný přes
`inMatchAudio.playRandomFromPool('afterGoalCrowd')` po gólu.

`enemy-near-goal-01/02/03.mp3` jsou definované jako dlouhý pressure bed
`IN_MATCH_BEDS.nearGoalPressureBed` a řízené přes
`inMatchAudio.startRandomBedFromPool/setBedVolume/stopBed(...)` — vždy běží
maximálně jeden soubor najednou, s hlasitostí plynule navazující na
`smoothedNearGoalPressure`. Volání viz `components/game/GameCanvas.tsx`.
