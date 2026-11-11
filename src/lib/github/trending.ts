/**
 * DevReaderHub trending score.
 *
 * The GitHub Search API does not expose a ranking, and GitHub's own
 * "Trending" page is a private, undocumented heuristic. To stay honest, DevReaderHub
 * computes its own reproducible score over search results and labels it as
 * "DevReaderHub score" everywhere in the UI — never as "GitHub Trending".
 *
 * Formula (see docs/trending-score.md for the full rationale):
 *
 *   score = 4.0 * log10(stars + 1)
 *         + 2.0 * log10(forks + 1)
 *         + 6.0 * recencyScore
 *         + 3.0 * velocityScore
 *         + 1.5 * topicScore
 *
 *   recencyScore  = exp(-ageDays / 14)                      (0..1)
 *   velocityScore = log10(starsPerDay + 1) / log10(101)      (0..1, normalised)
 *   topicScore    = matched requested topics / requested topics (0..1)
 *
 * ageDays is measured from `pushed_at` (falling back to `updated_at` and then
 * `created_at`) to the collection time.
 */

export interface ScorableRepo {
  stars: number;
  forks: number;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  topics: string[] | null;
}

export interface TrendingScore {
  score: number;
  components: {
    starScore: number;
    forkScore: number;
    recencyScore: number;
    velocityScore: number;
    topicScore: number;
    ageDays: number;
    starsPerDay: number;
  };
}

const WEIGHT_STARS = 4.0;
const WEIGHT_FORKS = 2.0;
const WEIGHT_RECENCY = 6.0;
const WEIGHT_VELOCITY = 3.0;
const WEIGHT_TOPIC = 1.5;
const RECENCY_HALF_LIFE_DAYS = 14;
const VELOCITY_NORMALISER = Math.log10(101);

export function computeTrendingScore(
  repo: ScorableRepo,
  options?: { requestedTopics?: string[]; now?: Date },
): TrendingScore {
  const now = options?.now ?? new Date();
  const reference = repo.pushed_at ?? repo.updated_at ?? repo.created_at;
  const referenceTime = new Date(reference).getTime();
  const ageDays = Math.max(
    0,
    (now.getTime() - referenceTime) / (1000 * 60 * 60 * 24),
  );

  const stars = Math.max(0, repo.stars ?? 0);
  const forks = Math.max(0, repo.forks ?? 0);

  const starScore = Math.log10(stars + 1);
  const forkScore = Math.log10(forks + 1);

  const recencyScore = Math.exp(-ageDays / RECENCY_HALF_LIFE_DAYS);

  const createdTime = new Date(repo.created_at).getTime();
  const lifetimeDays = Math.max(1, (now.getTime() - createdTime) / (1000 * 60 * 60 * 24));
  const starsPerDay = stars / lifetimeDays;
  const velocityScore = Math.min(1, Math.log10(starsPerDay + 1) / VELOCITY_NORMALISER);

  let topicScore = 0;
  const requestedTopics = options?.requestedTopics ?? [];
  if (requestedTopics.length > 0) {
    const repoTopics = (repo.topics ?? []).map((topic) => topic.toLowerCase());
    const matched = requestedTopics.filter((topic) =>
      repoTopics.includes(topic.toLowerCase()),
    ).length;
    topicScore = matched / requestedTopics.length;
  }

  const score =
    WEIGHT_STARS * starScore +
    WEIGHT_FORKS * forkScore +
    WEIGHT_RECENCY * recencyScore +
    WEIGHT_VELOCITY * velocityScore +
    WEIGHT_TOPIC * topicScore;

  return {
    score: Math.round(score * 1000) / 1000,
    components: {
      starScore: Math.round(starScore * 1000) / 1000,
      forkScore: Math.round(forkScore * 1000) / 1000,
      recencyScore: Math.round(recencyScore * 1000) / 1000,
      velocityScore: Math.round(velocityScore * 1000) / 1000,
      topicScore: Math.round(topicScore * 1000) / 1000,
      ageDays: Math.round(ageDays * 10) / 10,
      starsPerDay: Math.round(starsPerDay * 100) / 100,
    },
  };
}

export function scoreAndSort<T extends ScorableRepo>(
  repos: T[],
  options?: { requestedTopics?: string[]; now?: Date },
): Array<T & { score: number; scoreComponents: TrendingScore["components"] }> {
  return repos
    .map((repo) => {
      const result = computeTrendingScore(repo, options);
      return { ...repo, score: result.score, scoreComponents: result.components };
    })
    .sort((a, b) => b.score - a.score);
}