import { NextResponse } from 'next/server';
import { verifyPassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!verifyPassword(password)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await setSessionCookie();
  return NextResponse.json({ ok: true });
}
