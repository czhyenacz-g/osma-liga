import { NextRequest, NextResponse } from 'next/server';
import { encodeSession, SESSION_MAX_AGE } from '@/lib/auth/session';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? '';
const BASE_URL = process.env.AUTH_URL ?? 'http://localhost:3000';
const HUB_URL = process.env.PROJECT_HUB_API_URL ?? 'http://localhost:3001';
const HUB_KEY = process.env.PROJECT_HUB_API_KEY ?? '';

type DiscordProfile = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('oauth-state')?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/?auth=error', BASE_URL));
  }

  // Výměna code za access token
  let accessToken: string;
  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${BASE_URL}/api/auth/callback`,
      }),
    });
    if (!tokenRes.ok) throw new Error(`Discord token error: ${tokenRes.status}`);
    const data = await tokenRes.json() as { access_token: string };
    accessToken = data.access_token;
  } catch {
    return NextResponse.redirect(new URL('/?auth=error', BASE_URL));
  }

  // Načtení Discord profilu
  let profile: DiscordProfile;
  try {
    const profileRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) throw new Error(`Discord profile error: ${profileRes.status}`);
    profile = await profileRes.json() as DiscordProfile;
  } catch {
    return NextResponse.redirect(new URL('/?auth=error', BASE_URL));
  }

  const avatarUrl = profile.avatar
    ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=64`
    : null;

  // Upsert uživatele v project-hub-api (non-blocking)
  let osmaUserId: string | null = null;
  try {
    const upsertRes = await fetch(`${HUB_URL}/api/osma-liga/users/discord-upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-project-hub-key': HUB_KEY,
      },
      body: JSON.stringify({
        discordId: profile.id,
        username: profile.username,
        globalName: profile.global_name ?? null,
        avatar: profile.avatar ?? null,
      }),
    });
    if (upsertRes.ok) {
      const user = await upsertRes.json() as { id: string };
      osmaUserId = user.id;
    }
  } catch {
    // Přihlášení pokračuje i bez úspěšného upsert
  }

  const token = encodeSession({
    discordId: profile.id,
    username: profile.username,
    globalName: profile.global_name ?? null,
    avatarUrl,
    osmaUserId,
  });

  const response = NextResponse.redirect(new URL('/', BASE_URL));
  response.cookies.delete('oauth-state');
  response.cookies.set('osma-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return response;
}
