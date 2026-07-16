import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getTournamentFormat, getDefaultTeamNames } from '@/lib/tournaments/format';

const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

function isValidPlayerCount(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 2 && (v as number) <= 8;
}

// POST /api/tournaments — založení turnaje (jen přihlášený hráč)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.osmaUserId) {
    return NextResponse.json({ error: 'Přihlášení vyžadováno.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neplatný JSON.' }, { status: 400 });
  }

  const { name, playerCount } = body as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
    return NextResponse.json({ error: 'Název turnaje musí mít 2 až 60 znaků.' }, { status: 400 });
  }
  if (!isValidPlayerCount(playerCount)) {
    return NextResponse.json({ error: 'Počet hráčů musí být 2 až 8.' }, { status: 400 });
  }

  const format = getTournamentFormat(playerCount);
  const teams = getDefaultTeamNames(playerCount).map((teamName, i) => ({
    slotNumber: i + 1,
    name: teamName,
  }));

  try {
    const res = await fetch(`${HUB_URL}/api/osma-liga/tournaments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Project-Hub-Key': HUB_KEY,
      },
      body: JSON.stringify({
        name: name.trim(),
        playerCount,
        format,
        teams,
        createdByUserId: session.osmaUserId,
        createdByName: session.globalName ?? session.username,
      }),
    });

    if (!res.ok) {
      console.error('[tournaments] hub API error:', res.status);
      return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
    }

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('[tournaments] POST error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}
