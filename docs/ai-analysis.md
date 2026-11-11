# AI analysis (Bangla)

DevReaderHub can enrich an article with a structured, Bangla-language analysis.
The call is made **server-side only** — the API key never reaches the browser.

Implementation: `src/lib/ai/analyze.ts` · schema tests: `tests/ai.test.ts`.

---

## Configuration

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | required; without it the analysis step is skipped entirely |
| `OPENAI_MODEL` | model id, default `gpt-4o-mini` |
| `OPENAI_BASE_URL` | optional, for OpenAI-compatible gateways |
| `AI_IMPORTANCE_THRESHOLD` | only articles with a pre-analysis importance ≥ this value are analysed (1–5, default 3) |
| `AI_MAX_ARTICLES_PER_RUN` | hard cap per ingestion run (default 40) |

---

## Requested JSON shape

```json
{
  "summary_bn": "বাংলায় সংক্ষিপ্ত সংবাদ",
  "why_it_matters": "কেন এটি গুরুত্বপূর্ণ",
  "developer_impact": "Developer-দের ওপর প্রভাব",
  "practical_action": "কী শেখা বা করা উচিত",
  "importance_score": 1,
  "tags": ["React", "JavaScript"],
  "confidence": "high",
  "fact_status": "confirmed"
}
```

The request uses the OpenAI **structured outputs** mode
(`response_format: { type: "json_schema", strict: true }`) with the same
schema, and the response is validated again with Zod
(`aiAnalysisSchema`) before anything is written to the database.

If the model returns something that does not match the schema, the article is
left **unprocessed** (no partial data is stored) and can be retried on a later
run. DevReaderHub never invents or back-fills an analysis.

---

## System prompt rules

The model is instructed to:

* write every prose field in natural Bangla while keeping technical terms
  (React, Next.js, TypeScript, LLM, CVE, Kubernetes, API …) in English,
* never invent facts, CVE identifiers, version numbers, quotes or links,
* use only what the provided article states,
* report `fact_status` honestly:
  * `confirmed` — the source itself states the facts,
  * `reported` — the article reports a claim made by another party,
  * `unverified` — the article is speculative or unconfirmed.

---

## Cost control

1. During ingestion every article receives a **deterministic importance score**
   (1–5) from `scoreImportance()` (`src/lib/ingestion/importance.ts`). It is
   based on the category, high-impact keywords ("launches", "vulnerability",
   "acquires", "outage", …), the number of matched category terms and the
   reliability of the source.
2. Only articles whose score is ≥ `AI_IMPORTANCE_THRESHOLD` are sent to the
   model, and only up to `AI_MAX_ARTICLES_PER_RUN` per run.
3. `ai_processed_at` guarantees an article is analysed **once**. Re-running the
   ingestion never re-charges the same article.
4. After a successful analysis the stored `importance` column is replaced by
   the model's own `importance_score`.

---

## Storage

| Column | Content |
|---|---|
| `ai_summary_bn` | Bangla summary |
| `ai_why_it_matters` | why it matters |
| `ai_developer_impact` | impact on developers |
| `ai_practical_action` | practical next step |
| `ai_tags` | technical tags (array) |
| `ai_confidence` | `low` / `medium` / `high` |
| `ai_fact_status` | `confirmed` / `reported` / `unverified` |
| `ai_model` | the model that produced the analysis |
| `ai_processed_at` | timestamp (also used as the “already processed” marker) |

The UI labels AI-generated statements separately from source-confirmed facts.
