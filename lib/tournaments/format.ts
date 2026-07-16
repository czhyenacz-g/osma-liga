export type TournamentFormat = 'derby' | 'league_top2_final' | 'league_top4_playoff';

export function getTournamentFormat(playerCount: number): TournamentFormat {
  if (playerCount <= 2) return 'derby';
  if (playerCount <= 4) return 'league_top2_final';
  return 'league_top4_playoff';
}

export function getFormatLabel(format: TournamentFormat): string {
  switch (format) {
    case 'derby':
      return 'Derby';
    case 'league_top2_final':
      return 'Liga + finále';
    case 'league_top4_playoff':
      return 'Liga + playoff top 4';
  }
}

export function getFormatDescription(format: TournamentFormat): string {
  switch (format) {
    case 'derby':
      return 'Derby — série až na 3 zápasy. Pokud po dvou zápasech není jasno (výhra 2:0 na zápasy), hraje se rozhodující třetí zápas. O vítězi rozhodují body, skóre a nakonec vstřelené góly.';
    case 'league_top2_final':
      return 'Každý s každým, top 2 postupují do finále.';
    case 'league_top4_playoff':
      return 'Každý s každým, top 4 postupují do playoff. Semifinále 1. vs 4. a 2. vs 3., poté finále.';
  }
}

export function getDefaultTeamNames(playerCount: number): string[] {
  return Array.from({ length: playerCount }, (_, i) => `Tým ${i + 1}`);
}
