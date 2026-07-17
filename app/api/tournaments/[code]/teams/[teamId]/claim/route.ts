import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// POST /api/tournaments/:code/teams/:teamId/claim — zabrat volný tým (jen přihlášený hráč)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string; teamId: string }> },
) {
  const { code, teamId } = await params;

  const session = await getSession();
  if (!session?.osmaUserId) {
    return NextResponse.json({ error: 'Přihlášení vyžadováno.' }, { status: 401 });
  }

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/tournaments/${code}/teams/${teamId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Hub-Key': HUB_KEY,
      },
      body: JSON.stringify({ userId: session.osmaUserId }),
    });

    if (res.status === 404) {
      return NextResponse.json({ error: 'Turnaj nebo tým nenalezen.' }, { status: 404 });
    }

    if (res.status === 409) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      return NextResponse.json(
        { error: data?.error ?? 'Tým už je obsazený nebo už máš v turnaji jiný tým.' },
        { status: 409 },
      );
    }

    if (!res.ok) {
      console.error('[tournaments/claim] hub API error:', res.status);
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[tournaments/claim] POST error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}
