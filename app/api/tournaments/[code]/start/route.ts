import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// POST /api/tournaments/:code/start — spustit turnaj (jen zakladatel)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const session = await getSession();
  if (!session?.osmaUserId) {
    return NextResponse.json({ error: 'Přihlášení vyžadováno.' }, { status: 401 });
  }

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/tournaments/${code}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Hub-Key': HUB_KEY,
      },
      body: JSON.stringify({ userId: session.osmaUserId }),
    });

    if (res.status === 404) {
      return NextResponse.json({ error: 'Turnaj nenalezen.' }, { status: 404 });
    }

    if (res.status === 403) {
      return NextResponse.json({ error: 'Turnaj může spustit jen jeho zakladatel.' }, { status: 403 });
    }

    if (res.status === 409) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      return NextResponse.json(
        { error: data?.error ?? 'Turnaj zatím nejde spustit. Zkontroluj obsazení týmů.' },
        { status: 409 },
      );
    }

    if (!res.ok) {
      console.error('[tournaments/start] hub API error:', res.status);
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[tournaments/start] POST error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}
