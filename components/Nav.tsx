import Link from "next/link";
import { CHANNEL_URL } from "@/lib/youtube";

export function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 text-sm font-medium tracking-wider uppercase text-ink-100"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full border border-ember-500/40 bg-ember-500/10 text-ember-400 transition group-hover:bg-ember-500/20">
            <span className="font-display text-base italic">T</span>
          </span>
          <span className="hidden sm:inline">This or That</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-ink-200 md:flex">
          <a href="#episodes" className="hover:text-ember-400 transition">
            Episodes
          </a>
          <a href="#about" className="hover:text-ember-400 transition">
            About
          </a>
          <a href="#subscribe" className="hover:text-ember-400 transition">
            Subscribe
          </a>
        </nav>
        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-ink-200/20 px-4 py-2 text-xs font-medium uppercase tracking-wider text-ink-100 transition hover:border-ember-400 hover:text-ember-400"
        >
          Watch on YouTube
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      </div>
    </header>
  );
}
