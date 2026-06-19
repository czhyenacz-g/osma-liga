export function formatPoints(points: number): string {
  if (points === 1) return '1 bod';
  if (points >= 2 && points <= 4) return `${points} body`;
  return `${points} bodů`;
}

export function formatMatches(matches: number): string {
  if (matches === 1) return '1 zápas';
  if (matches >= 2 && matches <= 4) return `${matches} zápasy`;
  return `${matches} zápasů`;
}

export function formatGoalDifference(diff: number): string {
  if (diff > 0) return `+${diff}`;
  return String(diff);
}
