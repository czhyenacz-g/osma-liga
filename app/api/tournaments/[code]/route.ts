import { NextRequest, NextResponse } from 'next/server';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// GET /api/tournaments/:code — detail turnaje
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/tournaments/${code}`, {
      headers: { 'X-Project-Hub-Key': HUB_KEY },
      cache: 'no-store',
    });

    if (res.status === 404) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[tournaments/code] GET error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}
