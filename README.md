# DevReaderHub

**আপনার প্রতিদিনের Developer News Hub — Your daily developer news hub**

DevReaderHub collects developer technology news from a curated registry of
reliable sources, organises it into seven categories, adds optional
AI-generated Bangla analysis, and supports search, bookmarks and a reading
history. The interface ships in **Bangla and English**, switchable at any time
without leaving the page.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Screenshots](#2-screenshots)
3. [Technology stack](#3-technology-stack)
4. [Prerequisites](#4-prerequisites)
5. [Local setup](#5-local-setup)
6. [Environment variables](#6-environment-variables)
7. [Supabase setup](#7-supabase-setup)
8. [Authentication provider setup](#8-authentication-provider-setup)
9. [Integrations](#9-integrations)
10. [Features and usage](#10-features-and-usage)
11. [Scripts and commands](#11-scripts-and-commands)
12. [Deployment](#12-deployment)
13. [Troubleshooting](#13-troubleshooting)
14. [Security and limitations](#14-security-and-limitations)

---

## 1. Project overview

DevReaderHub is a production-oriented developer news intelligence platform.
It is not a static prototype: an ingestion engine collects articles from RSS,
Atom and officially published JSON APIs, normalises and categorises them,
stores them in PostgreSQL with Row Level Security, optionally enriches the most
relevant stories with a structured Bangla analysis from OpenAI, and serves them
through a bilingual dashboard.

**Interface languages:** Bangla (default) and English. The choice is stored in
the `drh_lang` cookie for rendering and, for signed-in users, in
`user_preferences.language` so it follows the account across devices.

**Public vs. account-only features**

| Available without an account | Requires an account |
|---|---|
| Dashboard, categories, articles, GitHub results, security intelligence, global search | Saved articles, reading history, onboarding and preferences, notifications, source management (admin) |

**Main features**

- Dashboard with real statistics (computed only from collected records), last
  successful synchronisation, important news, a chronological feed with category
  filters and pagination, GitHub results, source-backed security alerts and
  weekly highlights.
- Seven category pages — AI, Web Development, GitHub & Open Source,
  Cybersecurity, Cloud & DevOps, Tech Industry, Developer Jobs — each with
  description, search, sorting, date filters, pagination and empty states.
- A real ingestion engine: timeouts, exponential backoff, per-source error
  isolation, a configurable lookback window, URL de-duplication, recorded runs
  and per-source outcomes.
- AI analysis in Bangla: server-side OpenAI call with structured JSON output,
  validated with Zod, executed only for articles above a configurable
  importance threshold and only once per article.
- GitHub intelligence through the REST API, ranked with a documented and
  reproducible “DevReaderHub score” (never presented as GitHub Trending).
- Security intelligence from CISA Known Exploited Vulnerabilities (the only
  source allowed to mark a CVE as exploited) merged with NVD CVE 2.0 data.
- Authentication: email/password, Google OAuth, GitHub OAuth, password reset
  and recovery, session refresh in `src/proxy.ts`, and an admin role for source
  management.
- A polished, accessible interface: dark theme by default with a working light
  theme, responsive layouts, loading skeletons, empty and error states, toast
  notifications and a global `⌘K` search.

---

## 2. Screenshots

No screenshots are included in this repository. Every screenshot in the project
would have to be captured from a running instance, and none is committed yet —
add them here once they exist rather than shipping images that do not match the
current build.

---

## 3. Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with a custom token layer, shadcn/ui-style components built on Radix UI |
| Icons | Lucide React (brand marks are inlined as SVG) |
| Validation | Zod |
| Feeds | rss-parser (RSS + Atom) |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) — email/password, Google, GitHub |
| AI | OpenAI API (structured JSON output) |
| GitHub | GitHub REST API (repository search) |
| Security data | CISA KEV catalogue, NVD CVE 2.0 API |
| Toasts | Sonner |
| Testing | Vitest (unit + opt-in live network tests) |
| Deployment | Vercel (Cron jobs) |

---

## 4. Prerequisites

- **Node.js 20.9 or newer** (required by Next.js 16) and **npm** — the
  repository ships `package-lock.json`, so use `npm ci` for a reproducible
  install.
- A **Supabase project** (free tier is enough to start).
- Optional but recommended: an **OpenAI API key** (AI analysis is skipped
  without it), a **GitHub personal access token** (raises the search rate
  limit), and a **Vercel account** for hosting and cron jobs.

External accounts are only needed for the features that use them — the app
starts without any of them and shows a precise setup panel instead of
inventing data.

---

## 5. Local setup

```bash
# 1. Install dependencies (Node 20.9+, npm)
npm ci

# 2. Create your local environment file
cp .env.example .env.local
# then fill in the values — see "Environment variables" below

# 3. Apply the database migrations (see "Supabase setup")
npm run db:migrate

# 4. Start the development server
npm run dev
```

Open <http://localhost:3000>.

`npm run db:migrate` needs a direct Postgres connection string. Either add it
to `.env.local`:

```dotenv
DATABASE_URL=postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres
```

or run the two migration files manually in the Supabase SQL editor (see
[Supabase setup](#7-supabase-setup)).

---

## 6. Environment variables

`.env.example` contains placeholders only. The variables below are the ones the
code actually reads.

| Variable | Required | Server only | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | no (public) | Supabase project URL, e.g. `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | no (public) | Publishable / anon key used by the browser and the session client |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **yes** | Secret key for ingestion and admin writes. Never expose it to the browser and never prefix it with `NEXT_PUBLIC_` |
| `OPENAI_API_KEY` | optional | **yes** | Enables the Bangla AI analysis. Without it the step is skipped and articles stay unanalysed |
| `OPENAI_MODEL` | optional | **yes** | Model id for the analysis (default `gpt-4o-mini`) |
| `OPENAI_BASE_URL` | optional | **yes** | OpenAI-compatible gateway (Azure OpenAI, proxy, …) |
| `GITHUB_TOKEN` | optional | **yes** | Raises the GitHub repository search limit from 30 requests/hour to 30 requests/minute |
| `CRON_SECRET` | yes (production) | **yes** | Bearer token required by `POST /api/cron/ingest` |
| `INGEST_LOOKBACK_HOURS` | optional | **yes** | Collection window in hours (default `24`) |
| `INGEST_TIMEOUT_MS` | optional | **yes** | Per-request timeout in milliseconds (default `15000`) |
| `INGEST_MAX_RETRIES` | optional | **yes** | Retries for transient failures (default `3`) |
| `AI_IMPORTANCE_THRESHOLD` | optional | **yes** | Only articles with a pre-analysis importance ≥ this value are analysed, 1–5 (default `3`) |
| `AI_MAX_ARTICLES_PER_RUN` | optional | **yes** | Maximum number of articles analysed per run (default `40`) |
| `NEXT_PUBLIC_SITE_URL` | yes (production) | no (public) | Public origin, used for metadata and the OAuth/reset redirect URLs |
| `DATABASE_URL` | migrations only | **yes** | Direct Postgres connection string, used **only** by `npm run db:migrate` |

Security rules for this project:

- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` and `GITHUB_TOKEN` are server
  secrets. They must never use the `NEXT_PUBLIC_` prefix and must never be
  committed.
- The browser bundle only ever receives `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable keys are designed for the
  browser).
- `.env.local` is git-ignored; `.env.example` must keep placeholders only.

---

## 7. Supabase setup

1. **Create a project** at <https://supabase.com>.
2. **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - publishable / `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - secret / `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. **Apply the migrations, in this order:**

   ```bash
   npm run db:migrate          # with DATABASE_URL set
   ```

   or, in the Supabase dashboard, run these files in the SQL editor, one after
   the other:

   - `supabase/migrations/0001_init.sql` — tables, indexes, triggers, RLS
     policies and the seeded source registry
   - `supabase/migrations/0002_auth_onboarding.sql` — onboarding/preference
     columns and the role-protection trigger

   Both migrations are idempotent, so re-running them neither fails nor
   duplicates objects.
4. **Authentication → Email** — keep the *Email* provider enabled. Leave
   “Confirm email” enabled in production; DevReaderHub then shows a clear
   “verify your e-mail” state after sign-up.
5. **Authentication → URL Configuration** — set the Site URL and allow the
   redirect targets:
   - `http://localhost:3000/auth/callback` and
     `https://<your-domain>/auth/callback`
   - `http://localhost:3000/reset-password` and
     `https://<your-domain>/reset-password`
6. **Verify the schema** — open `/admin/sources` with an admin account. The
   page lists the detected tables; if the schema is missing it shows exactly
   which tables are absent and can copy the migration SQL for you. The same
   check is available at `GET /api/admin/schema`.

### Row Level Security

RLS is enabled on every table and is never disabled to work around an access
problem:

- `articles`, `sources`, `ingestion_runs`, `ingestion_run_items`,
  `github_repos`, `vulnerabilities` — readable by `anon`/`authenticated`,
  writable only by the service role.
- `bookmarks`, `reading_history`, `user_preferences`, `notifications` — each
  row is scoped to `auth.uid()`.
- `user_profiles` — a user may read and update their own row; the `role`
  column is protected by a column-level grant and a database trigger, so a user
  can never promote themselves to admin.

Promoting an account to admin is a deliberate database operation:

```sql
update public.user_profiles set role = 'admin' where email = 'you@example.com';
```

---

## 8. Authentication provider setup

Email/password works out of the box. Google and GitHub need a client
configuration in the provider and in Supabase.

**Copy the callback URL from the Supabase dashboard — do not guess it.**
Open *Authentication → Providers → Google* (or *GitHub*), and copy the
**Callback URL** field shown there. It points at your Supabase project (for
example `https://<project-ref>.supabase.co/auth/v1/callback`).

### Google

1. In the [Google Cloud Console](https://console.cloud.google.com/), create or
   pick a project, enable the *Google People API* (not required for basic
   sign-in) and go to **APIs & Services → Credentials**.
2. **Create credentials → OAuth client ID → Web application**.
3. Add the callback URL copied from Supabase under **Authorized redirect
   URIs**, and add your app origins under **Authorized JavaScript origins**
   (`http://localhost:3000` locally, `https://<your-domain>` in production).
4. Copy the client ID and client secret into *Supabase → Authentication →
   Providers → Google* and press **Save**.

### GitHub

1. In GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Set the **Homepage URL** to your app origin and the **Authorization
   callback URL** to the same callback URL copied from Supabase.
3. Copy the client ID and client secret into *Supabase → Authentication →
   Providers → GitHub* and press **Save**.

### Behaviour

- When a provider is **not** enabled, DevReaderHub detects it at runtime
  (through the public `/auth/v1/settings` endpoint) and renders the button
  disabled with an explanation — it never dead-ends.
- A cancelled or failed OAuth attempt returns to `/login` with a readable
  message; the raw provider error stays in the server log.
- The `next` parameter is validated server-side: only same-site paths are
  accepted, so a crafted link cannot turn into an open redirect.
- The same e-mail address used with several providers is handled by
  Supabase's own identity linking; DevReaderHub does not build custom
  linking logic.
- With “Confirm email” enabled, a sign-up returns an explicit
  verification-pending message instead of silently failing.
- Password reset always answers with the same neutral message, so the form
  cannot be used to discover which e-mail addresses have an account.

---

## 9. Integrations

### OpenAI (AI analysis)

Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`). The analysis request
runs server-side with structured JSON output and is validated with Zod before
anything is stored. Only articles whose deterministic pre-analysis importance
is at least `AI_IMPORTANCE_THRESHOLD` are analysed, and each article is
analysed exactly once. If the key is missing the step is skipped; if the call
fails the article simply stays unanalysed and is retried on the next run —
the error is logged server-side as `[ai] analysis failed …`.

### GitHub

Set `GITHUB_TOKEN` to raise the search rate limit. Without it the search API
still works, but with the anonymous limit of 30 requests per hour; a
`403`/`429` is surfaced as an explicit rate-limit message instead of silently
returning no results. The ranking formula is documented in
[`docs/trending-score.md`](docs/trending-score.md).

### News ingestion

Sources live in the `sources` table and are seeded by migration `0001`. The
engine fetches each active source with a timeout, retries transient failures
with exponential backoff, validates and normalises every item, applies the
lookback window, de-duplicates by canonical URL, writes to PostgreSQL and
records the run and per-source outcome.

Run a collection:

```bash
# as an administrator, from the UI:
#   /admin/sources  →  "সব সোর্স সিঙ্ক করুন" / "Sync all sources"

# or over HTTP (admin session required):
curl -X POST https://<your-domain>/api/admin/ingest

# or with the cron secret (used by Vercel Cron):
curl -X POST https://<your-domain>/api/cron/ingest \
  -H "Authorization: Bearer $CRON_SECRET"
```

Only RSS, Atom and officially published JSON APIs are collected. Sources
without a machine-readable feed are registered as index-only and are never
scraped — see [`docs/ingestion.md`](docs/ingestion.md) for the full registry
and its limitations.

### Scheduled ingestion

`vercel.json` defines the cron job:

```json
{ "crons": [{ "path": "/api/cron/ingest", "schedule": "0 */2 * * *" }] }
```

Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when the
environment variable exists. Hobby plans allow daily schedules only — change
the cron expression to `"0 6 * * *"` if the deployment rejects it.

### Integrations that cannot be tested without credentials

| Integration | What is verified without credentials | What still needs your account |
|---|---|---|
| OpenAI | Request shape, schema validation, threshold gate, error handling | A funded API key (a valid key with no credits returns `429`) |
| GitHub | Query building, scoring, pagination, rate-limit handling | A token for higher limits |
| Google / GitHub OAuth | Authorisation URL construction, callback handling, disabled-provider fallback | Client IDs and secrets for a real provider login |
| Supabase | Query construction, RLS policies, migration files | Applying the migrations and creating accounts |

---

## 10. Features and usage

- **Overview** — greeting, current date, real statistics, last successful sync,
  important news, chronological feed with category pills, GitHub results,
  security alerts and weekly highlights.
- **Latest news** (`/news`) and **category pages** (`/category/[slug]`) —
  search, sorting (newest, oldest, importance), date filters and pagination.
- **Article page** (`/article/[id]`) — the full Bangla analysis (summary, why
  it matters, developer impact, what to do next, confidence and fact status),
  the tags and a link back to the original publisher.
- **Search** — the `⌘K` dialog (and the search button on mobile) queries the
  collected articles.
- **Bookmarks** — the save button on any card; anonymous visitors are sent to
  the sign-in page and returned to the same article afterwards.
- **Reading history** — articles you open are listed in `/history`.
- **Onboarding** — after the first sign-up you can pick your categories and
  technologies (or skip it); preferences stay editable in `/settings`.
- **Notifications** — the bell menu shows ingestion results.
- **Admin** (`/admin/sources`) — add, edit, enable, test, sync and delete
  sources, and inspect the ingestion history and per-source errors.
- **Language switcher** — the button in the top bar toggles the whole
  interface between `বাংলা` and `English` without a navigation. The label
  always shows the language you can switch *to*.

---

## 11. Scripts and commands

| Command | Description |
|---|---|
| `npm run dev` | Development server on <http://localhost:3000> |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run db:migrate` | Apply the Supabase migrations (needs `DATABASE_URL`) |

Optional helper scripts (not required to run the app):

| Script | Purpose |
|---|---|
| mark bounding box: 608x441 at (144, 386)
wrote public/devreaderhub-logo.png
wrote src/app/icon.png (512x512)
wrote src/app/apple-icon.png (180x180)
wrote public/icon-192.png (192x192)
wrote public/icon-512.png (512x512)
original artwork untouched ✔ | Regenerates the favicon and manifest icons from  (needs ) |
|  | Loads the app in headless Chromium at three viewport sizes in both languages and reports overflow, missing accessible names and console errors (needs ) |

Optional helper scripts (not required to run the app):

| Script | Purpose |
|---|---|
| `node scripts/build-brand-assets.mjs` | Regenerates the favicon and manifest icons from the original artwork (needs `npm i -D sharp`) |
| `node scripts/verify-ui.mjs http://localhost:3000` | Loads the app in headless Chromium at three viewport sizes in both languages and reports overflow, missing accessible names and console errors (needs `npm i -D playwright`) |

Optional live tests (require network access):

```bash
LIVE_FEEDS=1 npm test   # fetches real feeds, CISA KEV, NVD and GitHub
LIVE_AI=1 npm test      # sends one real OpenAI analysis request
```

---

## 12. Deployment

### Vercel

1. Import the repository into Vercel.
2. Add the environment variables from
   [Environment variables](#6-environment-variables) for **Production** and
   **Preview** (Production and Preview can share the same Supabase project;
   use separate projects if you want separate data).
3. Set `NEXT_PUBLIC_SITE_URL` to the production origin.
4. Deploy — `vercel.json` installs the cron schedule automatically.
5. Apply the migrations (step 3 of [Supabase setup](#7-supabase-setup)).
6. Verify:
   - `GET /api/cron/ingest` without a token returns `401`
   - `/admin/sources` lists the detected tables and the seeded sources
   - a first **Sync all sources** run populates the dashboard
   - `/security` shows CISA KEV entries and `/github` shows scored repositories

### Operating notes

- **Health** — the dashboard shows the last successful synchronisation and the
  last run status; failed sources are listed on the admin page.
- **Rotating `CRON_SECRET`** — update the environment variable and redeploy;
  the previous token stops working immediately.
- **Backups** — enable daily backups in Supabase; the database is the single
  source of truth for all DevReaderHub content.
- **AI quota** — with no OpenAI credits the analysis step logs
  `[ai] analysis failed …` and leaves the article unanalysed; nothing else
  breaks.
- **E-mail quota** — Supabase's built-in SMTP has a strict hourly limit. A
  sign-up that hits `over_email_send_rate_limit` shows a friendly message;
  configure a custom SMTP provider for production traffic.

---

## 13. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| “ডেটাবেসের schema তৈরি হয়নি” / “the database schema is missing” | The migrations were never applied. Run `npm run db:migrate` with `DATABASE_URL`, or run both files in the Supabase SQL editor. The admin page lists the missing tables and can copy the SQL. |
| `Could not find the table 'public.articles' in the schema cache` | Same as above — the tables do not exist yet. If you just applied the migrations, reload the page; PostgREST refreshes its schema cache automatically. |
| Every page shows a Supabase configuration warning | `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing in `.env.local`. Restart the dev server after editing it. |
| Sign-up returns “too many requests” | Supabase's e-mail rate limit was reached. Configure a custom SMTP provider or wait. |
| “Google/GitHub provider এখনো চালু করা হয়নি” | The provider is disabled in the Supabase project. Enable it and paste the client ID and secret (see [Authentication provider setup](#8-authentication-provider-setup)). |
| OAuth returns `redirect_uri_mismatch` | The callback URL in Google/GitHub does not match the one shown in the Supabase dashboard. Copy it from the dashboard — do not type it by hand. |
| OAuth loops back to the login page | `NEXT_PUBLIC_SITE_URL` is wrong, or the app origin is missing from the Supabase redirect allowlist. |
| The password reset link does nothing | Add `/reset-password` and `/auth/callback` for your domain to the Supabase redirect URLs, and make sure the link is opened in the same browser that requested it. |
| `401` from `/api/cron/ingest` | The request needs `Authorization: Bearer $CRON_SECRET`. |
| Ingestion fails for a single source | Open `/admin/sources` → ingestion errors. Common causes: a malformed feed, a timeout, or a rate limit. A failing source never blocks the others. |
| GitHub shows a rate-limit message | Add `GITHUB_TOKEN`; the anonymous search limit is 30 requests per hour. |
| AI analysis never appears | Check the server log for `[ai] analysis failed …`. The most common cause is an OpenAI account without credits (`429`). Articles stay unanalysed and are retried later. |
| “Sort by importance” looks wrong | It is now ordered by importance first, then publication date. If you see the old behaviour, clear the build cache (`rm -rf .next`) and rebuild. |

---

## 14. Security and limitations

**Secret handling**

- Real keys live in `.env.local` (git-ignored) or in the Vercel project
  settings — never in the repository. `.env.example` keeps placeholders only.
- The service-role key, the OpenAI key and the GitHub token are server-only.
  The browser bundle contains only the publishable Supabase key.
- Auth failures are translated into friendly messages; the raw provider error
  is written to the server log (`[auth] …`) instead of being shown to users.
- Redirect targets are validated: only same-site paths are accepted, which
  prevents open redirects.
- Admin access is decided by the `user_profiles.role` column, which users
  cannot change themselves.

**Known limitations**

- The database schema must be applied before the app can show data; until
  then the dashboard shows a precise setup panel rather than fake numbers.
- Anthropic News and the TypeScript blog publish no machine-readable feed.
  They are registered as index-only sources and are never scraped.
- The AI analysis requires an OpenAI account with credits.
- Google and GitHub sign-in require the provider credentials above; the
  buttons stay disabled with an explanation until then.
- Article summaries are model-generated supporting information — the original
  article is always the authoritative source, and the UI links back to it.
- The GitHub ranking is a DevReaderHub score over search results, not GitHub's
  official Trending ranking.

**Further documentation**

- [`docs/authentication.md`](docs/authentication.md) — every authentication
  flow, provider setup and troubleshooting.
- [`docs/database.md`](docs/database.md) — schema, RLS, referential behaviour
  and migration order.
- [`docs/ingestion.md`](docs/ingestion.md) — pipeline, categorisation rules,
  source registry and limitations.
- [`docs/trending-score.md`](docs/trending-score.md) — the exact GitHub scoring
  formula.
- [`docs/ai-analysis.md`](docs/ai-analysis.md) — JSON contract, prompt rules
  and cost controls.
- [`docs/deployment.md`](docs/deployment.md) — deployment, cron and operations.

---

## Brand assets

| File | Purpose |
|---|---|
| `public/dev-reader-hub.jpg` | Original brand artwork — the source of truth, never modified |
| `public/devreaderhub-logo.png` | The mark with a transparent background, used in the sidebar, header and auth pages |
| `src/app/icon.png` | Browser tab icon (Next.js file convention) |
| `src/app/apple-icon.png` | Apple touch icon |
| `public/icon-192.png`, `public/icon-512.png` | Web manifest icons |
| `src/app/manifest.webmanifest` | Installable-app manifest |

The derived icons are regenerated from the original artwork with
`node scripts/build-brand-assets.mjs` (requires `npm i -D sharp`); the original
file is verified to be byte-identical afterwards.
