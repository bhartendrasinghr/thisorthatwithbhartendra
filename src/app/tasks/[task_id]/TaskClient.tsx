'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatusPill, PriorityChip, Avatar, ProductBadge } from '@/components/atoms';
import { STATUSES, PRIORITIES, SIZES } from '@/lib/types';

export default function TaskClient({ data }: { data: any }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [task, setTask] = useState(data.task);
  const [saving, setSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/tasks/${encodeURIComponent(task.task_id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    setSaving(false);
    if (res.ok) { setEditing(false); router.refresh(); }
    else alert('Save failed');
  }

  async function del() {
    if (!confirm(`Delete task ${task.task_id}? This cannot be undone.`)) return;
    const res = await fetch(`/api/tasks/${encodeURIComponent(task.task_id)}`, { method: 'DELETE' });
    if (res.ok) router.push('/tasks');
  }

  async function runSummary() {
    setAiLoading(true); setAiSummary('');
    const res = await fetch('/api/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'task_summary', task_id: task.task_id }),
    });
    const j = await res.json();
    setAiSummary(j.output || j.error || '');
    setAiLoading(false);
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="mono text-xs text-ink-3">{task.task_id}</span>
            <PriorityChip priority={task.priority} />
            <StatusPill status={task.status} />
            <ProductBadge name={task.product_name} color={task.product_color} />
          </div>
          {!editing ? (
            <h1 className="font-serif text-2xl text-ink leading-tight">{task.title}</h1>
          ) : (
            <input value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full text-lg font-serif" />
          )}
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button onClick={runSummary} disabled={aiLoading} className="btn-secondary">
                {aiLoading ? 'Summarising…' : 'AI summary'}
              </button>
              <button onClick={() => setEditing(true)} className="btn-secondary">Edit</button>
              <button onClick={del} className="btn-secondary text-red-700 border-red-200 hover:bg-red-50">Delete</button>
            </>
          ) : (
            <>
              <button onClick={() => { setEditing(false); setTask(data.task); }} className="btn-secondary">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
            </>
          )}
        </div>
      </div>

      {aiSummary && (
        <div className="card p-4 bg-paper-2">
          <div className="text-xs font-semibold text-indigo uppercase tracking-wider mb-2">AI Summary</div>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{aiSummary}</div>
        </div>
      )}

      {/* Properties grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 card p-5">
        <Prop label="Priority" editing={editing}
          view={<PriorityChip priority={task.priority} />}
          edit={<select value={task.priority} onChange={(e) => setTask({ ...task, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>} />
        <Prop label="Status" editing={editing}
          view={<StatusPill status={task.status} />}
          edit={<select value={task.status} onChange={(e) => setTask({ ...task, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>} />
        <Prop label="Size" editing={editing}
          view={<span className="text-sm">{task.size || '—'}</span>}
          edit={<select value={task.size || ''} onChange={(e) => setTask({ ...task, size: e.target.value || null })}>
            <option value="">—</option>{SIZES.map((s) => <option key={s}>{s}</option>)}
          </select>} />
        <Prop label="Target date" editing={editing}
          view={<span className="text-sm mono">{task.target_date ? new Date(task.target_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (task.target_date_raw || '—')}</span>}
          edit={<input type="date" value={task.target_date?.slice(0, 10) || ''} onChange={(e) => setTask({ ...task, target_date: e.target.value || null })} />} />
        <Prop label="Owner" editing={editing}
          view={<span className="text-sm">{task.owner_name || '—'}</span>}
          edit={<select value={task.owner_name || ''} onChange={(e) => setTask({ ...task, owner_name: e.target.value || null })}>
            <option value="">—</option>{data.owners.map((o: any) => <option key={o.owner_name}>{o.owner_name}</option>)}
          </select>} />
        <Prop label="Product" editing={editing}
          view={<span className="text-sm">{task.product_name || '—'}</span>}
          edit={<select value={task.product_id || ''} onChange={(e) => setTask({ ...task, product_id: e.target.value || null })}>
            <option value="">—</option>{data.products.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
          </select>} />
        <Prop label="Source" editing={editing}
          view={<span className="text-sm">{task.source_name || '—'}</span>}
          edit={<select value={task.source_name || ''} onChange={(e) => setTask({ ...task, source_name: e.target.value || null })}>
            <option value="">—</option>{data.sources.map((s: any) => <option key={s.source_name}>{s.source_name}</option>)}
          </select>} />
        <Prop label="Tags" editing={editing}
          view={<span className="text-sm text-ink-2">{task.tags || '—'}</span>}
          edit={<input value={task.tags || ''} onChange={(e) => setTask({ ...task, tags: e.target.value })} placeholder="comma,separated,tags" />} />
      </div>

      {/* Description / update_note / blockers */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-2">Description</div>
          {!editing ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{task.description || <span className="text-ink-3 italic">No description</span>}</div>
          ) : (
            <textarea rows={6} value={task.description || ''}
              onChange={(e) => setTask({ ...task, description: e.target.value })} className="w-full" />
          )}
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-2">Latest update</div>
            {!editing ? (
              <div className="text-sm whitespace-pre-wrap">{task.update_note || <span className="text-ink-3 italic">No update yet</span>}</div>
            ) : (
              <textarea rows={3} value={task.update_note || ''}
                onChange={(e) => setTask({ ...task, update_note: e.target.value })} className="w-full" />
            )}
          </div>
          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-2">Blockers</div>
            {!editing ? (
              <div className="text-sm whitespace-pre-wrap">{task.blockers || <span className="text-ink-3 italic">None</span>}</div>
            ) : (
              <textarea rows={2} value={task.blockers || ''}
                onChange={(e) => setTask({ ...task, blockers: e.target.value })} className="w-full" />
            )}
          </div>
          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-2">Dependency</div>
            {!editing ? (
              <div className="text-sm whitespace-pre-wrap">{task.dependency || <span className="text-ink-3 italic">None</span>}</div>
            ) : (
              <input value={task.dependency || ''} onChange={(e) => setTask({ ...task, dependency: e.target.value })} className="w-full" />
            )}
          </div>
        </div>
      </div>

      {/* History */}
      {data.history.length > 0 && (
        <div className="card p-5">
          <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-3">Change history</div>
          <div className="space-y-2">
            {data.history.map((h: any) => (
              <div key={h.id} className="flex items-start gap-3 text-xs">
                <span className="mono text-ink-3 w-32 shrink-0">
                  {new Date(h.changed_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-semibold text-ink-2 w-24 shrink-0">{h.field}</span>
                <span className="text-ink-3">{h.old_value || '∅'}</span>
                <span className="text-ink-3">→</span>
                <span className="text-ink">{h.new_value || '∅'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Prop({ label, view, edit, editing }: { label: string; view: React.ReactNode; edit: React.ReactNode; editing: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold mb-1">{label}</div>
      {editing ? edit : view}
    </div>
  );
}
