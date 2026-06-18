import type { NextRequest } from 'next/server';

export function getRequestCountry(request: NextRequest): string | null {
  // In development (localhost), no geo header is present → return null (allowed)
  const country = request.headers.get('x-vercel-ip-country');
  return country ?? null;
}
