import { NextResponse } from 'next/server';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

// GET /api/training-challenges/active — active automatic training challenge, if any
export async function GET() {
  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/training-challenges/active`, {
      headers: { 'X-Project-Hub-Key': HUB_KEY },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ game: null });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[training-challenges/active] GET error:', err);
    return NextResponse.json({ game: null });
  }
}
