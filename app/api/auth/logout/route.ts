import { NextResponse } from 'next/server';

const BASE_URL = process.env.AUTH_URL ?? 'http://localhost:3000';

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL('/', BASE_URL), { status: 303 });
  response.cookies.delete('osma-session');
  return response;
}
