import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { rows } = await sql`
    SELECT t.*, p.name AS product_name, p.color AS product_color
    FROM tasks t
    LEFT JOIN products p ON t.product_id = p.product_id
    ORDER BY
      CASE t.priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
      CASE t.status WHEN 'Blocked' THEN 0 WHEN 'In Progress' THEN 1 WHEN 'UAT' THEN 2 WHEN 'Not Started' THEN 3 WHEN 'Live' THEN 4 END,
      t.task_id;
  `;
  return NextResponse.json({ tasks: rows });
}

export async function POST(req: Request) {
  const t = await req.json();
  // auto-generate task_id if missing
  let tid = t.task_id?.trim();
  if (!tid) {
    const { rows } = await sql`SELECT task_id FROM tasks WHERE task_id LIKE 'T-%' ORDER BY task_id DESC LIMIT 1;`;
    const n = rows[0] ? parseInt(rows[0].task_id.split('-')[1], 10) + 1 : 1;
    tid = `T-${String(n).padStart(3, '0')}`;
  }
  await sql`
    INSERT INTO tasks (
      task_id, title, product_id, priority, status, size, owner_name, source_name,
      target_date, target_date_raw, dependency, blockers, update_note, tags, description
    ) VALUES (
      ${tid}, ${t.title}, ${t.product_id || null}, ${t.priority}, ${t.status}, ${t.size || null},
      ${t.owner_name || null}, ${t.source_name || null},
      ${t.target_date || null}, ${t.target_date_raw || null},
      ${t.dependency || null}, ${t.blockers || null}, ${t.update_note || null},
      ${t.tags || null}, ${t.description || null}
    );
  `;
  return NextResponse.json({ ok: true, task_id: tid });
}
