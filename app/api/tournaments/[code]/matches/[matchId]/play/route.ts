import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// POST /api/tournaments/:code/matches/:matchId/play — spustit/pokračovat v online zápase (jen hráč zápasu)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string; matchId: string }> },
) {
  const { code, matchId } = await params;

  const session = await getSession();
  if (!session?.osmaUserId) {
    return NextResponse.json({ error: 'Přihlas se, abys mohl hrát turnajový zápas.' }, { status: 401 });
  }

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/tournaments/${code}/matches/${matchId}/play`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Hub-Key': HUB_KEY,
      },
      body: JSON.stringify({ userId: session.osmaUserId }),
    });

    if (res.status === 404) {
      return NextResponse.json({ error: 'Turnaj nebo zápas nenalezen.' }, { status: 404 });
    }

    if (res.status === 403) {
      return NextResponse.json(
        { error: 'Tento zápas můžou spustit jen hráči přihlášení k daným týmům.' },
        { status: 403 },
      );
    }

    if (res.status === 409) {
      return NextResponse.json(
        { error: 'Zápas teď nejde spustit. Obnov stránku a zkontroluj stav turnaje.' },
        { status: 409 },
      );
    }

    if (!res.ok) {
      console.error('[tournaments/matches/play] hub API error:', res.status);
      return NextResponse.json({ error: 'Zápas se nepodařilo připravit. Zkus to znovu.' }, { status: 500 });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[tournaments/matches/play] POST error:', err);
    return NextResponse.json({ error: 'Zápas se nepodařilo připravit. Zkus to znovu.' }, { status: 500 });
  }
}
