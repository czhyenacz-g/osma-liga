import Link from 'next/link';
import { pickTrainingChallengeMessage } from '@/lib/game/trainingChallengeMessages';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

type HumanCallout = { code: string; club: { name: string; shortName: string | null } | null };
type TrainingChallenge = {
  code: string;
  club: { id: string; name: string; shortName: string | null; slug: string } | null;
  expiresAt: string;
};

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

// Only one callout is shown at a time — a real waiting human takes priority
// over the automatic training challenge, to keep the homepage from feeling spammy.
export default async function HomepageOpponentCallout() {
  const [humanData, trainingData] = await Promise.all([
    fetchJson<{ game: HumanCallout | null }>('/api/osma-liga/online-games/looking-for-opponent'),
    fetchJson<{ game: TrainingChallenge | null }>('/api/osma-liga/training-challenges/active'),
  ]);

  const humanGame = humanData?.game ?? null;
  if (humanGame) {
    const clubLabel = humanGame.club?.shortName ?? humanGame.club?.name ?? null;
    const title = clubLabel ? `${clubLabel} hledá soupeře` : 'Někdo čeká na soupeře';
    return (
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 pt-4">
        <Link
          href={`/hra/online/${humanGame.code}`}
          className="animate-pulse block rounded-xl px-5 py-4 text-center transition hover:opacity-90"
          style={{ background: 'rgba(214,169,74,0.12)', border: '1px solid rgba(214,169,74,0.45)' }}
        >
          <p className="text-sm font-black" style={{ color: '#d6a94a' }}>{title}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(209,250,229,0.75)' }}>
            Na návsi visí nová výzva k online zápasu. Kdo klikne první, jde na plac.
          </p>
          <span className="inline-block mt-2 text-xs font-bold underline" style={{ color: '#d6a94a' }}>
            Přidat se k zápasu →
          </span>
        </Link>
      </div>
    );
  }

  const trainingGame = trainingData?.game ?? null;
  if (trainingGame?.club) {
    const clubName = trainingGame.club.shortName ?? trainingGame.club.name;
    const message = pickTrainingChallengeMessage(clubName);
    return (
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 pt-4">
        <Link
          href={`/hra/online/${trainingGame.code}`}
          className="animate-pulse block rounded-xl px-5 py-4 text-center transition hover:opacity-90"
          style={{ background: 'rgba(214,169,74,0.12)', border: '1px solid rgba(214,169,74,0.45)' }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1.5" style={{ color: '#6dbf8a' }}>
            Tréninkový zápas čeká
          </p>
          <p className="text-sm font-black" style={{ color: '#d6a94a' }}>{message}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(209,250,229,0.75)' }}>
            Kdo klikne první, jde na plac. Výzva visí jen chvíli.
          </p>
          <span className="inline-block mt-2 text-xs font-bold underline" style={{ color: '#d6a94a' }}>
            Nastoupit proti nim →
          </span>
        </Link>
      </div>
    );
  }

  return null;
}
