# Sound Bank

Centrální databanka zvuků pro Osmou ligu.

## Co je sound bank

Jeden soubor (`lib/audio/soundBank.ts`) obsahuje definice všech 24 písknutí × 2 enginy (Tone.js + WebAudio).
Každá definice obsahuje:
- `key` — identifikátor (viz formát níže)
- `number` — číslo zvuku (1–24)
- `baseId` — textový identifikátor (`kickoff`, `village_whistle`, …)
- `engine` — `'tone'` nebo `'webaudio'`
- `notes` — pole not (freq, dur, gap, …)
- `volDb` — volitelné přepsání hlasitosti (Tone.js, v dB, default −7)

Stránka `/dev/sound` je testovací UI nad stejnou sound bankou jakou používá hra.

## Formát sound key

Primární formát: `"${number.padStart(2,'0')}-${engine}"`

Příklady:
```
01-tone        → Výkopové písknutí (Tone.js)
01-webaudio    → Výkopové písknutí (WebAudio)
21-tone        → Konec zápasu — dvojité dlouhé (Tone.js)
15-tone        → Vesnická píšťalka (Tone.js)
```

Aliasy (sekundární):
```
kickoff-tone                → 01-tone
full_time_double_long-tone  → 21-tone
village_whistle-tone        → 15-tone
wet_whistle-tone            → 16-tone
sad_whistle-tone            → 17-tone
happy_whistle-tone          → 18-tone
distant_whistle-tone        → 19-tone
```

## Jak přehrát zvuk

```ts
import { playSound } from '@/lib/audio/playSound';

await playSound('21-tone');   // konec zápasu
await playSound('01-tone');   // výkop
await playSound('01-webaudio'); // výkop přes WebAudio
```

`playSound` je async, ale calleři nemusí čekat — funguje fire-and-forget:
```ts
void playSound('01-tone').catch(() => {});
```

Pokud klíč neexistuje, funkce pouze zaloguje `console.warn` a tiše pokračuje. Hra se nerozbije.

## Herní wrappery

Herní kód nepoužívá `playSound` přímo — volá pojmenované wrappery z `lib/audio/whistleEngine.ts`:

```ts
import { playKickoffWhistle, playFullTimeWhistle, playGoalRestartWhistle } from '@/lib/audio/whistleEngine';

playKickoffWhistle();      // → 01-tone
playFullTimeWhistle();     // → 21-tone
playGoalRestartWhistle();  // → náhodný 15-tone .. 19-tone
```

Wrappery jsou fire-and-forget (vrací `void`).

## Kde jsou wrappery napojeny

| Soubor | Událost | Wrapper |
|--------|---------|---------|
| `components/game/GameCanvas.tsx` | start hry (mount) | `playKickoffWhistle()` |
| `components/game/GameCanvas.tsx` | manuální restart | `playKickoffWhistle()` |
| `components/game/GameCanvas.tsx` | gól → hra pokračuje, rohový kop | `playGoalRestartWhistle()` |
| `components/game/MatchPageClient.tsx` | konec zápasu (bot hra) | `playFullTimeWhistle()` |
| `components/online/useOnlineGame.ts` | `game_started` socket event | `playKickoffWhistle()` |
| `components/online/useOnlineGame.ts` | `game_finished` socket event | `playFullTimeWhistle()` |
| `components/online/OnlineGameClient.tsx` | nový `snapshot.goalMessage` | `playGoalRestartWhistle()` |

## Jak změnit definici zvuku

Stačí upravit záznam v `lib/audio/soundBank.ts`. Změna se automaticky projeví na `/dev/sound` i ve hře.

Příklad — změna frekvence výkopu:
```ts
// lib/audio/soundBank.ts
'01-tone': {
  ...
  notes: [{ freq: 3500, dur: 0.83 }],  // změnit freq zde
},
```

## Architektura souborů

```
lib/audio/
  types.ts         — typy (SoundEngine, WhistleNote, SoundDefinition)
  soundBank.ts     — definice všech 24 zvuků × 2 enginy + aliasy
  whistleEngine.ts — Tone.js engine + WebAudio engine + playSound() + wrappery
  playSound.ts     — re-export: playSound(), unlockAudio()
```

## Unlock audio / user gesture

Tone.js vyžaduje `Tone.start()` po user gestuře. `playSound()` vždy interně volá `await Tone.start()` před přehráním.

Pro explicitní odemčení audia (např. na tlačítko):
```ts
import { unlockAudio } from '@/lib/audio/playSound';
await unlockAudio();
```

**Známé omezení:** první písknutí na mobilu může být tiché, pokud hráč ještě neinteragoval s canvasem nebo ovládáním. Druhé a každé další písknutí (po gólu, po restartu) projde spolehlivě, protože audio kontext je pak odemčen.

## WebAudio vs Tone.js

- **Tone.js** = hlavní engine pro hru (čistý sin tone, vibrato, highpass filter)
- **WebAudio** = legacy engine, dostupný na `/dev/sound` pro srovnání

Tone.js má bohatší vibrato charakteristiku; WebAudio engine podporuje navíc `noise` a `vibrato` per-nota. Oba enginy přehrají stejná písknutí ze sound banky.
