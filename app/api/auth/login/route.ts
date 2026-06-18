import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? '';
const BASE_URL = process.env.AUTH_URL ?? 'http://localhost:3000';

export async function GET(): Promise<NextResponse> {
  const state = randomBytes(16).toString('hex');
  const redirectUri = `${BASE_URL}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
    state,
  });

  const response = NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`,
  );

  response.cookies.set('oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  });

  return response;
}
