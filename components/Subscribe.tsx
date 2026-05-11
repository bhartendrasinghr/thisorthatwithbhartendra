"use client";

import { useState } from "react";
import { CHANNEL_URL } from "@/lib/youtube";

type Status = "idle" | "submitting" | "ok" | "error";

const PLATFORMS = [
  {
    name: "YouTube",
    href: CHANNEL_URL,
    accent: "text-[#ff4040]",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.4V8.6L15.7 12l-5.9 3.4z" />
      </svg>
    )
  },
  {
    name: "Spotify",
    href: "https://open.spotify.com/search/This%20or%20That%20with%20Bhartendra",
    accent: "text-[#1ed760]",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.3a.75.75 0 0 1-1 .25c-2.8-1.7-6.4-2.1-10.6-1.1a.75.75 0 1 1-.3-1.5c4.6-1 8.5-.6 11.6 1.3.4.2.5.7.3 1.05zm1.5-3.3a.94.94 0 0 1-1.3.3c-3.2-2-8.1-2.6-11.9-1.4a.94.94 0 1 1-.55-1.8c4.4-1.3 9.7-.7 13.4 1.6.45.3.6.9.35 1.3zm.1-3.4c-3.8-2.3-10.2-2.5-13.9-1.4a1.1 1.1 0 1 1-.65-2.1c4.2-1.3 11.3-1 15.7 1.6a1.1 1.1 0 1 1-1.15 1.9z" />
      </svg>
    )
  },
  {
    name: "Apple Podcasts",
    href: "https://podcasts.apple.com/search?term=This%20or%20That%20with%20Bhartendra",
    accent: "text-[#b14cff]",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 0a12 12 0 0 0-2 23.8v-4.6c-2.7-.5-4.6-2.4-4.6-5.2 0-3.1 2.5-5.6 5.5-5.7v-2c-4 0-7.4 3.4-7.4 7.7 0 3.8 2.5 6.7 6 7.3v.3A12 12 0 0 0 12 0zm0 9.8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-1 11.4c0 .6.4 1 1 1s1-.4 1-1v-3.4a3 3 0 0 1-2 0v3.4z" />
      </svg>
    )
  },
  {
    name: "RSS",
    href: `https://www.youtube.com/feeds/videos.xml?user=ThisOrThatPodcastIndia`,
    accent: "text-ember-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M5 5v3a11 11 0 0 1 11 11h3A14 14 0 0 0 5 5zm0 6v3a5 5 0 0 1 5 5h3a8 8 0 0 0-8-8zm1.5 6.5a2 2 0 1 0 .01 4 2 2 0 0 0 0-4z" />
      </svg>
    )
  }
];

export function Subscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setTimeout(() => {
      setStatus("ok");
      setEmail("");
    }, 600);
  }

  return (
    <section
      id="subscribe"
      className="relative overflow-hidden border-t border-ink-200/10 py-24 sm:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-ember-600/15 blur-3xl" />
        <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 text-center sm:px-8">
        <p className="text-xs uppercase tracking-[0.22em] text-ember-400">
          Don't miss a drop
        </p>
        <h2 className="mt-3 font-display text-4xl leading-tight text-ink-50 sm:text-5xl">
          Listen, watch, and subscribe.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-200">
          New episode every week. Pick your favourite platform, or get a short
          email when a new one drops.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {PLATFORMS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-full border border-ink-200/15 bg-ink-800/40 px-4 py-2.5 text-sm font-medium text-ink-100 transition hover:-translate-y-0.5 hover:border-ink-200/30"
            >
              <span className={`h-4 w-4 ${p.accent}`}>{p.icon}</span>
              {p.name}
            </a>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-12 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error" || status === "ok") setStatus("idle");
            }}
            placeholder="you@inbox.com"
            className="flex-1 rounded-full border border-ink-200/15 bg-ink-800/60 px-5 py-3 text-sm text-ink-50 placeholder:text-ink-300 focus:border-ember-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-full bg-ember-500 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-ember-400 disabled:opacity-60"
          >
            {status === "submitting" ? "Adding…" : "Notify me"}
          </button>
        </form>
        <p
          role="status"
          aria-live="polite"
          className="mt-3 min-h-[1.25rem] text-xs"
        >
          {status === "ok" && (
            <span className="text-ember-400">
              You're on the list. Talk soon.
            </span>
          )}
          {status === "error" && (
            <span className="text-red-400">
              That email doesn't look right.
            </span>
          )}
        </p>
      </div>
    </section>
  );
}
