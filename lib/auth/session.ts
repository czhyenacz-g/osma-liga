import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.AUTH_SECRET ?? '';
const COOKIE_NAME = 'osma-session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dní

export interface OsmaSession {
  discordId: string;
  username: string;
  globalName: string | null;
  avatarUrl: string | null;
  osmaUserId: string | null;
}

function sign(payload: string): Buffer {
  return createHmac('sha256', SECRET).update(payload).digest();
}

export function encodeSession(data: OsmaSession): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = sign(payload).toString('hex');
  return `${payload}.${sig}`;
}

export function decodeSession(token: string): OsmaSession | null {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(sig, 'hex');
  } catch {
    return null;
  }
  if (sigBuf.length !== expected.length) return null;
  if (!timingSafeEqual(sigBuf, expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as OsmaSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<OsmaSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}
