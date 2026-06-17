import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function matchComment(homeScore: number, awayScore: number): string {
  if (homeScore > awayScore) return 'Postupujeme. Nikdo neví proč.';
  if (awayScore > homeScore) return 'Dneska nás zařízl trávník.';
  return 'Bod je bod. Hlavně že se nikdo neptá.';
}

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
    const result = await prisma.matchResult.create({
      data: {
        homeTeamSlug: 'nahoda-fc',
        homeTeamName: 'Náhoda FC',
        awayTeamSlug: 'fk-parezov',
        awayTeamName: 'FK Pařezov',
        homeScore,
        awayScore,
        mode: 'singleplayer',
        durationSeconds: Math.round(durationSeconds),
        matchComment: matchComment(homeScore, awayScore),
        playedAt: new Date(),
      },
    });
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
    const results = await prisma.matchResult.findMany({
      orderBy: { playedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        homeTeamName: true,
        awayTeamName: true,
        homeScore: true,
        awayScore: true,
        mode: true,
        matchComment: true,
        playedAt: true,
      },
    });
    return NextResponse.json(results);
  } catch (err) {
    console.error('[match-results] GET error:', err);
    return NextResponse.json({ error: 'Chyba serveru.' }, { status: 500 });
  }
}
