import Image from "next/image";
import type { Episode } from "@/lib/types";
import { CHANNEL_URL } from "@/lib/youtube";

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

export function Hero({ featured }: { featured: Episode }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-ember-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-grain opacity-50 mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-ink-900" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 sm:px-8 sm:pt-40 md:pb-32 md:pt-44">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ember-500/30 bg-ember-500/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ember-400">
              <span className="h-1.5 w-1.5 rounded-full bg-ember-500 animate-pulse" />
              New episode every week
            </div>

            <h1 className="mt-6 font-display text-5xl leading-[0.95] tracking-tight text-ink-50 sm:text-6xl md:text-7xl">
              This or
              <span className="inline-block">
                <span className="relative ml-3 italic text-ember-400">
                  That
                  <svg
                    aria-hidden
                    viewBox="0 0 220 18"
                    className="absolute -bottom-2 left-0 w-full"
                  >
                    <path
                      d="M3 14 C 60 4, 160 4, 217 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="text-ember-500"
                    />
                  </svg>
                </span>
              </span>
              <br />
              with Bhartendra.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-200 text-pretty">
              <span className="text-ink-50 font-medium">Beyond the noise.</span>{" "}
              Two choices. One honest conversation. A weekly podcast about the
              decisions shaping work, money, and life — minus the spin.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={featured.url}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-ember-500 px-6 py-3 text-sm font-semibold text-ink-900 shadow-glow transition hover:bg-ember-400"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-900/15">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                Play latest episode
              </a>
              <a
                href="#episodes"
                className="inline-flex items-center gap-2 rounded-full border border-ink-200/20 px-5 py-3 text-sm font-medium text-ink-100 transition hover:border-ink-100/40 hover:text-ink-50"
              >
                Browse all episodes
              </a>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-ink-200/10 pt-6">
              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-300">
                  Format
                </dt>
                <dd className="mt-1 text-sm text-ink-100">Long-form, unscripted</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-300">
                  Cadence
                </dt>
                <dd className="mt-1 text-sm text-ink-100">Weekly drops</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-300">
                  Watch on
                </dt>
                <dd className="mt-1 text-sm text-ink-100">
                  <a className="hover:text-ember-400" href={CHANNEL_URL} target="_blank" rel="noreferrer">
                    YouTube
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <FeaturedCard episode={featured} />
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ episode }: { episode: Episode }) {
  const hasThumb = Boolean(episode.thumbnail);
  return (
    <a
      href={episode.url}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-3xl border border-ink-200/10 bg-ink-700/40 backdrop-blur transition hover:border-ember-500/40"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-ink-800">
        {hasThumb ? (
          <Image
            src={episode.thumbnail}
            alt={episode.title}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ember-700/40 via-ink-700 to-ink-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent" />
        <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-ink-900/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ember-400 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-ember-500" />
          Featured
        </div>
        <div className="absolute bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-ember-500 text-ink-900 shadow-glow transition group-hover:scale-110">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="space-y-2 p-6">
        <p className="text-xs uppercase tracking-wider text-ink-300">
          {formatDate(episode.publishedAt)}
        </p>
        <h3 className="font-display text-2xl leading-tight text-ink-50">
          {episode.title}
        </h3>
        {episode.description && (
          <p className="line-clamp-2 text-sm text-ink-200">
            {episode.description}
          </p>
        )}
      </div>
    </a>
  );
}
