import { CHANNEL_URL } from "@/lib/youtube";

export function Footer() {
  return (
    <footer className="border-t border-ink-200/10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 text-sm text-ink-300 sm:flex-row sm:items-center sm:px-8">
        <div>
          <p className="font-display text-base italic text-ink-100">
            This or That with Bhartendra
          </p>
          <p className="mt-1 text-xs">Beyond the noise &middot; A weekly podcast</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a className="hover:text-ember-400" href="#episodes">
            Episodes
          </a>
          <a className="hover:text-ember-400" href="#about">
            About
          </a>
          <a className="hover:text-ember-400" href="#subscribe">
            Subscribe
          </a>
          <a
            className="hover:text-ember-400"
            href={CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
          >
            YouTube
          </a>
        </div>
        <p className="text-xs text-ink-300">
          &copy; {new Date().getFullYear()} Bhartendra Singh
        </p>
      </div>
    </footer>
  );
}
