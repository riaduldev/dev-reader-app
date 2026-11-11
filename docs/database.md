# Database — DevReaderHub

Target: **Supabase PostgreSQL**। Schema, Row Level Security, referential
behaviour ও migration নির্দেশনা।

Migration files:

| File | বিষয় |
|---|---|
| `supabase/migrations/0001_init.sql` | সব টেবিল, index, trigger, RLS policy ও source registry seed |
| `supabase/migrations/0002_auth_onboarding.sql` | onboarding/preference কলাম, role protection trigger |

---

## ১. Migration চালানো

### উপায় ১ — কমান্ড (সবচেয়ে সহজ)

`.env.local` ফাইলে Postgres connection string দিন (Supabase → Project Settings →
Database → Connection string → URI):

```dotenv
DATABASE_URL=postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres
```

তারপর:

```bash
npm run db:migrate
```

স্ক্রিপ্টটি `supabase/migrations/` ফোল্ডারের সব `.sql` ফাইল ক্রমানুসারে চালায়,
শেষে `public` schema-এর টেবিলগুলোর তালিকা দেখায়।

### উপায় ২ — Supabase SQL Editor

**Supabase Dashboard → SQL Editor → New query** → ফাইল দুটি **ক্রমানুসারে**
(`0001` তারপর `0002`) চালান।

### উপায় ৩ — Supabase CLI

```bash
supabase link --project-ref <project-ref>
supabase db push
```

দুটো migration-ই **idempotent**: `create table if not exists`,
`add column if not exists`, `create index if not exists`,
`create or replace function`, `drop policy if exists` + `create policy` ব্যবহার
করা হয়েছে — তাই একাধিকবার চালালেও duplicate object বা error হয় না।

### যদি টেবিল তৈরি না হয়ে থাকে

অ্যাপটি প্রতিটি ডেটা-পড়ার আগে schema আছে কি না যাচাই করে। না থাকলে ড্যাশবোর্ডে
স্পষ্ট একটি নির্দেশনা দেখানো হয় (কোন টেবিল নেই, কীভাবে চালাবেন) এবং admin
পাতায় **SQL কপি** বোতাম থাকে (`/admin/sources`)। API-তেও raw PostgREST ত্রুটির
বদলে পরিষ্কার বাংলা বার্তা ফেরত আসে।

---

## ২. টেবিল

| টেবিল | কী রাখে |
|---|---|
| `sources` | সংগ্রহের সোর্স registry (নাম, feed/API URL, সাইট URL, ক্যাটাগরি, টাইপ, নির্ভরযোগ্যতা, active, last success/error, ফেচ interval) |
| `articles` | সংগৃহীত নিবন্ধ (`url UNIQUE`, category, published_at, importance, AI-বিশ্লেষণের কলাম, tags, `ai_processed_at`) |
| `ingestion_runs` | প্রতিটি সংগ্রহ রান (trigger, status, lookback, source/article সংখ্যা, AI গণনা) |
| `ingestion_run_items` | প্রতি সোর্সের ফলাফল (status, item/new/duplicate সংখ্যা, duration, error) |
| `github_repos` | সংগৃহীত repository (stars, forks, language, license, topics, `score`, `score_components`, `query`, `collected_at`) |
| `vulnerabilities` | CVE তথ্য (CVSS, severity, product, dates, `exploited`, `in_kev`, `reference_urls`) |
| `user_profiles` | প্রতি ইউজারের প্রোফাইল ও `role` (`user` / `admin`) |
| `user_preferences` | থিম, ভাষা, ডেনসিটি, `categories`, `technologies`, `onboarding_completed`, email digest |
| `bookmarks` | সংরক্ষিত নিবন্ধ (user × article unique) |
| `reading_history` | পঠন ইতিহাস (user × article unique) |
| `notifications` | বেলের নোটিফিকেশন |

---

## ৩. Row Level Security

RLS সব টেবিলে সক্রিয়। কোনো ফিচার RLS বন্ধ করে চালু করা হয়নি।

| টেবিল | পলিসি |
|---|---|
| `sources`, `articles`, `ingestion_runs`, `ingestion_run_items`, `github_repos`, `vulnerabilities` | `anon`/`authenticated` **শুধু SELECT** করতে পারে; write শুধু service role (ingestion/admin) করে |
| `bookmarks`, `reading_history`, `user_preferences`, `notifications` | `auth.uid() = user_id` — প্রতিটি ইউজার শুধু নিজের তথ্য দেখতে ও বদলাতে পারে |
| `user_profiles` | নিজের প্রোফাইল SELECT/UPDATE; `role` কলাম ব্যবহারকারীর জন্য বন্ধ |

### Key ও secret ব্যবহার

* ব্রাউজার ও session client: **শুধু publishable/anon key**
  (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)।
* Server-side ingestion ও admin write: **service role / secret key**
  (`SUPABASE_SERVICE_ROLE_KEY`) — কখনো `NEXT_PUBLIC_` prefix নয়, কখনো
  client bundle-এ নয়।

---

## ৪. Referential behaviour

```
auth.users ──cascade──> user_profiles
                     ├─> user_preferences
                     ├─> bookmarks
                     ├─> reading_history
                     └─> notifications

articles ──cascade──> bookmarks, reading_history
sources  ──set null─> articles
```

* **অ্যাকাউন্ট মুছলে** (`DELETE /api/account` → `auth.admin.deleteUser`) ইউজারের
  প্রোফাইল, পছন্দ, বুকমার্ক, ইতিহাস ও নোটিফিকেশন — সব সাথে সাথে মুছে যায়
  (`ON DELETE CASCADE`)।
* **প্রোফাইল আপডেট** করলে কোনো সংশ্লিষ্ট সারি মুছে যায় না; শুধু `full_name` ও
  `avatar_url` বদলায়।
* **সোর্স মুছলে** সংগৃহীত নিবন্ধগুলো থেকে যায়, কেবল `source_id` NULL হয়
  (`ON DELETE SET NULL`) — ইতিহাস ধরে থাকে।
* **নিবন্ধ মুছলে** সংশ্লিষ্ট বুকমার্ক ও ইতিহাস মুছে যায়।

---

## ৫. Admin role সুরক্ষা

`user_profiles.role` ব্যবহারকারী পরিবর্তন করতে পারে না — দুই স্তরে সুরক্ষা:

1. **Column-level grant** (`0001`):
   `revoke update on public.user_profiles from authenticated;`
   `grant update (full_name, avatar_url) on public.user_profiles to authenticated;`
2. **Trigger** (`0002`): `protect_user_profile_role()` — `role` বদলালে request
   role `service_role` বা database admin না হলে exception।

Admin বানাতে (SQL Editor):

```sql
update public.user_profiles
set role = 'admin'
where email = 'you@example.com';
```

---

## ৬. Profile তৈরি

`auth.users`-এ নতুন ইউজার যোগ হলেই `handle_new_user()` trigger
(`0001`) `user_profiles` ও `user_preferences` রো তৈরি করে। OAuth দিয়ে আসা
ইউজারের ক্ষেত্রেও একই trigger কাজ করে।

---

## ৭. Source registry

`0001`-এ প্রায় ৪০টি সোর্স seed করা হয়েছে (RSS, Atom, JSON API ও index-only)।
Feed URL যাচাই করা হয়েছে। যেসব সোর্সের machine-readable feed নেই (যেমন
Anthropic News, TypeScript Blog) সেগুলো `html_index` টাইপে থাকে এবং
DevReaderHub সেগুলো স্ক্র্যাপ করে না — বিস্তারিত: [`ingestion.md`](ingestion.md)।

---

## ৮. ভাষা preference, ব্যাকআপ ও পরিবর্তন

* **ভাষা preference**: `user_preferences.language` (`bn` | `en`) — ইন্টারফেসের ভাষা
  ডিফল্ট বাংলা; সাইন-ইন করা ইউজার ভাষা সুইচার চাপলে এটি সেভ হয় এবং পরবর্তী ভিজিটে
  প্রয়োগ হয়। রেন্ডারের সময় `drh_lang` cookie-ই উৎস হিসেবে কাজ করে, তাই সার্ভার
  ও ক্লায়েন্ট সবসময় একই ভাষা দেখায় (কোনো flash বা hydration mismatch নেই)।

* Supabase Dashboard-এ daily backup চালু করুন — এই ডেটাবেসই DevReaderHub-এর
  একমাত্র content source।
* Schema পরিবর্তন করতে হলে নতুন ফাইল যোগ করুন
  (`supabase/migrations/0003_….sql`) — পুরোনো migration সম্পাদনা করবেন না।
