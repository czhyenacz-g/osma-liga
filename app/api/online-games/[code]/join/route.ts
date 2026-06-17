import { NextRequest, NextResponse } from 'next/server';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// POST /api/online-games/:code/join — join as guest
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/online-games/${code}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Hub-Key': HUB_KEY,
      },
      body: JSON.stringify({}),
    });

    if (res.status === 404) {
      return NextResponse.json({ error: 'Online game not found' }, { status: 404 });
    }

    if (res.status === 409) {
      return NextResponse.json({ error: 'Game is full' }, { status: 409 });
    }

    if (!res.ok) {
      console.error('[online-games/join] hub API error:', res.status);
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[online-games/join] POST error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}
