import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { task_id: string } }) {
  const id = decodeURIComponent(params.task_id);
  const { rows } = await sql`
    SELECT t.*, p.name AS product_name, p.color AS product_color
    FROM tasks t LEFT JOIN products p ON t.product_id = p.product_id
    WHERE t.task_id = ${id};
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { rows: history } = await sql`
    SELECT * FROM task_history WHERE task_id = ${id} ORDER BY changed_at DESC LIMIT 50;
  `;
  return NextResponse.json({ task: rows[0], history });
}

export async function PATCH(req: Request, { params }: { params: { task_id: string } }) {
  const id = decodeURIComponent(params.task_id);
  const patch = await req.json();

  const { rows: existingRows } = await sql`SELECT * FROM tasks WHERE task_id = ${id};`;
  if (!existingRows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = existingRows[0];

  const fields = [
    'title','product_id','priority','status','size','owner_name','source_name',
    'target_date','target_date_raw','dependency','blockers','update_note','tags','description'
  ] as const;

  for (const f of fields) {
    if (patch[f] !== undefined && String(patch[f] ?? '') !== String(existing[f] ?? '')) {
      await sql`
        INSERT INTO task_history (task_id, field, old_value, new_value)
        VALUES (${id}, ${f}, ${existing[f] ?? null}, ${patch[f] ?? null});
      `;
    }
  }

  // build dynamic update — using individual conditional sets to keep @vercel/postgres happy
  const t = { ...existing, ...patch };
  await sql`
    UPDATE tasks SET
      title = ${t.title},
      product_id = ${t.product_id || null},
      priority = ${t.priority},
      status = ${t.status},
      size = ${t.size || null},
      owner_name = ${t.owner_name || null},
      source_name = ${t.source_name || null},
      target_date = ${t.target_date || null},
      target_date_raw = ${t.target_date_raw || null},
      dependency = ${t.dependency || null},
      blockers = ${t.blockers || null},
      update_note = ${t.update_note || null},
      tags = ${t.tags || null},
      description = ${t.description || null},
      updated_at = NOW()
    WHERE task_id = ${id};
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { task_id: string } }) {
  const id = decodeURIComponent(params.task_id);
  await sql`DELETE FROM tasks WHERE task_id = ${id};`;
  return NextResponse.json({ ok: true });
}
