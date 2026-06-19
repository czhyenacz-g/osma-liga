import Link from 'next/link';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

type ActiveCallout = {
  code: string;
  club: { name: string; shortName: string | null } | null;
};

async function fetchActiveCallout(): Promise<ActiveCallout | null> {
  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/online-games/looking-for-opponent`, {
      headers: { 'X-Project-Hub-Key': HUB_KEY },
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;
    const data = await res.json() as { game: ActiveCallout | null };
    return data.game;
  } catch {
    return null;
  }
}

export default async function LookingForOpponentCallout() {
  const game = await fetchActiveCallout();
  if (!game) return null;

  const clubLabel = game.club?.shortName ?? game.club?.name ?? null;
  const title = clubLabel ? `${clubLabel} hledá soupeře` : 'Někdo čeká na soupeře';

  return (
    <div className="mx-auto max-w-[1240px] px-4 sm:px-6 pt-4">
      <Link
        href={`/hra/online/${game.code}`}
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
