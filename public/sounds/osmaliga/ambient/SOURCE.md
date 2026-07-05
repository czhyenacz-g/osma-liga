# Zdroj ambient zvuků

## Zdrojový soubor

`533861__larserikertzgaardringen__football-training-session-notodden-fk.wav`

## Odvozený soubor

`ambient-base-loop.mp3`

## Zpracování

- hlasitost snížena na 50 % (`ffmpeg -filter:a "volume=0.5"`)
- převedeno z WAV do MP3 (`libmp3lame`, `-q:a 4`) kvůli menší velikosti a širší
  kompatibilitě pro webové přehrávání

Použitý příkaz:

```
ffmpeg -i 533861__larserikertzgaardringen__football-training-session-notodden-fk.wav \
  -filter:a "volume=0.5" \
  -codec:a libmp3lame -q:a 4 \
  ambient-base-loop.mp3
```

## TODO

- ověřit a doplnit přesnou licenci původního souboru (pravděpodobně Freesound.org
  dle názvu se sample ID `533861`) před jakýmkoli veřejným/komerčním použitím
- `206003__habbis92__norwegian-football-matchsoccer-game-ambience.wav` je ve
  stejné složce, ale zatím nebyl použit — licence rovněž needotvrzená

## Zapojení v kódu

Cesta `/sounds/osmaliga/ambient/ambient-base-loop.mp3` je referencovaná v
`game/audio/inMatchSoundConfig.ts` (klíč `ambientBase`) a přehrávaná přes
`game/audio/inMatchAudio.ts`. Loop se spouští v `components/game/MatchPageClient.tsx`
(`startCountdown`), což pokrývá jak `/hra/bot`, tak `/hra/bot-test` (ten
`MatchPageClient` renderuje přímo).
