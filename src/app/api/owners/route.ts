import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { rows } = await sql`SELECT * FROM owners ORDER BY owner_name;`;
  return NextResponse.json({ owners: rows });
}

export async function POST(req: Request) {
  const o = await req.json();
  await sql`
    INSERT INTO owners (owner_name, initials, email, team)
    VALUES (${o.owner_name}, ${o.initials || null}, ${o.email || null}, ${o.team || null})
    ON CONFLICT (owner_name) DO UPDATE
    SET initials=EXCLUDED.initials, email=EXCLUDED.email, team=EXCLUDED.team;
  `;
  return NextResponse.json({ ok: true });
}
