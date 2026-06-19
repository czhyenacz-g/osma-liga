import { NextResponse } from 'next/server';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// GET /api/online-games/looking-for-opponent — active homepage callout, if any
export async function GET() {
  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/online-games/looking-for-opponent`, {
      headers: { 'X-Project-Hub-Key': HUB_KEY },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ game: null });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[online-games/looking-for-opponent] GET error:', err);
    return NextResponse.json({ game: null });
  }
}
