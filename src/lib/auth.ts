import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'tpp_session';
const SESSION_DAYS = 30;

function getPassword(): string {
  const p = process.env.TPP_PASSWORD;
  if (!p) throw new Error('TPP_PASSWORD env var is not set');
  return p;
}

function getSecret(): string {
  return process.env.TPP_SESSION_SECRET || getPassword();
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyPassword(password: string): boolean {
  if (typeof password !== 'string' || password.length === 0) return false;
  return safeEqual(password, getPassword());
}

export async function setSessionCookie(): Promise<void> {
  const issuedAt = Date.now().toString();
  const value = `${issuedAt}.${sign(issuedAt)}`;
  cookies().set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

export function verifySessionCookie(raw: string | undefined): boolean {
  if (!raw) return false;
  const [issuedAt, sig] = raw.split('.');
  if (!issuedAt || !sig) return false;
  return safeEqual(sig, sign(issuedAt));
}
