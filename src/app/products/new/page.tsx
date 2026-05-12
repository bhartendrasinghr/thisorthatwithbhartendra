'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({ product_id: '', name: '', tagline: '', lead: '', team: '', color: '#1A1F6B' });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product_id.trim() || !form.name.trim()) { alert('product_id and name are required'); return; }
    setSaving(true);
    const res = await fetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) router.push('/products');
    else alert('Failed');
  }

  return (
    <>
      <TopBar crumbs={[{ label: 'Products', href: '/products' }, { label: 'New' }]} />
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl text-indigo mb-1">New Product</h1>
        <form onSubmit={submit} className="card p-6 space-y-4 mt-4">
          <Field label="Product ID *">
            <input value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="w-full mono" placeholder="MOFIRST, RIISE, etc." required />
          </Field>
          <Field label="Name *">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" required />
          </Field>
          <Field label="Tagline">
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="w-full" />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Lead"><input value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })} className="w-full" /></Field>
            <Field label="Team"><input value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="w-full" /></Field>
            <Field label="Color"><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-10 p-1" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create product'}</button>
          </div>
        </form>
      </div>
    </>
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
