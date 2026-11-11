# DevReaderHub — Ingestion, Source Registry & Limitations

DevReaderHub collects developer technology news from a curated registry of sources,
normalises the items, categorises them, deduplicates them and (optionally)
runs an AI analysis on the most relevant ones.

Everything in this document describes what the code actually does
(`src/lib/ingestion/*`, `src/lib/db/*`, `supabase/migrations/0001_init.sql`).

---

## 1. Collection pipeline

| # | Step | Implementation |
|---|------|----------------|
| 1 | Load active sources | `listSources({ activeOnly: true })` |
| 2 | Fetch feed / API data with timeouts and retries | `src/lib/ingestion/http.ts` |
| 3 | Parse, validate and normalise | `src/lib/ingestion/feeds.ts`, `src/lib/ingestion/apis.ts`, `src/lib/ingestion/normalize.ts` |
| 4 | Validate title, URL, publication date, description | Zod schema `normalizedItemSchema` |
| 5 | Categorise | `src/lib/ingestion/classify.ts` |
| 6 | Apply the lookback window (default 24 h) | `INGEST_LOOKBACK_HOURS` |
| 7 | Detect duplicates / enforce URL uniqueness | Canonical URL + SHA-256 hash, `articles.url UNIQUE` |
| 8 | AI analysis for eligible, unprocessed articles | `src/lib/ai/analyze.ts` |
| 9 | Store results in PostgreSQL | `src/lib/db/articles.ts` |
| 10 | Record run status, per-source outcomes and errors | `ingestion_runs`, `ingestion_run_items` |

### Error handling

* A failing source never stops the others — sources are processed through a
  small worker pool (`concurrency`, default 4) and each result is isolated.
* Transient failures (network errors, timeouts, HTTP 408/425/429/5xx) are
  retried with exponential backoff plus jitter (1 s → 2 s → 4 s, capped at
  30 s). `Retry-After` is honoured for 429 responses.
* Malformed feeds, missing dates and invalid URLs are skipped and counted;
  they never become articles.
* A source is marked **successful** only after its HTTP request and parsing
  succeeded. `last_success_at`, `last_error`, `last_error_at` and
  `consecutive_failures` are kept on the `sources` row.
* Every run is written to `ingestion_runs`, and every per-source outcome to
  `ingestion_run_items` (status, item count, new count, duplicate count,
  duration, error message). The admin UI shows both.
* Duplicate articles are never re-processed and never re-charged for AI
  analysis: `ai_processed_at` marks an article as done.

---

## 2. Categorisation rules

`classifyArticle()` scores the title + description against the keyword list of
every category (`src/lib/categories.ts`).

1. The **source category** wins when the text contains at least two distinct
   keyword hits for it and no other category scores higher.
2. Otherwise the category with the most keyword hits wins.
3. A **single** hit on an unambiguous keyword (`cve-`, `cisa`, `nvd`,
   `vulnerabilit`, `hiring`, `we are hiring`, `apply now`, `openai`,
   `chatgpt`, `llm`, `kubernetes`, `docker`, `terraform`, `next.js`,
   `node.js`, `typescript`, `javascript`, …) also moves the article to that
   category — a single generic word such as "release" never overrides the
   source category.
4. With no hits at all the article falls back to the source category, or to
   `industry` when the source has no category either.

Job postings are additionally detected with `looksLikeJobPosting()` and moved
to the `jobs` category.

---

## 3. Source registry

The registry lives in the `sources` table and is seeded by
`supabase/migrations/0001_init.sql`. Every feed URL below was verified to
respond with `2xx` and a parseable feed before being added.

| Category | Source | Type | Reliability |
|---|---|---|---|
| AI | OpenAI News, OpenAI Blog | RSS | official |
| AI | Anthropic News | index only (no feed) | official |
| AI | Google AI Blog, Google DeepMind, Hugging Face Blog | RSS | official |
| Web | React, Next.js, Node.js Blog, Node.js Releases, MDN, Chrome Developers, Vercel (Atom), Stack Overflow Blog, Cloudflare Blog | RSS/Atom | official/trusted |
| Web | TypeScript Blog | index only (no feed) | official |
| Open source | GitHub Blog, GitHub Changelog, Rust Blog, CNCF Blog, Netflix TechBlog | RSS | official/trusted |
| Open source | GitHub Search API | JSON API | official |
| Security | CISA Advisories | RSS | official |
| Security | CISA Known Exploited Vulnerabilities | JSON API | official |
| Security | NVD CVE API 2.0 | JSON API | official |
| Security | GitHub Security Advisories | JSON API | official |
| Security | The Hacker News, BleepingComputer, The Register Security | RSS/Atom | trusted |
| Security | Google Security Blog, Microsoft Security Blog | RSS | official |
| Cloud | AWS News, Azure Blog, Google Cloud Blog, Docker Blog, Kubernetes Blog, HashiCorp Blog | RSS | official |
| Industry | TechCrunch, The Verge, Hacker News, Ars Technica, InfoQ, Meta Engineering | RSS/Atom | trusted/official |
| Jobs | Remote OK (JSON API), We Work Remotely (RSS), Arbeitnow (JSON API) | JSON/RSS | trusted |

### Sources without a machine-readable feed

* **Anthropic News** — `anthropic.com/rss.xml` and `anthropic.com/news/rss.xml`
  both return `404`. The source is registered with type `html_index`, so
  DevReaderHub stores the link and the notes but **never scrapes the page**.
* **TypeScript Blog** — `typescriptlang.org/rss.xml` returns `404`; registered
  as `html_index` for the same reason.
* **OWASP blog** (`blog.owasp.org/feed`) did not respond during verification
  and is therefore **not** part of the registry.

Only RSS, Atom and officially published JSON APIs are collected. DevReaderHub does
not parse HTML pages, does not bypass paywalls and does not ignore
`robots.txt`; attribution is preserved by always linking back to the original
article.

### Adding a source

Admins can add sources in **Settings → সোর্স ম্যানেজমেন্ট** (`/admin/sources`).
A new JSON-API source needs an adapter in `src/lib/ingestion/apis.ts`; the
engine refuses unknown adapters with an explicit error instead of guessing.

---

## 4. Scheduled collection

* `vercel.json` runs `/api/cron/ingest` every two hours.
* The endpoint requires `Authorization: Bearer $CRON_SECRET`; requests without
  the correct secret get `401`.
* The interval, lookback window, retry count and AI budget are configurable
  through environment variables (see `.env.example`).
* Manual runs: the top-bar refresh button (`POST /api/refresh`, authenticated)
  and the admin page (`POST /api/admin/ingest`, admin only) run the same
  engine with a smaller scope.
