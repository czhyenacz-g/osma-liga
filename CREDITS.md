# Credits

## Audio

Krátké herní SFX pro dynamickou audio vrstvu zápasu (`game/audio/inMatchAudio.ts`)
pochází z [Kenney.nl](https://kenney.nl/assets), licence **Creative Commons CC0**
(public domain, bez nutnosti attribution).

Použité balíčky:

| Balíček | URL |
|---|---|
| UI Audio | https://kenney.nl/assets/ui-audio |
| Impact Sounds | https://kenney.nl/assets/impact-sounds |
| Digital Audio | https://kenney.nl/assets/digital-audio |

Datum importu: 2026-07-03

| Finální soubor (`public/sounds/osmaliga/kenney/`) | Zdrojový Kenney soubor | Balíček |
|---|---|---|
| `ball-kick-soft.wav` | `impactPunch_medium_000.ogg` | Impact Sounds |
| `ball-kick-hard.wav` | `impactPunch_heavy_000.ogg` | Impact Sounds |
| `player-switch.wav` | `switch2.ogg` | UI Audio |
| `ball-bounce.wav` | `impactSoft_medium_000.ogg` | Impact Sounds |
| `pong-bounce.wav` | `highUp.ogg` | Digital Audio |
| `button-click.wav` | `click1.ogg` | UI Audio |

Zvuky pro píšťalku rozhodčího, gól a konec zápasu (`lib/audio/whistleEngine.ts`) jsou
syntetizované procedurálně (Tone.js / Web Audio API), nejde o audio soubory — žádný
externí zdroj/licence se na ně nevztahuje.

Ambientní a crowd zvuky (`public/sounds/osmaliga/ambient/`, `.../crowd/`) zatím
neexistují — nejde o krátká Kenney SFX a žádný z balíčků nemá vhodný stadionový
materiál. Kód s jejich chybějící přítomností počítá (viz pravidlo "chybějící asset
nesmí shodit hru" v `game/audio/inMatchAudio.ts`).

Podrobné mapování a poznámky viz `public/sounds/osmaliga/kenney/SOURCE.md`.
