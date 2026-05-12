'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STATUSES, PRIORITIES, SIZES } from '@/lib/types';

export default function NewTaskClient({ products, owners, sources }: any) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    task_id: '', title: '', product_id: '', priority: 'P1', status: 'Not Started',
    size: '', owner_name: '', source_name: '', target_date: '', dependency: '',
    blockers: '', update_note: '', tags: '', description: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { alert('Title is required'); return; }
    setSaving(true);
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    setSaving(false);
    if (res.ok) router.push(`/tasks/${encodeURIComponent(j.task_id)}`);
    else alert('Failed: ' + (j.error || 'unknown'));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl text-indigo mb-1">New Task</h1>
      <div className="text-sm text-ink-3 mb-6">Fill in the details. Task ID is auto-generated if you leave it blank.</div>
      <form onSubmit={submit} className="card p-6 space-y-4">
        <Field label="Title *">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full" placeholder="Short, action-oriented title" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Task ID (optional)">
            <input value={form.task_id} onChange={(e) => setForm({ ...form, task_id: e.target.value })}
              className="w-full" placeholder="auto-generated if blank" />
          </Field>
          <Field label="Product">
            <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full">
              <option value="">— None —</option>
              {products.map((p: any) => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Priority *">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full">
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Status *">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Size">
            <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full">
              <option value="">—</option>{SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Target date">
            <input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} className="w-full" />
          </Field>
          <Field label="Owner">
            <select value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="w-full">
              <option value="">—</option>{owners.map((o: any) => <option key={o.owner_name}>{o.owner_name}</option>)}
            </select>
          </Field>
          <Field label="Source">
            <select value={form.source_name} onChange={(e) => setForm({ ...form, source_name: e.target.value })} className="w-full">
              <option value="">—</option>{sources.map((s: any) => <option key={s.source_name}>{s.source_name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Update note">
          <textarea rows={2} value={form.update_note} onChange={(e) => setForm({ ...form, update_note: e.target.value })} className="w-full" />
        </Field>
        <Field label="Description">
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full" />
        </Field>
        <Field label="Tags">
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full" placeholder="comma,separated" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create task'}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold mb-1">{label}</div>
      {children}
    </label>
  );
}
