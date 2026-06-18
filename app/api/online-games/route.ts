import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// GET /api/online-games?limit=10 — list her
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 30);

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/online-games?limit=${limit}`, {
      headers: { 'X-Project-Hub-Key': HUB_KEY },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[online-games] GET error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}

// POST /api/online-games — create game
export async function POST() {
  const session = await getSession();
  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/online-games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Hub-Key': HUB_KEY,
      },
      body: JSON.stringify({
        userId:     session?.osmaUserId ?? null,
        userName:   session?.globalName ?? session?.username ?? null,
        userAvatar: session?.avatarUrl ?? null,
      }),
    });

    if (!res.ok) {
      console.error('[online-games] hub API error:', res.status);
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('[online-games] POST error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}
