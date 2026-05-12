import { sql } from '@/lib/db';
import TopBar from '@/components/TopBar';
import TaskClient from './TaskClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getData(taskId: string) {
  const { rows: tasks } = await sql`
    SELECT t.*, p.name AS product_name, p.color AS product_color
    FROM tasks t LEFT JOIN products p ON t.product_id = p.product_id
    WHERE t.task_id = ${taskId};
  `;
  if (!tasks[0]) return null;
  const { rows: history } = await sql`SELECT * FROM task_history WHERE task_id = ${taskId} ORDER BY changed_at DESC LIMIT 50;`;
  const { rows: products } = await sql`SELECT * FROM products ORDER BY name;`;
  const { rows: owners } = await sql`SELECT * FROM owners ORDER BY owner_name;`;
  const { rows: sources } = await sql`SELECT * FROM sources ORDER BY source_name;`;
  return { task: tasks[0], history, products, owners, sources };
}

export default async function TaskDetailPage({ params }: { params: { task_id: string } }) {
  const data = await getData(decodeURIComponent(params.task_id));
  if (!data) notFound();
  return (
    <>
      <TopBar crumbs={[{ label: 'Tasks', href: '/tasks' }, { label: data.task.task_id }]} />
      <TaskClient data={data} />
    </>
  );
}
