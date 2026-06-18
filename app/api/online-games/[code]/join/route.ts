import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// POST /api/online-games/:code/join — join as guest
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const session = await getSession();
  let clubId: string | null = null;
  try {
    const body = await req.json() as { clubId?: string | null };
    clubId = typeof body.clubId === 'string' ? body.clubId : null;
  } catch {
    // no body — ok
  }

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/online-games/${code}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Hub-Key': HUB_KEY,
      },
      body: JSON.stringify({
        userId:     session?.osmaUserId ?? null,
        userName:   session?.globalName ?? session?.username ?? null,
        userAvatar: session?.avatarUrl ?? null,
        clubId,
      }),
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
