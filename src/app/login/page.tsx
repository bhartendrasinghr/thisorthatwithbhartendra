'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/dashboard';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.push(next);
    else { setError('Incorrect password'); setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="password" autoFocus placeholder="Password"
        value={password} onChange={(e) => setPassword(e.target.value)}
        className="w-full"
      />
      {error && <div className="text-xs text-red-700">{error}</div>}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="font-serif text-3xl text-[var(--indigo)] mb-1">TPP Dashboard</div>
        <div className="text-sm text-[var(--ink-3)] mb-6">Enter password to continue</div>
        <Suspense fallback={<div className="text-xs text-ink-3">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
