# Zdroj crowd zvuků

Zvuky pro dvě crowd sound-pool reakce v dynamické audio vrstvě zápasu
(`game/audio/inMatchAudio.ts` + `game/audio/inMatchSoundConfig.ts`):
gólová reakce davu (`afterGoalCrowd`) a tlaková reakce davu, když má soupeř
míč blízko naší branky (`enemyNearGoalPressure`).

## Zdrojové soubory → odvozené MP3

| Zdrojový soubor | Odvozený soubor | Pool | Zpracování |
|---|---|---|---|
| `after_goal.wav` | `after-goal-01.mp3` | `afterGoalCrowd` | `volume=0.7`, `libmp3lame -q:a 4` |
| `397434__foolboymedia__crowd-cheer.wav` | `enemy-near-goal-01.mp3` | `enemyNearGoalPressure` | `volume=0.5` (zdroj měl max_volume 0.0 dB, hlasitější než ostatní tři), `libmp3lame -q:a 4` |
| `649156__tylermyers1992__mlb-crowd-cheer-09032022.wav` | `enemy-near-goal-02.mp3` | `enemyNearGoalPressure` | `volume=0.7`, `libmp3lame -q:a 4` |
| `652571__thankzalotz__cheers.m4a` | `enemy-near-goal-03.mp3` | `enemyNearGoalPressure` | `volume=0.7`, `libmp3lame -q:a 4` |

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

`enemy-near-goal-01/02/03.mp3` jsou převzaté celé (beze střihu) a jsou poměrně
dlouhé pro one-shot crowd sting:

- `enemy-near-goal-01.mp3` (`397434__foolboymedia__crowd-cheer.wav`): ~20,4 s
- `enemy-near-goal-02.mp3` (`649156__tylermyers1992__mlb-crowd-cheer-09032022.wav`): ~25,9 s
- `enemy-near-goal-03.mp3` (`652571__thankzalotz__cheers.m4a`): ~38,7 s

`after-goal-01.mp3` (`after_goal.wav`) je krátký, ~3,6 s — vhodné pro one-shot.

Doporučení: near-goal zvuky do budoucna oříznout na cca 2-4 s (jen náběh crowd
reakce), aby seděly jako krátký sting spouštěný opakovaně přes cooldown, místo
přehrávání celého dlouhého klipu při každém spuštění. V tomto tasku šlo jen o
konverzi, bez střihu.

## TODO

- ověřit a doplnit přesnou licenci zdrojových souborů — název `397434__...`,
  `649156__...` a `652571__...` odpovídá formátu Freesound.org (ID + autor +
  název), licence není v projektu zatím nikde zaznamenaná
- `after_goal.wav` nemá v názvu žádné ID zdroje — licence needotvrzená

## Zapojení v kódu

Cesty jsou definované jako sound pooly v `game/audio/inMatchSoundConfig.ts`
(`IN_MATCH_POOLS.afterGoalCrowd`, `IN_MATCH_POOLS.enemyNearGoalPressure`) a
přehrávané přes `inMatchAudio.playRandomFromPool(...)` v
`game/audio/inMatchAudio.ts`. Volání viz `components/game/GameCanvas.tsx`.
