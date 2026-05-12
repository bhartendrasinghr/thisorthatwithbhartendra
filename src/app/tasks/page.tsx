import { Suspense } from 'react';
import { sql } from '@/lib/db';
import TopBar from '@/components/TopBar';
import TasksClient from './TasksClient';

export const dynamic = 'force-dynamic';

async function getData() {
  const tasks = await sql`
    SELECT t.*, p.name AS product_name, p.color AS product_color,
           o.initials AS owner_initials
    FROM tasks t
    LEFT JOIN products p ON t.product_id = p.product_id
    LEFT JOIN owners o ON t.owner_name = o.owner_name
    ORDER BY
      CASE t.priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
      CASE t.status WHEN 'Blocked' THEN 0 WHEN 'In Progress' THEN 1 WHEN 'UAT' THEN 2 WHEN 'Not Started' THEN 3 WHEN 'Live' THEN 4 END,
      t.task_id;
  `;
  const products = await sql`SELECT * FROM products ORDER BY name;`;
  const owners = await sql`SELECT * FROM owners ORDER BY owner_name;`;
  const sources = await sql`SELECT * FROM sources ORDER BY source_name;`;
  return { tasks: tasks.rows, products: products.rows, owners: owners.rows, sources: sources.rows };
}

export default async function TasksPage() {
  const data = await getData();
  return (
    <>
      <TopBar />
      <Suspense fallback={<div className="p-6 text-sm text-ink-3">Loading tasks…</div>}>
        <TasksClient initialData={data} />
      </Suspense>
    </>
  );
}
