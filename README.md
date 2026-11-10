# DevPulse

**আপনার ব্যক্তিগত ডেভেলপার ইন্টেলিজেন্স হাব** — Your Personal Developer Intelligence Hub.

DevPulse collects developer technology news from a curated registry of reliable
sources, organises it into seven categories, adds optional AI-generated Bangla
analysis, and supports search, bookmarks and reading history.

The interface is in Bangla; technical terms stay in English.

---

## Features

* **Dashboard** — greeting, current date, real statistics (computed only from
  stored records), last successful synchronisation, important news, a
  chronological feed with category filters and pagination, GitHub results,
  source-backed security alerts and weekly highlights.
* **Seven category pages** — AI, Web Development, GitHub & Open Source,
  Cybersecurity, Cloud & DevOps, Tech Industry and Developer Jobs — each with
  description, search, sorting, date filters, pagination and empty states.
* **Real ingestion engine** — RSS/Atom and official JSON APIs, timeouts,
  exponential backoff, per-source error isolation, lookback window (default
  24 h), URL de-duplication, recorded runs and per-source outcomes.
* **AI analysis (Bangla)** — server-side OpenAI call with structured JSON
  output, validated with Zod, executed only for articles above a configurable
  importance threshold and only once per article.
* **GitHub intelligence** — repository search through the REST API with a
  documented, reproducible “DevPulse score” (never presented as GitHub
  Trending).
* **Security intelligence** — CISA Known Exploited Vulnerabilities (the only
  source that marks a CVE as exploited) merged with NVD CVE 2.0 data.
* **Authentication** — Supabase email/password, session refresh in
  `src/proxy.ts`, Row Level Security on all user tables, admin role for the
  source management page.
* **UI** — dark theme by default with a working light mode, responsive
  desktop/tablet/mobile layouts, loading skeletons, empty and error states,
  toast notifications, accessible controls and a global `⌘K` search.

---

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui-style components (Radix UI) · Lucide React · Zod · rss-parser ·
GitHub REST API · Supabase (PostgreSQL, Auth, RLS) · OpenAI API · Vercel Cron.

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure the environment

```bash
cp .env.example .env.local
```

Fill in at least:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
CRON_SECRET=<openssl rand -hex 32>
```

Without these variables the app still boots: it shows a precise
“সেটআপ প্রয়োজন” panel instead of inventing data. See
[`docs/deployment.md`](docs/deployment.md) for the full walkthrough.

### 3. Create the database

Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
in the Supabase SQL editor (or `supabase db push` if you use the Supabase CLI).
It creates the tables, indexes, triggers, Row Level Security policies and
seeds the source registry.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm start` | run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript without emitting |
| `npm test` | Vitest unit tests |

---

## Project structure

```
src/
  app/
    (app)/              # authenticated shell: dashboard, categories, settings…
    api/                # route handlers (cron, admin, search, bookmarks…)
    login, signup       # Supabase email/password authentication
  components/           # UI primitives, layout, news, security, admin
  lib/
    ai/                 # OpenAI analysis + schema
    db/                 # typed repositories (articles, sources, runs, users…)
    github/             # GitHub client, trending score, collection
    ingestion/          # http/retry, feeds, APIs, normalise, classify, engine
    security/           # CISA KEV + NVD clients and sync
    auth/               # session helpers and server actions
  proxy.ts              # Supabase session refresh + route protection
supabase/migrations/    # SQL schema, RLS policies, source seed
docs/                   # ingestion, trending score, AI analysis, deployment
tests/                  # Vitest unit tests
```

---

## Documentation

* [`docs/ingestion.md`](docs/ingestion.md) — pipeline, categorisation rules,
  the full source registry and documented limitations (sources without a feed,
  robots/attribution policy, rate limits).
* [`docs/trending-score.md`](docs/trending-score.md) — the exact GitHub
  scoring formula and the queries used for collection.
* [`docs/ai-analysis.md`](docs/ai-analysis.md) — the JSON contract, prompt
  rules and cost controls.
* [`docs/deployment.md`](docs/deployment.md) — Supabase + Vercel setup, cron
  configuration and operations.

---

## Responsible collection

* Only RSS, Atom and officially published JSON APIs are collected.
* DevPulse never scrapes pages that lack a feed and never bypasses paywalls
  or `robots.txt`; every item links back to its original publisher.
* API rate limits are respected and surfaced (GitHub, NVD, OpenAI).
* A source is only marked successful after its request actually succeeded.
* Exploitation claims come exclusively from CISA KEV — never from inference
  and never from AI output.

## License

Private project — all rights reserved.
