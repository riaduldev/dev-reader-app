# DevReaderHub trending score

> **This is not GitHub Trending.**
> GitHub's Trending page is a private, undocumented heuristic. DevReaderHub uses the
> **GitHub Search REST API** (`GET /search/repositories`) and computes its own
> reproducible score on top of those results. The UI always labels the number as
> “DevReaderHub স্কোর” and links to this document.

Implementation: `src/lib/github/trending.ts` (pure functions, unit-tested in
`tests/trending.test.ts`).

---

## Inputs

| Field | Source |
|---|---|
| `stars` | `stargazers_count` |
| `forks` | `forks_count` |
| `created_at` | repository creation date |
| `pushed_at` | last push (falls back to `updated_at`, then `created_at`) |
| `topics` | repository topics, compared against the requested topics |
| `collected_at` | the moment DevReaderHub stored the result |

---

## Formula

```
score = 4.0 * starScore
      + 2.0 * forkScore
      + 6.0 * recencyScore
      + 3.0 * velocityScore
      + 1.5 * topicScore
```

| Component | Definition | Range |
|---|---|---|
| `starScore` | `log10(stars + 1)` | 0 … ∞ (log-compressed) |
| `forkScore` | `log10(forks + 1)` | 0 … ∞ (log-compressed) |
| `recencyScore` | `exp(-ageDays / 14)` where `ageDays` is the time since the last push | 0 … 1 |
| `velocityScore` | `min(1, log10(starsPerDay + 1) / log10(101))` where `starsPerDay = stars / lifetimeDays` | 0 … 1 |
| `topicScore` | `matched requested topics / requested topics` | 0 … 1 |

### Why these weights

* **Stars dominate, but logarithmically.** A repository with 10 000 stars is
  not ten times more interesting than one with 1 000 stars — it is roughly
  twice as interesting to a developer. `log10` encodes that.
* **Forks count half as much as stars.** Forks signal real usage, but with a
  smaller signal-to-noise ratio.
* **Recency is the strongest single factor.** News intelligence is about what
  is happening *now*. A 14-day exponential half-life means a repository pushed
  today scores ~1.0, one pushed a month ago ~0.08.
* **Velocity rewards fast-growing projects.** A repository that collected all
  of its stars in a week is much more interesting than an old project with the
  same star count. The divisor normalises the value to 0 … 1.
* **Topics are a small bonus.** They only matter when the collection was
  requested with specific topics (for example `topic:react`).

The score components are stored per repository in
`github_repos.score_components`, together with the exact query string
(`github_repos.query`) and the collection timestamp (`collected_at`), so every
ranking can be reproduced and audited later.

---

## Collection queries

`src/lib/github/collect.ts` runs three searches per collection cycle:

| Label | Query |
|---|---|
| recently created | `stars:>10 created:>=<since>` |
| recently updated | `stars:>10 pushed:>=<since>` |
| highly starred | `stars:>500 pushed:>=<since>` |

`<since>` defaults to 30 days ago. Optional `topic:` and `language:`
qualifiers are appended when configured.

---

## Rate limits

The GitHub Search API allows **10 requests/minute** for authenticated requests
and **30 requests/hour** for unauthenticated ones. DevReaderHub:

* sends `GITHUB_TOKEN` when it is configured (raising the limit to 30/min),
* detects `403`/`429` responses and surfaces them as an explicit
  “rate limit reached” error instead of silently returning no results,
* exposes the remaining/reset counters from the `x-ratelimit-*` headers.
