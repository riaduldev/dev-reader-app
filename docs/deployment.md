# Deployment (Vercel + Supabase)

## 1. Supabase project

1. Create a project at <https://supabase.com>.
2. **SQL Editor → New query** → run `supabase/migrations/0001_init.sql` and
   then `supabase/migrations/0002_auth_onboarding.sql` (in that order). This
   creates every table, index, trigger, RLS policy and seeds the source
   registry. See [`database.md`](database.md).
3. **Project Settings → API** → copy:
   * `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   * publishable / `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * secret / `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(server-side
     only — never expose it to the browser)*
4. **Authentication → Email** → keep the *Email* provider enabled. Leave
   “Confirm email” enabled for production; DevReaderHub then shows a clear
   “ইমেইল যাচাই করুন” state after sign-up.
5. **Authentication → Providers → Google / GitHub** → enable the OAuth
   providers you want to offer. Full client-ID/secret steps:
   [`authentication.md`](authentication.md). Providers that are not enabled are
   detected at runtime and their buttons are disabled with an explanation.
6. **Authentication → URL Configuration** → Site URL
   `https://<your-app-domain>` (or `http://localhost:3000` locally) and add
   `https://<your-app-domain>/auth/callback` plus
   `https://<your-app-domain>/reset-password` to the redirect URLs.

### Making someone an admin

The admin UI (`/admin/sources`) requires `user_profiles.role = 'admin'`:

```sql
update public.user_profiles
set role = 'admin'
where email = 'you@example.com';
```

## 2. Environment variables

Copy `.env.example` to `.env.local` for local development, and add the same
variables in **Vercel → Project → Settings → Environment Variables**
(Production + Preview). Set `NEXT_PUBLIC_SITE_URL` to the production URL.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | browser + session client (publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | ingestion & admin writes (server only, never `NEXT_PUBLIC_`) |
| `OPENAI_API_KEY` | optional | AI analysis (the feature is skipped without it) |
| `OPENAI_MODEL` | optional | model id, default `gpt-4o-mini` |
| `OPENAI_BASE_URL` | optional | OpenAI-compatible gateway |
| `GITHUB_TOKEN` | recommended | raises the GitHub search rate limit |
| `CRON_SECRET` | yes | protects the scheduled ingestion endpoint |
| `INGEST_LOOKBACK_HOURS` | optional | default `24` |
| `INGEST_TIMEOUT_MS` | optional | default `15000` |
| `INGEST_MAX_RETRIES` | optional | default `3` |
| `AI_IMPORTANCE_THRESHOLD` | optional | default `3` |
| `AI_MAX_ARTICLES_PER_RUN` | optional | default `40` |
| `NEXT_PUBLIC_SITE_URL` | yes (production) | public origin, used for OAuth/mail redirect URLs |

Generate a strong cron secret:

```bash
openssl rand -hex 32
```

## 3. Deploy

```bash
npm run build   # local verification
npx vercel      # first deployment
```

`vercel.json` contains the Cron definition:

```json
{ "crons": [{ "path": "/api/cron/ingest", "schedule": "0 */2 * * *" }] }
```

Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when the
environment variable exists. Manual test:

```bash
curl -X POST https://your-domain.com/api/cron/ingest \
  -H "Authorization: Bearer $CRON_SECRET"
```

> Hobby plans allow daily cron jobs only. If the schedule is rejected, change
> it to `"0 6 * * *"` (once per day) or upgrade the plan.

## 4. After the first deployment

1. Sign up with an admin account, then promote it:
   ```sql
   update public.user_profiles set role = 'admin' where email = 'you@example.com';
   ```
2. Open `/admin/sources` with the admin account and press **সব সোর্স সিঙ্ক করুন**
   to perform the initial collection.
3. Check the run history — per-source outcomes and error messages are listed on
   the same page.
4. Verify `/security` shows CISA KEV entries and `/github` shows scored
   repositories.
5. Sign up a second (non-admin) account to verify the onboarding flow and the
   per-user isolation of bookmarks and reading history.

## 5. Operations

* **Health**: `GET /api/cron/ingest` without the secret returns `401`; the
  dashboard shows the last successful synchronisation and the last run status.
* **Rotating `CRON_SECRET`**: update the Vercel environment variable and
  redeploy — the old token stops working immediately.
* **Backups**: enable Supabase daily backups in the project settings; the
  database is the single source of truth for all DevReaderHub content.
* **AI quota**: if the OpenAI account runs out of credits the analysis step
  logs `[ai] analysis failed …` and leaves the article unprocessed — the
  article stays readable and is retried on the next run. Add credits at
  <https://platform.openai.com/settings/organization/billing/>.
* **Email quota**: Supabase's built-in SMTP has a strict hourly limit; a
  signup that hits `over_email_send_rate_limit` shows a friendly message.
  Configure a custom SMTP provider for production traffic.
