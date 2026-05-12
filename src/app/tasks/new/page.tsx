import { sql } from '@/lib/db';
import TopBar from '@/components/TopBar';
import NewTaskClient from './NewTaskClient';

export const dynamic = 'force-dynamic';

async function getData() {
  const { rows: products } = await sql`SELECT * FROM products ORDER BY name;`;
  const { rows: owners } = await sql`SELECT * FROM owners ORDER BY owner_name;`;
  const { rows: sources } = await sql`SELECT * FROM sources ORDER BY source_name;`;
  return { products, owners, sources };
}

export default async function NewTaskPage() {
  const data = await getData();
  return (
    <>
      <TopBar crumbs={[{ label: 'Tasks', href: '/tasks' }, { label: 'New' }]} />
      <NewTaskClient {...data} />
    </>
  );
}
