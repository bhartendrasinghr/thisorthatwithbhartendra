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

export function Episodes({ episodes }: { episodes: Episode[] }) {
  if (!episodes.length) return null;
  return (
    <section id="episodes" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-ember-400">
              Latest episodes
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink-50 sm:text-5xl">
              Pulled straight from the channel.
            </h2>
            <p className="mt-4 text-ink-200">
              New conversations every week. Hit any card to open on YouTube.
            </p>
          </div>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-ink-200/20 px-5 py-2.5 text-sm font-medium text-ink-100 transition hover:border-ember-400 hover:text-ember-400"
          >
            View full library
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14" />
              <path d="m13 5 7 7-7 7" />
            </svg>
          </a>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {episodes.map((ep, i) => (
            <li key={ep.id || i}>
              <EpisodeCard episode={ep} index={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EpisodeCard({ episode, index }: { episode: Episode; index: number }) {
  return (
    <a
      href={episode.url}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-2xl border border-ink-200/10 bg-ink-700/30 transition hover:-translate-y-1 hover:border-ember-500/40 hover:bg-ink-700/50"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-ink-800">
        {episode.thumbnail ? (
          <Image
            src={episode.thumbnail}
            alt={episode.title}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ember-700/30 via-ink-700 to-ink-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-ink-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ember-400 backdrop-blur">
          Ep {String(index + 1).padStart(2, "0")}
        </div>
        <div className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-ember-500 text-ink-900 opacity-0 transition group-hover:opacity-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="space-y-2 p-5">
        <p className="text-xs uppercase tracking-wider text-ink-300">
          {formatDate(episode.publishedAt)}
        </p>
        <h3 className="line-clamp-2 font-display text-xl leading-snug text-ink-50">
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
