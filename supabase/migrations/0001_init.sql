-- DevPulse — initial schema
-- Target: Supabase PostgreSQL
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (kept as text + check constraints so the schema stays portable)
-- ---------------------------------------------------------------------------

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  feed_url text,
  site_url text,
  category text not null,
  source_type text not null check (source_type in ('rss', 'atom', 'json_api', 'html_index')),
  reliability text not null default 'trusted' check (reliability in ('official', 'trusted', 'community')),
  is_active boolean not null default true,
  fetch_interval_minutes integer not null default 60 check (fetch_interval_minutes > 0),
  last_success_at timestamptz,
  last_attempt_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  consecutive_failures integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources (id) on delete set null,
  title text not null,
  url text not null unique,
  canonical_url text,
  url_hash text not null,
  description text,
  content text,
  author text,
  image_url text,
  category text not null,
  published_at timestamptz not null,
  collected_at timestamptz not null default now(),
  importance integer check (importance between 1 and 5),
  ai_summary_bn text,
  ai_why_it_matters text,
  ai_developer_impact text,
  ai_practical_action text,
  ai_tags text[] not null default '{}',
  ai_confidence text check (ai_confidence in ('low', 'medium', 'high')),
  ai_fact_status text check (ai_fact_status in ('confirmed', 'reported', 'unverified')),
  ai_model text,
  ai_processed_at timestamptz,
  word_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null default 'manual' check (trigger in ('cron', 'manual', 'admin', 'test')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  lookback_hours integer not null default 24,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  total_sources integer not null default 0,
  ok_sources integer not null default 0,
  failed_sources integer not null default 0,
  new_articles integer not null default 0,
  duplicate_articles integer not null default 0,
  ai_processed integer not null default 0,
  ai_failed integer not null default 0,
  error text
);

create table if not exists public.ingestion_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ingestion_runs (id) on delete cascade,
  source_id uuid references public.sources (id) on delete set null,
  source_name text not null,
  status text not null check (status in ('success', 'failed', 'skipped')),
  item_count integer not null default 0,
  new_count integer not null default 0,
  duplicate_count integer not null default 0,
  duration_ms integer,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.github_repos (
  id uuid primary key default gen_random_uuid(),
  full_name text not null unique,
  owner text,
  name text,
  description text,
  url text not null,
  homepage text,
  stars integer not null default 0,
  forks integer not null default 0,
  watchers integer not null default 0,
  open_issues integer not null default 0,
  language text,
  license text,
  topics text[] not null default '{}',
  github_created_at timestamptz,
  github_updated_at timestamptz,
  github_pushed_at timestamptz,
  score double precision not null default 0,
  score_components jsonb not null default '{}'::jsonb,
  query text,
  collected_at timestamptz not null default now()
);

create table if not exists public.vulnerabilities (
  id uuid primary key default gen_random_uuid(),
  cve_id text not null unique,
  title text,
  description text,
  cvss_score double precision,
  cvss_vector text,
  severity text check (severity in ('critical', 'high', 'medium', 'low', 'unknown')),
  vendor text,
  product text,
  published_at timestamptz,
  modified_at timestamptz,
  exploited boolean not null default false,
  exploitation_source text,
  in_kev boolean not null default false,
  kev_due_date date,
  kev_ransomware_use text,
  reference_urls text[] not null default '{}',
  origin text not null default 'nvd',
  raw jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  language text not null default 'bn' check (language in ('bn', 'en')),
  density text not null default 'comfortable' check (density in ('comfortable', 'compact')),
  categories text[] not null default '{}',
  email_digest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid not null references public.articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create table if not exists public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid not null references public.articles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'info' check (kind in ('info', 'success', 'warning', 'error')),
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists articles_published_at_idx on public.articles (published_at desc);
create index if not exists articles_category_published_idx on public.articles (category, published_at desc);
create index if not exists articles_source_idx on public.articles (source_id);
create index if not exists articles_importance_idx on public.articles (importance desc nulls last);
create index if not exists articles_url_hash_idx on public.articles (url_hash);
create index if not exists articles_ai_processed_idx on public.articles (ai_processed_at) where ai_processed_at is null;
create index if not exists articles_title_search_idx on public.articles using gin (to_tsvector('simple', title));
create index if not exists sources_category_active_idx on public.sources (category, is_active);
create index if not exists run_items_run_idx on public.ingestion_run_items (run_id);
create index if not exists runs_started_idx on public.ingestion_runs (started_at desc);
create index if not exists github_repos_score_idx on public.github_repos (score desc);
create index if not exists github_repos_collected_idx on public.github_repos (collected_at desc);
create index if not exists vulnerabilities_modified_idx on public.vulnerabilities (modified_at desc nulls last);
create index if not exists vulnerabilities_exploited_idx on public.vulnerabilities (exploited) where exploited = true;
create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);
create index if not exists history_user_idx on public.reading_history (user_id, viewed_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sources_set_updated_at on public.sources;
create trigger sources_set_updated_at before update on public.sources
for each row execute function public.set_updated_at();

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at before update on public.articles
for each row execute function public.set_updated_at();

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at before update on public.user_preferences
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * Public content tables are world-readable, writable only by the service role.
--   * Per-user tables are readable/writable only for the owning auth.uid().
-- ---------------------------------------------------------------------------

alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.ingestion_run_items enable row level security;
alter table public.github_repos enable row level security;
alter table public.vulnerabilities enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reading_history enable row level security;
alter table public.notifications enable row level security;

drop policy if exists sources_read on public.sources;
create policy sources_read on public.sources for select to anon, authenticated using (true);

drop policy if exists articles_read on public.articles;
create policy articles_read on public.articles for select to anon, authenticated using (true);

drop policy if exists runs_read on public.ingestion_runs;
create policy runs_read on public.ingestion_runs for select to anon, authenticated using (true);

drop policy if exists run_items_read on public.ingestion_run_items;
create policy run_items_read on public.ingestion_run_items for select to anon, authenticated using (true);

drop policy if exists github_repos_read on public.github_repos;
create policy github_repos_read on public.github_repos for select to anon, authenticated using (true);

drop policy if exists vulnerabilities_read on public.vulnerabilities;
create policy vulnerabilities_read on public.vulnerabilities for select to anon, authenticated using (true);

drop policy if exists profiles_read_own on public.user_profiles;
create policy profiles_read_own on public.user_profiles for select to authenticated using (auth.uid() = id);

drop policy if exists profiles_update_own on public.user_profiles;
create policy profiles_update_own on public.user_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists preferences_all_own on public.user_preferences;
create policy preferences_all_own on public.user_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists bookmarks_all_own on public.bookmarks;
create policy bookmarks_all_own on public.bookmarks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists history_all_own on public.reading_history;
create policy history_all_own on public.reading_history for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notifications_all_own on public.notifications;
create policy notifications_all_own on public.notifications for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The `role` column may only be changed by the service role (admin tooling).
revoke update on public.user_profiles from authenticated;
grant update (full_name, avatar_url) on public.user_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Profile bootstrap (runs on signup)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seed: source registry
--   Feed URLs were verified to respond with 2xx and a parseable feed before
--   being added. Sources without an official feed are registered as
--   'html_index' so the registry stays honest about what can be collected.
-- ---------------------------------------------------------------------------

insert into public.sources (slug, name, feed_url, site_url, category, source_type, reliability, notes)
values
  ('openai-news', 'OpenAI News', 'https://openai.com/news/rss.xml', 'https://openai.com/news/', 'ai', 'rss', 'official', 'Official OpenAI news feed.'),
  ('openai-blog', 'OpenAI Blog', 'https://openai.com/blog/rss.xml', 'https://openai.com/blog/', 'ai', 'rss', 'official', 'Official OpenAI blog feed.'),
  ('anthropic-news', 'Anthropic News', null, 'https://www.anthropic.com/news', 'ai', 'html_index', 'official', 'Anthropic publishes no public RSS/Atom feed (verified 404). Registered as an index-only source; DevPulse does not scrape it.'),
  ('google-ai-blog', 'Google AI Blog', 'https://blog.google/technology/ai/rss/', 'https://blog.google/technology/ai/', 'ai', 'rss', 'official', 'Official Google AI blog feed.'),
  ('google-deepmind', 'Google DeepMind', 'https://deepmind.google/blog/rss.xml', 'https://deepmind.google/blog/', 'ai', 'rss', 'official', 'Official DeepMind blog feed.'),
  ('huggingface-blog', 'Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'https://huggingface.co/blog', 'ai', 'rss', 'official', 'Official Hugging Face blog feed.'),

  ('react-blog', 'React Blog', 'https://react.dev/rss.xml', 'https://react.dev/blog', 'web', 'rss', 'official', 'Official React blog feed.'),
  ('nextjs-blog', 'Next.js Blog', 'https://nextjs.org/feed.xml', 'https://nextjs.org/blog', 'web', 'rss', 'official', 'Official Next.js blog feed.'),
  ('nodejs-blog', 'Node.js Blog', 'https://nodejs.org/en/feed/blog.xml', 'https://nodejs.org/en/blog', 'web', 'rss', 'official', 'Official Node.js blog feed.'),
  ('nodejs-releases', 'Node.js Releases', 'https://nodejs.org/en/feed/releases.xml', 'https://nodejs.org/en/download/releases', 'web', 'rss', 'official', 'Official Node.js release feed.'),
  ('mdn-blog', 'MDN Blog', 'https://developer.mozilla.org/en-US/blog/rss.xml', 'https://developer.mozilla.org/en-US/blog/', 'web', 'rss', 'official', 'Official MDN blog feed.'),
  ('chrome-developers', 'Chrome Developers', 'https://developer.chrome.com/feed.xml', 'https://developer.chrome.com/blog', 'web', 'rss', 'official', 'Official Chrome Developers blog feed.'),
  ('typescript-blog', 'TypeScript Blog', null, 'https://www.typescriptlang.org/blog', 'web', 'html_index', 'official', 'typescriptlang.org exposes no RSS/Atom feed (verified 404). Index-only source; DevPulse does not scrape it.'),
  ('vercel-blog', 'Vercel Blog', 'https://vercel.com/atom', 'https://vercel.com/blog', 'web', 'atom', 'official', 'Official Vercel Atom feed.'),
  ('stackoverflow-blog', 'Stack Overflow Blog', 'https://stackoverflow.blog/feed/', 'https://stackoverflow.blog/', 'web', 'rss', 'official', 'Official Stack Overflow blog feed.'),
  ('cloudflare-blog', 'Cloudflare Blog', 'https://blog.cloudflare.com/rss/', 'https://blog.cloudflare.com/', 'web', 'rss', 'trusted', 'Cloudflare engineering blog.'),

  ('github-blog', 'GitHub Blog', 'https://github.blog/feed/', 'https://github.blog/', 'opensource', 'rss', 'official', 'Official GitHub blog feed.'),
  ('github-changelog', 'GitHub Changelog', 'https://github.blog/changelog/feed/', 'https://github.blog/changelog/', 'opensource', 'rss', 'official', 'Official GitHub changelog feed.'),
  ('rust-blog', 'Rust Blog', 'https://blog.rust-lang.org/feed.xml', 'https://blog.rust-lang.org/', 'opensource', 'rss', 'official', 'Official Rust blog feed.'),
  ('cncf-blog', 'CNCF Blog', 'https://www.cncf.io/feed/', 'https://www.cncf.io/blog/', 'opensource', 'rss', 'official', 'Cloud Native Computing Foundation blog.'),
  ('netflix-techblog', 'Netflix TechBlog', 'https://netflixtechblog.com/feed', 'https://netflixtechblog.com/', 'opensource', 'rss', 'trusted', 'Netflix engineering blog.'),
  ('github-search', 'GitHub Search API', 'https://api.github.com/search/repositories', 'https://github.com/', 'opensource', 'json_api', 'official', 'Repository search via the GitHub REST API. Results are search hits scored by DevPulse, not GitHub Trending.'),

  ('cisa-advisories', 'CISA Advisories', 'https://www.cisa.gov/cybersecurity-advisories/all.xml', 'https://www.cisa.gov/cybersecurity-advisories', 'security', 'rss', 'official', 'Official CISA advisory feed.'),
  ('cisa-kev', 'CISA Known Exploited Vulnerabilities', 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', 'security', 'json_api', 'official', 'Authoritative catalog of vulnerabilities confirmed to be exploited.'),
  ('nvd-cve', 'NVD CVE API', 'https://services.nvd.nist.gov/rest/json/cves/2.0', 'https://nvd.nist.gov/', 'security', 'json_api', 'official', 'NIST National Vulnerability Database CVE feed.'),
  ('github-advisories', 'GitHub Security Advisories', 'https://api.github.com/advisories', 'https://github.com/advisories', 'security', 'json_api', 'official', 'GitHub Advisory Database via REST API.'),
  ('the-hacker-news', 'The Hacker News', 'https://feeds.feedburner.com/TheHackersNews', 'https://thehackernews.com/', 'security', 'rss', 'trusted', 'Established security news outlet.'),
  ('bleepingcomputer', 'BleepingComputer', 'https://www.bleepingcomputer.com/feed/', 'https://www.bleepingcomputer.com/', 'security', 'rss', 'trusted', 'Security news outlet.'),
  ('google-security-blog', 'Google Security Blog', 'https://security.googleblog.com/feeds/posts/default', 'https://security.googleblog.com/', 'security', 'rss', 'official', 'Official Google security blog feed.'),
  ('microsoft-security-blog', 'Microsoft Security Blog', 'https://www.microsoft.com/en-us/security/blog/feed/', 'https://www.microsoft.com/en-us/security/blog/', 'security', 'rss', 'official', 'Official Microsoft security blog feed.'),
  ('the-register-security', 'The Register Security', 'https://www.theregister.com/headlines.atom', 'https://www.theregister.com/Software/security/', 'security', 'atom', 'trusted', 'Security section of The Register.'),

  ('aws-blog', 'AWS News Blog', 'https://aws.amazon.com/blogs/aws/feed/', 'https://aws.amazon.com/blogs/aws/', 'cloud', 'rss', 'official', 'Official AWS blog feed.'),
  ('azure-blog', 'Azure Blog', 'https://azure.microsoft.com/en-us/blog/feed/', 'https://azure.microsoft.com/en-us/blog/', 'cloud', 'rss', 'official', 'Official Azure blog feed.'),
  ('google-cloud-blog', 'Google Cloud Blog', 'https://cloudblog.withgoogle.com/rss/', 'https://cloud.google.com/blog/products', 'cloud', 'rss', 'official', 'Official Google Cloud blog feed.'),
  ('docker-blog', 'Docker Blog', 'https://www.docker.com/blog/feed/', 'https://www.docker.com/blog/', 'cloud', 'rss', 'official', 'Official Docker blog feed.'),
  ('kubernetes-blog', 'Kubernetes Blog', 'https://kubernetes.io/feed.xml', 'https://kubernetes.io/blog/', 'cloud', 'rss', 'official', 'Official Kubernetes blog feed.'),
  ('hashicorp-blog', 'HashiCorp Blog', 'https://www.hashicorp.com/blog/feed.xml', 'https://www.hashicorp.com/blog', 'cloud', 'rss', 'official', 'Official HashiCorp blog feed.'),

  ('techcrunch', 'TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com/', 'industry', 'rss', 'trusted', 'Technology news outlet.'),
  ('the-verge', 'The Verge', 'https://www.theverge.com/rss/index.xml', 'https://www.theverge.com/', 'industry', 'rss', 'trusted', 'Technology news outlet.'),
  ('hacker-news', 'Hacker News', 'https://hnrss.org/frontpage', 'https://news.ycombinator.com/', 'industry', 'rss', 'trusted', 'HN front-page feed via hnrss.org.'),
  ('ars-technica', 'Ars Technica', 'https://arstechnica.com/feed/', 'https://arstechnica.com/', 'industry', 'rss', 'trusted', 'Technology news outlet.'),
  ('infoq', 'InfoQ', 'https://www.infoq.com/feed/', 'https://www.infoq.com/', 'industry', 'rss', 'trusted', 'Software engineering news.'),
  ('meta-engineering', 'Meta Engineering', 'https://engineering.fb.com/feed/', 'https://engineering.fb.com/', 'industry', 'rss', 'official', 'Official Meta engineering blog.'),

  ('remoteok', 'Remote OK', 'https://remoteok.com/api', 'https://remoteok.com/remote-jobs', 'jobs', 'json_api', 'trusted', 'Public job board API (JSON).'),
  ('weworkremotely', 'We Work Remotely', 'https://weworkremotely.com/remote-jobs.rss', 'https://weworkremotely.com/remote-jobs', 'jobs', 'rss', 'trusted', 'Remote job board RSS feed.'),
  ('arbeitnow', 'Arbeitnow', 'https://www.arbeitnow.com/api/job-board-api', 'https://www.arbeitnow.com/', 'jobs', 'json_api', 'trusted', 'Public job board API (JSON).')
on conflict (slug) do update
set name = excluded.name,
    feed_url = excluded.feed_url,
    site_url = excluded.site_url,
    category = excluded.category,
    source_type = excluded.source_type,
    reliability = excluded.reliability,
    notes = excluded.notes;
