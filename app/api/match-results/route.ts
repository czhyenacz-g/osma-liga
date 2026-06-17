import { NextRequest, NextResponse } from 'next/server';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

function isValidScore(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 99;
}

function isValidDuration(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 30 && v <= 600;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatný JSON.' }, { status: 400 });
  }

  const { homeScore, awayScore, durationSeconds } = body as Record<string, unknown>;

  if (!isValidScore(homeScore) || !isValidScore(awayScore) || !isValidDuration(durationSeconds)) {
    return NextResponse.json(
      { error: 'Neplatný vstup. Skóre musí být 0–99, délka 30–600 sekund.' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/match-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Hub-Key': HUB_KEY,
      },
      body: JSON.stringify({
        homeScore,
        awayScore,
        durationSeconds: Math.round(durationSeconds as number),
      }),
    });

    if (!res.ok) {
      console.error('[match-results] hub API error:', res.status);
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const result = await res.json() as unknown;
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[match-results] POST error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 20);

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/match-results?limit=${limit}`, {
      headers: { 'X-Project-Hub-Key': HUB_KEY },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const results = await res.json() as unknown;
    return NextResponse.json(results);
  } catch (err) {
    console.error('[match-results] GET error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}
