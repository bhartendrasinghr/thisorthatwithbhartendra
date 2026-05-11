"use client";

import { useMemo, useState } from "react";

type Pair = {
  id: string;
  left: string;
  right: string;
  theme: string;
};

const PAIRS: Pair[] = [
  { id: "p1", left: "Index funds", right: "Stock picking", theme: "Money" },
  { id: "p2", left: "Remote", right: "Office", theme: "Work" },
  { id: "p3", left: "Buy a home", right: "Rent forever", theme: "Life" },
  { id: "p4", left: "Hustle culture", right: "Slow living", theme: "Mindset" },
  { id: "p5", left: "Spend now", right: "Save now", theme: "Money" },
  { id: "p6", left: "Generalist", right: "Specialist", theme: "Career" }
];

export function ThisOrThat() {
  const [picks, setPicks] = useState<Record<string, "left" | "right">>({});
  const answered = Object.keys(picks).length;
  const progress = useMemo(
    () => Math.round((answered / PAIRS.length) * 100),
    [answered]
  );

  return (
    <section className="relative border-y border-ink-200/10 bg-ink-800/40 py-24 sm:py-28">
      <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-ember-400">
              Warm up
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink-50 sm:text-5xl">
              The show, in six small choices.
            </h2>
            <p className="mt-4 text-ink-200">
              Tap the side you'd defend at a dinner party. No right answer —
              just a feel for the kind of conversations the podcast lives in.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-200">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full bg-ember-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-xs text-ink-300">
              {answered}/{PAIRS.length}
            </span>
          </div>
        </div>

        <ul className="mt-14 grid gap-5 md:grid-cols-2">
          {PAIRS.map((pair) => {
            const choice = picks[pair.id];
            return (
              <li
                key={pair.id}
                className="group relative overflow-hidden rounded-2xl border border-ink-200/10 bg-ink-700/30 p-5 transition hover:border-ink-200/20"
              >
                <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-300">
                  <span>{pair.theme}</span>
                  {choice && (
                    <span className="rounded-full bg-ember-500/10 px-2 py-0.5 text-ember-400">
                      Picked: {choice === "left" ? pair.left : pair.right}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
                  <Choice
                    label={pair.left}
                    selected={choice === "left"}
                    dim={choice === "right"}
                    onClick={() =>
                      setPicks((p) => ({ ...p, [pair.id]: "left" }))
                    }
                  />
                  <div className="self-center font-display text-sm italic text-ink-300">
                    or
                  </div>
                  <Choice
                    label={pair.right}
                    selected={choice === "right"}
                    dim={choice === "left"}
                    onClick={() =>
                      setPicks((p) => ({ ...p, [pair.id]: "right" }))
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {answered === PAIRS.length && (
          <div className="mt-10 rounded-2xl border border-ember-500/30 bg-ember-500/5 p-6 text-center">
            <p className="font-display text-2xl text-ink-50">
              You'd love this show.
            </p>
            <p className="mt-2 text-sm text-ink-200">
              Hit play on the latest episode below — the conversations go
              exactly here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Choice({
  label,
  selected,
  dim,
  onClick
}: {
  label: string;
  selected: boolean;
  dim: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "rounded-xl border px-4 py-4 text-left text-base font-medium transition",
        selected
          ? "border-ember-500/60 bg-ember-500/10 text-ink-50 shadow-glow"
          : dim
            ? "border-ink-200/10 bg-transparent text-ink-300"
            : "border-ink-200/10 bg-ink-800/60 text-ink-100 hover:border-ink-200/30 hover:text-ink-50"
      ].join(" ")}
    >
      {label}
    </button>
  );
}
