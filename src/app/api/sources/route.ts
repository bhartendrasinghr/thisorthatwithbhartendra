import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { rows } = await sql`SELECT * FROM sources ORDER BY source_name;`;
  return NextResponse.json({ sources: rows });
}

export async function POST(req: Request) {
  const s = await req.json();
  await sql`
    INSERT INTO sources (source_name, description)
    VALUES (${s.source_name}, ${s.description || null})
    ON CONFLICT (source_name) DO UPDATE SET description=EXCLUDED.description;
  `;
  return NextResponse.json({ ok: true });
}
