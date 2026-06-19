// Server-side only: relies on PROJECT_HUB_API_KEY, never import from a client component.
const API_URL = process.env.PROJECT_HUB_API_URL;
const API_KEY = process.env.PROJECT_HUB_API_KEY;

export type PlayerProfilePeriod = {
  type: 'rolling_30_days';
  days: number;
  since: string;
  until: string;
};

export type PlayerProfileStats = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  clubPointsEarned: number;
};

export type PlayerProfileClub = {
  club: { id: string; slug: string; name: string; shortName: string | null; logo: string | null };
  matches: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
};

export type PlayerProfileMatch = {
  id: string;
  finishedAt: string | null;
  homeScore: number;
  awayScore: number;
  userSide: 'home' | 'away';
  userClubPoints: number;
  homeClub: { slug: string; name: string; shortName: string | null } | null;
  awayClub: { slug: string; name: string; shortName: string | null } | null;
  homeUser: { username: string; globalName: string | null } | null;
  awayUser: { username: string; globalName: string | null } | null;
};

export type PlayerProfile = {
  user: { id: string; username: string; globalName: string | null; avatarUrl: string | null };
  period: PlayerProfilePeriod;
  stats: PlayerProfileStats;
  clubs: PlayerProfileClub[];
  recentMatches: PlayerProfileMatch[];
};

export async function getMyPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  if (!API_URL || !API_KEY) return null;
  try {
    const res = await fetch(`${API_URL}/api/osma-liga/users/${userId}/profile`, {
      headers: { 'x-project-hub-key': API_KEY },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as PlayerProfile;
  } catch {
    return null;
  }
}
