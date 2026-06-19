import { NextRequest, NextResponse } from 'next/server';
import { getRequestCountry } from '@/lib/geo/getRequestCountry';
import { isEuCountry } from '@/lib/geo/euCountries';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// POST /api/online-games/:code/looking-for-opponent — post a "looking for opponent" callout
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!isEuCountry(getRequestCountry(req))) {
    return NextResponse.json({ error: 'Region not supported' }, { status: 403 });
  }

  let playerToken: string | null = null;
  try {
    const body = await req.json() as { playerToken?: string };
    playerToken = typeof body.playerToken === 'string' ? body.playerToken : null;
  } catch {
    // no body
  }
  if (!playerToken) {
    return NextResponse.json({ error: 'Missing player token' }, { status: 400 });
  }

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/online-games/${code}/looking-for-opponent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Hub-Key': HUB_KEY,
      },
      body: JSON.stringify({ playerToken }),
    });

    if (res.status === 404) {
      return NextResponse.json({ error: 'Online game not found' }, { status: 404 });
    }
    if (res.status === 403) {
      return NextResponse.json({ error: 'Only the host can post a callout' }, { status: 403 });
    }
    if (res.status === 409) {
      return NextResponse.json({ error: 'Game is not waiting for opponent' }, { status: 409 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[online-games/looking-for-opponent] POST error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}
