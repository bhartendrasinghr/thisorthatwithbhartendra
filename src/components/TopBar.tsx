'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function TopBar({ crumbs }: { crumbs?: { label: string; href?: string }[] }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const nav = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Tasks', href: '/tasks' },
    { label: 'Products', href: '/products' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-rule px-6 h-[52px] flex items-center gap-6">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gold" />
        <span className="font-serif text-lg text-indigo">TPP Dashboard</span>
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        {nav.map((n) => (
          <Link key={n.href} href={n.href}
            className={`px-3 py-1.5 rounded-md ${path === n.href || path?.startsWith(n.href + '/') ? 'bg-paper-3 text-indigo font-semibold' : 'text-ink-2 hover:bg-paper-2'}`}>
            {n.label}
          </Link>
        ))}
      </nav>
      {crumbs && crumbs.length > 0 && (
        <div className="text-xs text-ink-3 hidden md:flex items-center gap-1.5">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>›</span>}
              {c.href ? <Link href={c.href} className="hover:text-indigo">{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </div>
      )}
      <div className="ml-auto flex items-center gap-2">
        <button onClick={logout} className="btn-secondary text-xs">Logout</button>
      </div>
    </header>
  );
}
