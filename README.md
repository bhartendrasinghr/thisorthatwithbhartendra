# TPP Dashboard

Internal Tasks / Products / Portfolio dashboard. Tracks the open work across MO First, Advisory Pro, RIISE, Zoho, eKYC, Saathi, and IT Ops, with priority, status, owner, source, and Claude-powered triage / leadership updates.

> Note: this branch (`claude/deploy-to-production-vz2Iq`) hosts the TPP Dashboard. The `main` branch hosts a separate podcast landing page.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Vercel Postgres (`@vercel/postgres`)
- Anthropic Claude (`@anthropic-ai/sdk`) for AI summaries

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in TPP_PASSWORD, POSTGRES_URL, ANTHROPIC_API_KEY
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/login` — sign in with `TPP_PASSWORD`.

## Bootstrap the database

After `POSTGRES_URL` is set, create tables and load the (currently empty) seed:

```bash
curl -X POST http://localhost:3000/api/seed
```

The seed will create the `products`, `owners`, `sources`, `tasks`, and `task_history` tables, plus reference rows for products / owners / sources. Tasks are loaded from `data/tasks_seed.json`.

## Environment

| Variable | Purpose |
| --- | --- |
| `TPP_PASSWORD` | Required. Single shared password to sign in. |
| `TPP_SESSION_SECRET` | Optional. HMAC secret for the session cookie. Defaults to `TPP_PASSWORD`. |
| `POSTGRES_URL` | Required. Postgres connection string (Vercel Postgres provides this automatically). |
| `ANTHROPIC_API_KEY` | Required for `/api/ai` (AI triage, leadership update, task summary). |

## Deploy

Designed for Vercel:

1. Import this branch.
2. Add a Vercel Postgres database (auto-injects `POSTGRES_URL`).
3. Set `TPP_PASSWORD` and `ANTHROPIC_API_KEY` in the project's env vars.
4. POST to `/api/seed` once to provision tables.

## Routes

- `/login` — password gate
- `/dashboard` — KPIs + up-next + product list
- `/tasks` — filterable, groupable task list
- `/tasks/new` — create task
- `/tasks/[task_id]` — task detail, edit, AI summary, history
- `/products` — product cards with rollups
- `/products/[product_id]` — product detail with tasks
- `/api/ai` — `mode: 'triage' | 'leadership_update' | 'task_summary'`
- `/api/seed` — POST to bootstrap tables and seed reference data
