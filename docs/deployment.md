# Deployment (Vercel + Supabase)

## 1. Supabase project

1. Create a project at <https://supabase.com>.
2. **SQL Editor → New query** → paste `supabase/migrations/0001_init.sql` →
   Run. This creates every table, index, trigger, RLS policy and seeds the
   source registry.
3. **Project Settings → API** → copy:
   * `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   * `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(server-side only —
     never expose it to the browser)*
4. **Authentication → Providers → Email** → enable *Email* (and keep
   “Confirm email” on or off depending on your preference; DevPulse shows a
   message when a signup needs email confirmation).

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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | browser + session client |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | ingestion & admin writes (server only) |
| `OPENAI_API_KEY` | optional | AI analysis (the feature is skipped without it) |
| `OPENAI_MODEL` | optional | model id, default `gpt-4o-mini` |
| `GITHUB_TOKEN` | recommended | raises the GitHub search rate limit |
| `CRON_SECRET` | yes | protects the scheduled ingestion endpoint |
| `INGEST_LOOKBACK_HOURS` | optional | default `24` |
| `AI_IMPORTANCE_THRESHOLD` | optional | default `3` |
| `AI_MAX_ARTICLES_PER_RUN` | optional | default `40` |

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

1. Open `/admin/sources` with an admin account and press **সব সোর্স সিঙ্ক করুন**
   to perform the initial collection.
2. Check the run history — per-source outcomes and error messages are listed on
   the same page.
3. Verify `/security` shows CISA KEV entries and `/github` shows scored
   repositories.

## 5. Operations

* **Health**: `GET /api/cron/ingest` without the secret returns `401`; the
  dashboard shows the last successful synchronisation and the last run status.
* **Rotating `CRON_SECRET`**: update the Vercel environment variable and
  redeploy — the old token stops working immediately.
* **Backups**: enable Supabase daily backups in the project settings; the
  database is the single source of truth for all DevPulse content.
