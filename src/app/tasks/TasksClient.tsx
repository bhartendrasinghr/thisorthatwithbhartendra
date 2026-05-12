'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StatusPill, PriorityChip, Avatar, ProductBadge } from '@/components/atoms';
import { STATUSES, PRIORITIES, type Status, type Priority } from '@/lib/types';

type GroupBy = 'none' | 'priority' | 'product' | 'source' | 'owner' | 'status';

export default function TasksClient({ initialData }: { initialData: any }) {
  const { tasks, products, owners, sources } = initialData;
  const search = useSearchParams();

  const [groupBy, setGroupBy] = useState<GroupBy>('priority');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({
    priorities: [] as string[],
    statuses: [] as string[],
    products: [] as string[],
    owners: [] as string[],
    sources: [] as string[],
  });

  // honour ?source=... from URL
  useEffect(() => {
    const src = search.get('source');
    if (src) setFilters((f) => ({ ...f, sources: [src] }));
    const prod = search.get('product');
    if (prod) setFilters((f) => ({ ...f, products: [prod] }));
  }, [search]);

  const filtered = useMemo(() => {
    return tasks.filter((t: any) => {
      if (filters.priorities.length && !filters.priorities.includes(t.priority)) return false;
      if (filters.statuses.length && !filters.statuses.includes(t.status)) return false;
      if (filters.products.length && !filters.products.includes(t.product_id || '')) return false;
      if (filters.owners.length && !filters.owners.includes(t.owner_name || '')) return false;
      if (filters.sources.length && !filters.sources.includes(t.source_name || '')) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!`${t.task_id} ${t.title} ${t.update_note || ''}`.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [tasks, filters, q]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'All', items: filtered }];
    const keyFn = (t: any): string => {
      if (groupBy === 'priority') return t.priority;
      if (groupBy === 'status') return t.status;
      if (groupBy === 'product') return t.product_name || '— Unassigned —';
      if (groupBy === 'owner') return t.owner_name || '— Unassigned —';
      if (groupBy === 'source') return t.source_name || '— No source —';
      return '';
    };
    const m: Record<string, any[]> = {};
    for (const t of filtered) { const k = keyFn(t); (m[k] ||= []).push(t); }
    // Sort group keys
    const sorted = Object.keys(m).sort((a, b) => {
      if (groupBy === 'priority') return PRIORITIES.indexOf(a as any) - PRIORITIES.indexOf(b as any);
      if (groupBy === 'status') return STATUSES.indexOf(a as any) - STATUSES.indexOf(b as any);
      return a.localeCompare(b);
    });
    return sorted.map((k) => ({ key: k, items: m[k] }));
  }, [filtered, groupBy]);

  function toggle(field: keyof typeof filters, value: string) {
    setFilters((f) => {
      const has = f[field].includes(value);
      return { ...f, [field]: has ? f[field].filter((v) => v !== value) : [...f[field], value] };
    });
  }
  function clearAll() {
    setFilters({ priorities: [], statuses: [], products: [], owners: [], sources: [] });
    setQ('');
  }

  const activeCount =
    filters.priorities.length + filters.statuses.length + filters.products.length +
    filters.owners.length + filters.sources.length + (q ? 1 : 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl text-indigo">Tasks</h1>
          <div className="text-sm text-ink-3">{filtered.length} of {tasks.length} tasks shown</div>
        </div>
        <Link href="/tasks/new" className="btn-primary">+ Add task</Link>
      </div>

      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            placeholder="Search tasks…"
            value={q} onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <div className="text-xs text-ink-3">Group by:</div>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="text-xs">
            <option value="none">None</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="product">Product</option>
            <option value="owner">Owner</option>
            <option value="source">Source</option>
          </select>
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-indigo underline">
              Clear filters ({activeCount})
            </button>
          )}
        </div>

        <FilterRow label="Priority" values={PRIORITIES} selected={filters.priorities}
          onToggle={(v) => toggle('priorities', v)} />
        <FilterRow label="Status" values={STATUSES} selected={filters.statuses}
          onToggle={(v) => toggle('statuses', v)} />
        <FilterRow label="Product" values={products.map((p: any) => p.product_id)}
          labels={Object.fromEntries(products.map((p: any) => [p.product_id, p.name]))}
          selected={filters.products} onToggle={(v) => toggle('products', v)} />
        <FilterRow label="Owner" values={owners.map((o: any) => o.owner_name)}
          selected={filters.owners} onToggle={(v) => toggle('owners', v)} />
        <FilterRow label="Source" values={sources.map((s: any) => s.source_name)}
          selected={filters.sources} onToggle={(v) => toggle('sources', v)} />
      </div>

      {/* Grouped task list */}
      <div className="space-y-4">
        {grouped.map((g) => (
          <div key={g.key} className="card">
            <div className="px-4 py-2 border-b border-rule flex items-center justify-between bg-paper-2 rounded-t-xl">
              <div className="text-xs font-semibold text-ink-2 uppercase tracking-wider">{g.key}</div>
              <div className="text-xs text-ink-3 mono">{g.items.length}</div>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Product</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Source</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((t: any) => (
                  <tr key={t.task_id} className="cursor-pointer" onClick={() => location.href = `/tasks/${t.task_id}`}>
                    <td className="mono text-[11px] text-ink-3">{t.task_id}</td>
                    <td className="max-w-[400px]">
                      <div className="font-medium text-ink leading-snug line-clamp-2">{t.title}</div>
                    </td>
                    <td><ProductBadge name={t.product_name} color={t.product_color} /></td>
                    <td><PriorityChip priority={t.priority} /></td>
                    <td><StatusPill status={t.status} /></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Avatar initials={t.owner_initials} size={20} />
                        <span className="text-xs text-ink-2">{t.owner_name || '—'}</span>
                      </div>
                    </td>
                    <td className="text-xs text-ink-2">{t.source_name || '—'}</td>
                    <td className="mono text-xs">
                      {t.target_date ? new Date(t.target_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                        : <span className="text-ink-3 italic text-[10px]">{t.target_date_raw || '—'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-8 text-center text-ink-3">No tasks match the current filters.</div>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, values, labels, selected, onToggle }:
  { label: string; values: readonly string[]; labels?: Record<string, string>; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold w-16">{label}</div>
      {values.map((v) => {
        const active = selected.includes(v);
        return (
          <button key={v} onClick={() => onToggle(v)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              active ? 'bg-indigo text-white border-indigo' : 'bg-white border-rule text-ink-2 hover:bg-paper-2'
            }`}>
            {labels?.[v] || v}
          </button>
        );
      })}
    </div>
  );
}
