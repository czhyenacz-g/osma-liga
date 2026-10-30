# Zdroj zvuků — Kenney.nl (CC0)

Krátké herní SFX pro dynamickou audio vrstvu zápasu (`game/audio/inMatchAudio.ts`).
Všechny zvuky pochází z [kenney.nl](https://kenney.nl/assets), licence **Creative
Commons CC0** (public domain, bez nutnosti attribution).

## Použité balíčky

| Balíček | URL |
|---|---|
| UI Audio | https://kenney.nl/assets/ui-audio |
| Impact Sounds | https://kenney.nl/assets/impact-sounds |
| Digital Audio | https://kenney.nl/assets/digital-audio |

(Interface Sounds byl stažen a prohlédnut, ale nakonec z něj nebyl použit žádný
soubor — ponecháno zde pro úplnost, kdyby se hodil při rozšiřování.)

## Datum importu

2026-07-03

## Mapování zdrojových souborů na finální názvy

Zdrojové soubory byly `.ogg`, převedené do `.wav` (`ffmpeg`, beze změny vzorkovací
frekvence/komprese — jen kontejner) kvůli širší kompatibilitě napříč prohlížeči.

| Finální soubor | Zdrojový Kenney soubor | Balíček |
|---|---|---|
| `ball-kick-soft.wav` | `impactPunch_medium_000.ogg` | Impact Sounds |
| `ball-kick-hard.wav` | `impactPunch_heavy_000.ogg` | Impact Sounds |
| `player-switch.wav` | `switch2.ogg` | UI Audio |
| `ball-bounce.wav` | `impactSoft_medium_000.ogg` | Impact Sounds |
| `pong-bounce.wav` | `highUp.ogg` | Digital Audio |
| `button-click.wav` | `click1.ogg` | UI Audio |

## Poznámka k ambient/crowd zvukům

Ambient a crowd zvuky nejsou z Kenney balíčků — mají vlastní evidenci v
`public/sounds/osmaliga/ambient/SOURCE.md` a `public/sounds/osmaliga/crowd/SOURCE.md`.
