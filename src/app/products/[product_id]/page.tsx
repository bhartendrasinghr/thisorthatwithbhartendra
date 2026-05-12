import { sql } from '@/lib/db';
import TopBar from '@/components/TopBar';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusPill, PriorityChip } from '@/components/atoms';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }: { params: { product_id: string } }) {
  const pid = decodeURIComponent(params.product_id);
  const { rows: products } = await sql`SELECT * FROM products WHERE product_id = ${pid};`;
  if (!products[0]) notFound();
  const product = products[0];
  const { rows: tasks } = await sql`
    SELECT * FROM tasks WHERE product_id = ${pid}
    ORDER BY CASE priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END, task_id;
  `;

  return (
    <>
      <TopBar crumbs={[{ label: 'Products', href: '/products' }, { label: product.name }]} />
      <div className="p-6 max-w-[1200px] mx-auto space-y-5">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: product.color || '#8a8da8' }} />
            <h1 className="font-serif text-3xl text-indigo">{product.name}</h1>
            <span className="mono text-xs text-ink-3">{product.product_id}</span>
          </div>
          <div className="text-sm text-ink-2">{product.tagline}</div>
          <div className="text-xs text-ink-3 mt-2">Lead: <span className="text-ink-2 font-medium">{product.lead || '—'}</span> · Team: <span className="text-ink-2">{product.team || '—'}</span></div>
        </div>

        <div className="card">
          <div className="px-4 py-2 border-b border-rule bg-paper-2 flex items-center justify-between rounded-t-xl">
            <div className="font-serif text-lg text-indigo">Tasks ({tasks.length})</div>
            <Link href={`/tasks?product=${pid}`} className="text-xs text-indigo underline">View in tasks page →</Link>
          </div>
          <table className="w-full">
            <thead><tr><th>ID</th><th>Title</th><th>Priority</th><th>Status</th><th>Owner</th><th>Target</th></tr></thead>
            <tbody>
              {tasks.map((t: any) => (
                <tr key={t.task_id} className="cursor-pointer" onClick={() => location.href = `/tasks/${t.task_id}`}>
                  <td className="mono text-[11px] text-ink-3">{t.task_id}</td>
                  <td className="max-w-[400px]"><div className="font-medium line-clamp-2">{t.title}</div></td>
                  <td><PriorityChip priority={t.priority} /></td>
                  <td><StatusPill status={t.status} /></td>
                  <td className="text-xs text-ink-2">{t.owner_name || '—'}</td>
                  <td className="mono text-xs">{t.target_date ? new Date(t.target_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : (t.target_date_raw || '—')}</td>
                </tr>
              ))}
              {tasks.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-ink-3 italic">No tasks under this product yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
