import Link from 'next/link';
import { sql } from '@/lib/db';
import TopBar from '@/components/TopBar';
import { StatusPill, PriorityChip, ProductBadge } from '@/components/atoms';
import type { Status, Priority } from '@/lib/types';

export const dynamic = 'force-dynamic';

type TaskRow = {
  task_id: string;
  title: string;
  priority: Priority;
  status: Status;
  owner_name: string | null;
  source_name: string | null;
  target_date: string | null;
  target_date_raw: string | null;
  update_note: string | null;
  product_name: string | null;
  product_color: string | null;
};

async function getData() {
  const tasksRes = await sql`
    SELECT t.*, p.name AS product_name, p.color AS product_color
    FROM tasks t LEFT JOIN products p ON t.product_id = p.product_id
    ORDER BY
      CASE t.priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
      CASE t.status WHEN 'Blocked' THEN 0 WHEN 'In Progress' THEN 1 WHEN 'UAT' THEN 2 WHEN 'Not Started' THEN 3 WHEN 'Live' THEN 4 END,
      t.task_id;
  `;
  const productsRes = await sql`
    SELECT p.*,
      COUNT(t.task_id)::int AS total,
      COUNT(t.task_id) FILTER (WHERE t.status = 'Live')::int AS live,
      COUNT(t.task_id) FILTER (WHERE t.status = 'Blocked')::int AS blocked,
      COUNT(t.task_id) FILTER (WHERE t.priority = 'P0' AND t.status != 'Live')::int AS p0_open
    FROM products p LEFT JOIN tasks t ON t.product_id = p.product_id
    GROUP BY p.product_id ORDER BY p.name;
  `;
  return { tasks: tasksRes.rows as TaskRow[], products: productsRes.rows as any[] };
}

export default async function DashboardPage() {
  let data: { tasks: TaskRow[]; products: any[] } | null = null;
  let error: string | null = null;
  try {
    data = await getData();
  } catch (e: any) {
    error = e?.message || 'Failed to load dashboard data';
  }

  return (
    <>
      <TopBar />
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl text-indigo">Dashboard</h1>
            <div className="text-sm text-ink-3">Portfolio at a glance</div>
          </div>
          <div className="flex gap-2">
            <Link href="/tasks/new" className="btn-primary">+ New task</Link>
            <Link href="/tasks" className="btn-secondary">All tasks</Link>
          </div>
        </div>

        {error && (
          <div className="card p-5 border-red-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-red-700 mb-1">Database not ready</div>
            <div className="text-sm text-ink-2">{error}</div>
            <div className="text-xs text-ink-3 mt-2">
              Configure <code className="mono">POSTGRES_URL</code> then POST to <code className="mono">/api/seed</code> to bootstrap tables.
            </div>
          </div>
        )}

        {data && <DashboardBody {...data} />}
      </div>
    </>
  );
}

function DashboardBody({ tasks, products }: { tasks: TaskRow[]; products: any[] }) {
  const open = tasks.filter((t) => t.status !== 'Live');
  const p0Open = open.filter((t) => t.priority === 'P0');
  const blocked = tasks.filter((t) => t.status === 'Blocked');
  const inProgress = tasks.filter((t) => t.status === 'In Progress');
  const live = tasks.filter((t) => t.status === 'Live');
  const upNext = open.slice(0, 8);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Open" value={open.length} />
        <Kpi label="P0 open" value={p0Open.length} tone={p0Open.length > 0 ? 'red' : undefined} />
        <Kpi label="Blocked" value={blocked.length} tone={blocked.length > 0 ? 'red' : undefined} />
        <Kpi label="In progress" value={inProgress.length} />
        <Kpi label="Live" value={live.length} tone="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="px-4 py-2 border-b border-rule bg-paper-2 flex items-center justify-between rounded-t-xl">
            <div className="font-serif text-lg text-indigo">Up next</div>
            <Link href="/tasks" className="text-xs text-indigo underline">View all →</Link>
          </div>
          <table className="w-full">
            <thead>
              <tr><th>ID</th><th>Title</th><th>Product</th><th>Priority</th><th>Status</th><th>Target</th></tr>
            </thead>
            <tbody>
              {upNext.map((t) => (
                <tr key={t.task_id} className="cursor-pointer">
                  <td className="mono text-[11px] text-ink-3">
                    <Link href={`/tasks/${t.task_id}`}>{t.task_id}</Link>
                  </td>
                  <td className="max-w-[420px]">
                    <Link href={`/tasks/${t.task_id}`} className="font-medium text-ink leading-snug line-clamp-2">{t.title}</Link>
                  </td>
                  <td><ProductBadge name={t.product_name} color={t.product_color} /></td>
                  <td><PriorityChip priority={t.priority} /></td>
                  <td><StatusPill status={t.status} /></td>
                  <td className="mono text-xs">
                    {t.target_date
                      ? new Date(t.target_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                      : <span className="text-ink-3 italic text-[10px]">{t.target_date_raw || '—'}</span>}
                  </td>
                </tr>
              ))}
              {upNext.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-ink-3 italic">Nothing open — enjoy the calm.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="px-4 py-2 border-b border-rule bg-paper-2 flex items-center justify-between rounded-t-xl">
            <div className="font-serif text-lg text-indigo">Products</div>
            <Link href="/products" className="text-xs text-indigo underline">View all →</Link>
          </div>
          <div className="divide-y divide-rule">
            {products.map((p) => (
              <Link key={p.product_id} href={`/products/${p.product_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper-2">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color || '#8a8da8' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{p.name}</div>
                  <div className="text-[11px] text-ink-3 truncate">{p.tagline}</div>
                </div>
                <div className="text-[11px] mono text-ink-3">{p.total}</div>
                {p.p0_open > 0 && <span className="text-[10px] font-bold text-red-700">P0×{p.p0_open}</span>}
              </Link>
            ))}
            {products.length === 0 && <div className="px-4 py-6 text-center text-ink-3 italic text-sm">No products yet.</div>}
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: 'red' | 'green' }) {
  const color = tone === 'red' ? '#c62828' : tone === 'green' ? '#2e7d32' : '#1a1f6b';
  return (
    <div className="card p-4">
      <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">{label}</div>
      <div className="font-mono font-semibold text-2xl" style={{ color }}>{value}</div>
    </div>
  );
}
