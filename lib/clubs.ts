import { CLUBS as STATIC_CLUBS, getClubBySlug as getStaticClubBySlug } from '@/data/clubs';
import type { Club } from '@/data/clubs';

export type { Club };

const API_URL = process.env.PROJECT_HUB_API_URL;
const API_KEY = process.env.PROJECT_HUB_API_KEY;

async function fetchFromApi<T>(path: string): Promise<T | null> {
  if (!API_URL || !API_KEY) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'x-project-hub-key': API_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

function mapApiClub(raw: Record<string, unknown>): Club {
  return {
    id: String(raw.id ?? raw.slug ?? ''),
    slug: String(raw.slug ?? ''),
    name: String(raw.name ?? ''),
    banner: String(raw.banner ?? ''),
    note: String(raw.note ?? ''),
    location: String(raw.location ?? ''),
    colors: String(raw.colors ?? ''),
    motto: String(raw.motto ?? ''),
    description: String(raw.description ?? ''),
    seasonComment: String(raw.seasonComment ?? ''),
  };
}

export async function getClubs(): Promise<Club[]> {
  const data = await fetchFromApi<Record<string, unknown>[]>('/api/osma-liga/clubs');
  if (data && Array.isArray(data) && data.length > 0) {
    return data.map(mapApiClub);
  }
  return STATIC_CLUBS;
}

export async function getClub(slug: string): Promise<Club | undefined> {
  const data = await fetchFromApi<Record<string, unknown>>(`/api/osma-liga/clubs/${slug}`);
  if (data && typeof data === 'object' && data.slug) {
    return mapApiClub(data);
  }
  return getStaticClubBySlug(slug);
}

export type ClubStats = {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

const EMPTY_STATS: ClubStats = { matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };

export async function getClubStats(slug: string): Promise<ClubStats> {
  const data = await fetchFromApi<{ stats: ClubStats }>(`/api/osma-liga/clubs/${slug}/stats`);
  if (data && typeof data === 'object' && data.stats) return data.stats;
  return EMPTY_STATS;
}
