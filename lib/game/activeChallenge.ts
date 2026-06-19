import { pickTrainingChallengeMessage } from '@/lib/game/trainingChallengeMessages';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

type HumanCallout = { code: string; club: { name: string; shortName: string | null; slug: string } | null };
type TrainingChallenge = {
  code: string;
  club: { id: string; name: string; shortName: string | null; slug: string } | null;
  expiresAt: string;
};

export type ActiveChallenge =
  | { type: 'human'; code: string; clubSlug: string | null }
  | { type: 'training'; code: string; message: string; clubSlug: string | null }
  | null;

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${HUB_URL}${path}`, {
      headers: { 'X-Project-Hub-Key': HUB_KEY },
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// A real waiting human takes priority over the automatic training challenge.
// The random training-challenge message is picked here (server-side) so the
// client component renders a fixed string — no Math.random() during hydration.
export async function getActiveHomepageChallenge(): Promise<ActiveChallenge> {
  const [humanData, trainingData] = await Promise.all([
    fetchJson<{ game: HumanCallout | null }>('/api/osma-liga/online-games/looking-for-opponent'),
    fetchJson<{ game: TrainingChallenge | null }>('/api/osma-liga/training-challenges/active'),
  ]);

  const humanGame = humanData?.game ?? null;
  if (humanGame) {
    return { type: 'human', code: humanGame.code, clubSlug: humanGame.club?.slug ?? null };
  }

  const trainingGame = trainingData?.game ?? null;
  if (trainingGame?.club) {
    const clubName = trainingGame.club.shortName ?? trainingGame.club.name;
    return {
      type: 'training',
      code: trainingGame.code,
      message: pickTrainingChallengeMessage(clubName),
      clubSlug: trainingGame.club.slug,
    };
  }

  return null;
}
