import type { SoundDefinition } from './types';

// ── Tone.js frequency constants ──────────────────────────────────────────────
const TJ_S = 3300;  // standard
const TJ_H = 3800;  // high
const TJ_L = 2600;  // low

// ── WebAudio frequency constants ─────────────────────────────────────────────
const WA_S = 3000;
const WA_H = 3500;
const WA_L = 2750;

// ── Central sound bank ───────────────────────────────────────────────────────
// Keys: "${number.padStart(2,'0')}-tone" | "${number.padStart(2,'0')}-webaudio"
// Aliases: "${baseId}-tone" | "${baseId}-webaudio"

const BANK: Record<string, SoundDefinition> = {

  // ── #01 Výkopové písknutí ────────────────────────────────────────────────
  '01-tone': {
    key: '01-tone', number: 1, baseId: 'kickoff', engine: 'tone',
    name: 'Výkopové písknutí',
    notes: [{ freq: TJ_S, dur: 0.83 }],
  },
  '01-webaudio': {
    key: '01-webaudio', number: 1, baseId: 'kickoff', engine: 'webaudio',
    name: 'Výkopové písknutí',
    notes: [{ freq: WA_S, dur: 0.83, noise: true }],
  },

  // ── #02 Pokračování hry ───────────────────────────────────────────────────
  '02-tone': {
    key: '02-tone', number: 2, baseId: 'restart', engine: 'tone',
    name: 'Pokračování hry',
    notes: [{ freq: TJ_H, dur: 0.70 }],
  },
  '02-webaudio': {
    key: '02-webaudio', number: 2, baseId: 'restart', engine: 'webaudio',
    name: 'Pokračování hry',
    notes: [{ freq: WA_H, dur: 0.70 }],
  },

  // ── goal-tone — used by playGoalSound() ─────────────────────────────────
  // Based on 02-tone but 1.5× longer and louder for better audibility.
  'goal-tone': {
    key: 'goal-tone', number: 2, baseId: 'restart', engine: 'tone',
    name: 'Gólové písknutí',
    notes: [{ freq: TJ_H, dur: 1.05 }],
    volDb: -3,
  },

  // ── #03 Běžný faul ────────────────────────────────────────────────────────
  '03-tone': {
    key: '03-tone', number: 3, baseId: 'common_foul', engine: 'tone',
    name: 'Běžný faul',
    notes: [{ freq: TJ_S, dur: 0.86 }],
  },
  '03-webaudio': {
    key: '03-webaudio', number: 3, baseId: 'common_foul', engine: 'webaudio',
    name: 'Běžný faul',
    notes: [{ freq: WA_S, dur: 0.86, vol: 0.44 }],
  },

  // ── #04 Tvrdý faul ────────────────────────────────────────────────────────
  '04-tone': {
    key: '04-tone', number: 4, baseId: 'hard_foul', engine: 'tone',
    name: 'Tvrdý faul',
    notes: [{ freq: TJ_S, dur: 0.83 }],
  },
  '04-webaudio': {
    key: '04-webaudio', number: 4, baseId: 'hard_foul', engine: 'webaudio',
    name: 'Tvrdý faul',
    notes: [{ freq: WA_S, dur: 0.83, vol: 0.50, noise: true }],
  },

  // ── #05 Žlutá karta ───────────────────────────────────────────────────────
  '05-tone': {
    key: '05-tone', number: 5, baseId: 'yellow_card', engine: 'tone',
    name: 'Žlutá karta',
    notes: [{ freq: TJ_S, dur: 0.33 }],
  },
  '05-webaudio': {
    key: '05-webaudio', number: 5, baseId: 'yellow_card', engine: 'webaudio',
    name: 'Žlutá karta',
    notes: [{ freq: WA_S, dur: 0.33, vol: 0.44 }],
  },

  // ── #06 Červená karta ─────────────────────────────────────────────────────
  '06-tone': {
    key: '06-tone', number: 6, baseId: 'red_card', engine: 'tone',
    name: 'Červená karta',
    notes: [{ freq: TJ_L, dur: 1.20 }],
  },
  '06-webaudio': {
    key: '06-webaudio', number: 6, baseId: 'red_card', engine: 'webaudio',
    name: 'Červená karta',
    notes: [{ freq: WA_L, dur: 1.20, vol: 0.54, noise: true }],
  },

  // ── #07 Přísný rozhodčí ───────────────────────────────────────────────────
  '07-tone': {
    key: '07-tone', number: 7, baseId: 'strict_referee', engine: 'tone',
    name: 'Přísný rozhodčí',
    notes: [{ freq: 3000, dur: 0.42 }],
  },
  '07-webaudio': {
    key: '07-webaudio', number: 7, baseId: 'strict_referee', engine: 'webaudio',
    name: 'Přísný rozhodčí',
    notes: [{ freq: 2850, dur: 0.42, vol: 0.50, vibrato: 15 }],
  },

  // ── #08 Výhoda ve hře ─────────────────────────────────────────────────────
  '08-tone': {
    key: '08-tone', number: 8, baseId: 'advantage', engine: 'tone',
    name: 'Výhoda ve hře',
    notes: [{ freq: TJ_H, dur: 0.14, gap: 0.10 }, { freq: TJ_H, dur: 0.14 }],
  },
  '08-webaudio': {
    key: '08-webaudio', number: 8, baseId: 'advantage', engine: 'webaudio',
    name: 'Výhoda ve hře',
    notes: [{ freq: WA_H, dur: 0.14, gap: 0.10 }, { freq: WA_H, dur: 0.14 }],
  },

  // ── #09 Já to neviděl ─────────────────────────────────────────────────────
  '09-tone': {
    key: '09-tone', number: 9, baseId: 'did_not_see', engine: 'tone',
    name: 'Já to neviděl',
    notes: [{ freq: TJ_S, dur: 0.21, gap: 0.05 }, { freq: TJ_L, dur: 0.14 }],
  },
  '09-webaudio': {
    key: '09-webaudio', number: 9, baseId: 'did_not_see', engine: 'webaudio',
    name: 'Já to neviděl',
    notes: [{ freq: WA_S, dur: 0.21, gap: 0.05, vol: 0.24 }, { freq: WA_L, dur: 0.14, vol: 0.20 }],
  },

  // ── #10 Co to bylo? ───────────────────────────────────────────────────────
  '10-tone': {
    key: '10-tone', number: 10, baseId: 'what_was_that', engine: 'tone',
    name: 'Co to bylo?',
    notes: [{ freq: TJ_S, dur: 0.23, gap: 0.38 }, { freq: TJ_H, dur: 0.11 }],
  },
  '10-webaudio': {
    key: '10-webaudio', number: 10, baseId: 'what_was_that', engine: 'webaudio',
    name: 'Co to bylo?',
    notes: [{ freq: WA_S, dur: 0.23, gap: 0.38 }, { freq: WA_H, dur: 0.11, vol: 0.22 }],
  },

  // ── #11 Panické písknutí ──────────────────────────────────────────────────
  '11-tone': {
    key: '11-tone', number: 11, baseId: 'panic', engine: 'tone',
    name: 'Panické písknutí',
    notes: [
      { freq: TJ_H, dur: 0.11, gap: 0.08 },
      { freq: TJ_H, dur: 0.11, gap: 0.08 },
      { freq: TJ_H, dur: 0.11, gap: 0.08 },
      { freq: TJ_S, dur: 0.42 },
    ],
  },
  '11-webaudio': {
    key: '11-webaudio', number: 11, baseId: 'panic', engine: 'webaudio',
    name: 'Panické písknutí',
    notes: [
      { freq: WA_H, dur: 0.11, gap: 0.08 },
      { freq: WA_H, dur: 0.11, gap: 0.08 },
      { freq: WA_H, dur: 0.11, gap: 0.08 },
      { freq: WA_S, dur: 0.42, vol: 0.46 },
    ],
  },

  // ── #12 Simulace uznána ───────────────────────────────────────────────────
  '12-tone': {
    key: '12-tone', number: 12, baseId: 'dive_accepted', engine: 'tone',
    name: 'Simulace uznána',
    notes: [{ freq: TJ_S, dur: 0.24, gap: 0.28 }, { freq: TJ_L, dur: 0.21 }],
  },
  '12-webaudio': {
    key: '12-webaudio', number: 12, baseId: 'dive_accepted', engine: 'webaudio',
    name: 'Simulace uznána',
    notes: [{ freq: WA_S, dur: 0.24, gap: 0.28 }, { freq: WA_L, dur: 0.21, vol: 0.28 }],
  },

  // ── #13 Simulace prokouknuta ──────────────────────────────────────────────
  '13-tone': {
    key: '13-tone', number: 13, baseId: 'dive_spotted', engine: 'tone',
    name: 'Simulace prokouknuta',
    notes: [{ freq: TJ_S, dur: 0.33 }],
  },
  '13-webaudio': {
    key: '13-webaudio', number: 13, baseId: 'dive_spotted', engine: 'webaudio',
    name: 'Simulace prokouknuta',
    notes: [{ freq: WA_S, dur: 0.33, vol: 0.48 }],
  },

  // ── #14 Zdržování hry ─────────────────────────────────────────────────────
  '14-tone': {
    key: '14-tone', number: 14, baseId: 'time_wasting', engine: 'tone',
    name: 'Zdržování hry',
    notes: [{ freq: TJ_S, dur: 1.28 }],
  },
  '14-webaudio': {
    key: '14-webaudio', number: 14, baseId: 'time_wasting', engine: 'webaudio',
    name: 'Zdržování hry',
    notes: [{ freq: WA_S, dur: 1.28, vol: 0.32 }],
  },

  // ── #15 Vesnická píšťalka ─────────────────────────────────────────────────
  '15-tone': {
    key: '15-tone', number: 15, baseId: 'village_whistle', engine: 'tone',
    name: 'Vesnická píšťalka',
    notes: [{ freq: 2900, dur: 0.27 }],
  },
  '15-webaudio': {
    key: '15-webaudio', number: 15, baseId: 'village_whistle', engine: 'webaudio',
    name: 'Vesnická píšťalka',
    notes: [{ freq: 2820, dur: 0.27, vol: 0.30, vibrato: 55, noise: true }],
  },

  // ── #16 Mokrá píšťalka ────────────────────────────────────────────────────
  '16-tone': {
    key: '16-tone', number: 16, baseId: 'wet_whistle', engine: 'tone',
    name: 'Mokrá píšťalka',
    notes: [{ freq: 2700, dur: 0.15, gap: 0.04 }, { freq: 3000, dur: 0.27 }],
  },
  '16-webaudio': {
    key: '16-webaudio', number: 16, baseId: 'wet_whistle', engine: 'webaudio',
    name: 'Mokrá píšťalka',
    notes: [{ freq: 2650, dur: 0.15, gap: 0.04, vol: 0.18, noise: true }, { freq: 2900, dur: 0.27, vol: 0.28, noise: true }],
  },

  // ── #17 Smutné písknutí ───────────────────────────────────────────────────
  '17-tone': {
    key: '17-tone', number: 17, baseId: 'sad_whistle', engine: 'tone',
    name: 'Smutné písknutí',
    notes: [{ freq: TJ_S, dur: 0.68, descend: true }],
  },
  '17-webaudio': {
    key: '17-webaudio', number: 17, baseId: 'sad_whistle', engine: 'webaudio',
    name: 'Smutné písknutí',
    notes: [{ freq: WA_S, dur: 0.68, vol: 0.28, descend: true, vibrato: 18 }],
  },

  // ── #18 Veselé písknutí ───────────────────────────────────────────────────
  '18-tone': {
    key: '18-tone', number: 18, baseId: 'happy_whistle', engine: 'tone',
    name: 'Veselé písknutí',
    notes: [{ freq: TJ_H, dur: 0.17 }],
  },
  '18-webaudio': {
    key: '18-webaudio', number: 18, baseId: 'happy_whistle', engine: 'webaudio',
    name: 'Veselé písknutí',
    notes: [{ freq: 3750, dur: 0.17, vol: 0.34 }],
  },

  // ── #19 Písknutí z dálky ──────────────────────────────────────────────────
  '19-tone': {
    key: '19-tone', number: 19, baseId: 'distant_whistle', engine: 'tone',
    name: 'Písknutí z dálky',
    notes: [{ freq: TJ_S, dur: 0.27 }],
    volDb: -14,  // quieter than default −7 dB
  },
  '19-webaudio': {
    key: '19-webaudio', number: 19, baseId: 'distant_whistle', engine: 'webaudio',
    name: 'Písknutí z dálky',
    notes: [{ freq: WA_S, dur: 0.27, vol: 0.12, vibrato: 8 }],
  },

  // ── #20 Unavený rozhodčí ──────────────────────────────────────────────────
  '20-tone': {
    key: '20-tone', number: 20, baseId: 'tired_referee', engine: 'tone',
    name: 'Unavený rozhodčí',
    notes: [{ freq: 2700, dur: 0.27, gap: 0.08 }, { freq: 3000, dur: 0.33 }],
  },
  '20-webaudio': {
    key: '20-webaudio', number: 20, baseId: 'tired_referee', engine: 'webaudio',
    name: 'Unavený rozhodčí',
    notes: [{ freq: 2620, dur: 0.27, gap: 0.08, vol: 0.16, noise: true }, { freq: 2850, dur: 0.33, vol: 0.26 }],
  },

  // ── #21 Konec zápasu — dvojité dlouhé ────────────────────────────────────
  '21-tone': {
    key: '21-tone', number: 21, baseId: 'full_time_double_long', engine: 'tone',
    name: 'Konec zápasu — dvojité dlouhé',
    notes: [{ freq: TJ_S, dur: 0.53, gap: 0.45 }, { freq: TJ_S, dur: 0.53 }],
    volDb: -4,
  },
  '21-webaudio': {
    key: '21-webaudio', number: 21, baseId: 'full_time_double_long', engine: 'webaudio',
    name: 'Konec zápasu — dvojité dlouhé',
    notes: [{ freq: WA_S, dur: 0.53, gap: 0.45 }, { freq: WA_S, dur: 0.53 }],
  },

  // ── #22 Konec zápasu — trojité klasické ──────────────────────────────────
  '22-tone': {
    key: '22-tone', number: 22, baseId: 'full_time_triple_classic', engine: 'tone',
    name: 'Konec zápasu — trojité klasické',
    notes: [
      { freq: TJ_S, dur: 0.33, gap: 0.18 },
      { freq: TJ_S, dur: 0.33, gap: 0.18 },
      { freq: TJ_S, dur: 0.98 },
    ],
  },
  '22-webaudio': {
    key: '22-webaudio', number: 22, baseId: 'full_time_triple_classic', engine: 'webaudio',
    name: 'Konec zápasu — trojité klasické',
    notes: [
      { freq: WA_S, dur: 0.33, gap: 0.18 },
      { freq: WA_S, dur: 0.33, gap: 0.18 },
      { freq: WA_S, dur: 0.98, vol: 0.46, noise: true },
    ],
  },

  // ── #23 Konec zápasu — unavený rozhodčí ──────────────────────────────────
  '23-tone': {
    key: '23-tone', number: 23, baseId: 'full_time_tired', engine: 'tone',
    name: 'Konec zápasu — unavený rozhodčí',
    notes: [{ freq: 2900, dur: 0.42, gap: 0.50 }, { freq: 2900, dur: 0.33 }],
  },
  '23-webaudio': {
    key: '23-webaudio', number: 23, baseId: 'full_time_tired', engine: 'webaudio',
    name: 'Konec zápasu — unavený rozhodčí',
    notes: [{ freq: 2820, dur: 0.42, gap: 0.50, vol: 0.24, noise: true }, { freq: 2820, dur: 0.33, vol: 0.22 }],
  },

  // ── #24 Konec zápasu — dramatický chaos ──────────────────────────────────
  '24-tone': {
    key: '24-tone', number: 24, baseId: 'full_time_chaos', engine: 'tone',
    name: 'Konec zápasu — dramatický chaos',
    notes: [
      { freq: TJ_S, dur: 0.21, gap: 0.08 },
      { freq: TJ_S, dur: 0.21, gap: 0.28 },
      { freq: TJ_L, dur: 1.13 },
    ],
  },
  '24-webaudio': {
    key: '24-webaudio', number: 24, baseId: 'full_time_chaos', engine: 'webaudio',
    name: 'Konec zápasu — dramatický chaos',
    notes: [
      { freq: WA_S, dur: 0.21, gap: 0.08 },
      { freq: WA_S, dur: 0.21, gap: 0.28 },
      { freq: WA_L, dur: 1.13, vol: 0.48, noise: true },
    ],
  },
};

// ── Aliases ───────────────────────────────────────────────────────────────────
// Primary format is "${number}-engine". Aliases are baseId-based shortcuts.
const ALIASES: Record<string, string> = {
  'kickoff-tone':                  '01-tone',
  'kickoff-webaudio':              '01-webaudio',
  'restart-tone':                  '02-tone',
  'restart-webaudio':              '02-webaudio',
  'village_whistle-tone':          '15-tone',
  'village_whistle-webaudio':      '15-webaudio',
  'wet_whistle-tone':              '16-tone',
  'wet_whistle-webaudio':          '16-webaudio',
  'sad_whistle-tone':              '17-tone',
  'sad_whistle-webaudio':          '17-webaudio',
  'happy_whistle-tone':            '18-tone',
  'happy_whistle-webaudio':        '18-webaudio',
  'distant_whistle-tone':          '19-tone',
  'distant_whistle-webaudio':      '19-webaudio',
  'full_time_double_long-tone':    '21-tone',
  'full_time_double_long-webaudio':'21-webaudio',
};

export function getSound(key: string): SoundDefinition | undefined {
  return BANK[key] ?? (ALIASES[key] ? BANK[ALIASES[key]] : undefined);
}

export function getAllSounds(): SoundDefinition[] {
  return Object.values(BANK);
}
