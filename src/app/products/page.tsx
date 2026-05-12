import { sql } from '@/lib/db';
import Link from 'next/link';
import TopBar from '@/components/TopBar';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const { rows: products } = await sql`
    SELECT p.*,
      COUNT(t.task_id)::int AS total,
      COUNT(t.task_id) FILTER (WHERE t.status='Live')::int AS live,
      COUNT(t.task_id) FILTER (WHERE t.status='Blocked')::int AS blocked,
      COUNT(t.task_id) FILTER (WHERE t.priority='P0' AND t.status!='Live')::int AS p0_open
    FROM products p LEFT JOIN tasks t ON t.product_id = p.product_id
    GROUP BY p.product_id ORDER BY p.name;
  `;
  return (
    <>
      <TopBar />
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl text-indigo">Products</h1>
          <Link href="/products/new" className="btn-primary">+ Add product</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <Link key={p.product_id} href={`/products/${p.product_id}`}
              className="card p-5 hover:border-indigo">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color || '#8a8da8' }} />
                <div className="font-serif text-xl text-indigo">{p.name}</div>
                <span className="ml-auto mono text-[10px] text-ink-3">{p.product_id}</span>
              </div>
              <div className="text-sm text-ink-3 mb-3">{p.tagline}</div>
              <div className="flex gap-4 text-xs">
                <Kpi label="Total" value={p.total} />
                <Kpi label="P0 open" value={p.p0_open} tone={p.p0_open > 0 ? 'red' : undefined} />
                <Kpi label="Blocked" value={p.blocked} tone={p.blocked > 0 ? 'red' : undefined} />
                <Kpi label="Live" value={p.live} tone="green" />
              </div>
              <div className="mt-3 text-xs text-ink-3">Lead: <span className="text-ink-2 font-medium">{p.lead || '—'}</span></div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: 'red' | 'green' }) {
  const color = tone === 'red' ? '#c62828' : tone === 'green' ? '#2e7d32' : '#1a1f6b';
  return (
    <div>
      <div className="text-[10px] uppercase text-ink-3">{label}</div>
      <div className="font-mono font-semibold text-lg" style={{ color }}>{value}</div>
    </div>
  );
}
