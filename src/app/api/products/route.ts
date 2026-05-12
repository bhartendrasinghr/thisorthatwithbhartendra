import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { rows } = await sql`
    SELECT p.*,
      COUNT(t.task_id) FILTER (WHERE t.task_id IS NOT NULL)::int AS task_count,
      COUNT(t.task_id) FILTER (WHERE t.status = 'Live')::int AS done_count,
      COUNT(t.task_id) FILTER (WHERE t.status = 'Blocked')::int AS blocked_count,
      COUNT(t.task_id) FILTER (WHERE t.priority = 'P0' AND t.status != 'Live')::int AS p0_open
    FROM products p
    LEFT JOIN tasks t ON t.product_id = p.product_id
    GROUP BY p.product_id
    ORDER BY p.name;
  `;
  return NextResponse.json({ products: rows });
}

export async function POST(req: Request) {
  const p = await req.json();
  await sql`
    INSERT INTO products (product_id, name, tagline, lead, team, color)
    VALUES (${p.product_id.toUpperCase().trim()}, ${p.name}, ${p.tagline || null},
            ${p.lead || null}, ${p.team || null}, ${p.color || null})
    ON CONFLICT (product_id) DO UPDATE
    SET name=EXCLUDED.name, tagline=EXCLUDED.tagline, lead=EXCLUDED.lead,
        team=EXCLUDED.team, color=EXCLUDED.color;
  `;
  return NextResponse.json({ ok: true });
}
