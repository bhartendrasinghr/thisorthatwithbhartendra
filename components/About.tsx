export function About() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative">
            <div className="relative mx-auto aspect-[4/5] max-w-sm overflow-hidden rounded-3xl border border-ink-200/10 bg-gradient-to-br from-ember-700/30 via-ink-700 to-ink-900">
              <div className="absolute inset-0 bg-grain opacity-30 mix-blend-overlay" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-display text-3xl italic text-ink-50">
                  Bhartendra Singh
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ember-400">
                  Host &middot; This or That
                </p>
              </div>
              <div className="absolute right-6 top-6 grid h-12 w-12 place-items-center rounded-full border border-ember-500/40 bg-ink-900/40 text-ember-400 backdrop-blur">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <path d="M12 18v3" />
                </svg>
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-ember-500/10 blur-3xl" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-ember-400">
              About the host
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink-50 sm:text-5xl">
              Sixteen years of watching what actually moves the needle.
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-200">
              <p>
                Bhartendra is a product and marketing professional with{" "}
                <span className="text-ink-50 font-medium">
                  16+ years in BFSI
                </span>
                , spent building digital platforms for some of India's
                best-known asset managers.
              </p>
              <p>
                He's led product and growth for{" "}
                <Brand>Canara Robeco Mutual Fund</Brand>,{" "}
                <Brand>ICICI Pru Mutual Fund</Brand> and{" "}
                <Brand>Aditya Birla Mutual Fund</Brand> — work that means he's
                spent a career sitting in rooms where the choice is rarely as
                clean as it looks from the outside.
              </p>
              <p className="text-ink-100">
                This podcast is the version of those rooms without the slide
                deck.
              </p>
            </div>

            <ul className="mt-10 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Tag>Product</Tag>
              <Tag>Marketing</Tag>
              <Tag>BFSI</Tag>
              <Tag>Mutual Funds</Tag>
              <Tag>Digital platforms</Tag>
              <Tag>Long-form</Tag>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Brand({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap font-medium text-ink-50">
      {children}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-ink-200/15 px-3 py-2 text-center text-ink-200">
      {children}
    </li>
  );
}
