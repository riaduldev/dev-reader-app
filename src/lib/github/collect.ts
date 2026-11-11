import { searchRepositories, type GithubSearchResult } from "@/lib/github/client";
import { storeGithubRepos } from "@/lib/db/github";

export interface GithubCollectResult {
  total: number;
  stored: number;
  durationMs: number;
  warnings: string[];
  queries: string[];
}

const DEFAULT_QUERIES = [
  {
    label: "recently created",
    query: "stars:>10 created:>=@SINCE@",
    sort: "stars" as const,
  },
  {
    label: "recently updated",
    query: "stars:>10 pushed:>=@SINCE@",
    sort: "updated" as const,
  },
  {
    label: "highly starred",
    query: "stars:>500 pushed:>=@SINCE@",
    sort: "stars" as const,
  },
];

export interface GithubCollectOptions {
  /** Window used for the `created:`/`pushed:` qualifiers. */
  windowInDays?: number;
  perPage?: number;
  topics?: string[];
  language?: string;
}

/**
 * Collects repository candidates through the GitHub Search REST API.
 *
 * These are *search results*, not GitHub's official Trending ranking — the
 * UI labels them with the DevReaderHub score instead.
 */
export async function collectGithubRepositories(
  options: GithubCollectOptions = {},
): Promise<GithubCollectResult> {
  const started = Date.now();
  const warnings: string[] = [];
  const windowInDays = options.windowInDays ?? 30;
  const since = new Date(Date.now() - windowInDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const perPage = Math.min(100, options.perPage ?? 30);

  const requestedTopics = options.topics ?? [];
  const topicQualifier = requestedTopics.length
    ? ` topic:${requestedTopics[0]}`
    : "";
  const languageQualifier = options.language ? ` language:${options.language}` : "";

  const queries = DEFAULT_QUERIES.map((entry) => ({
    ...entry,
    query: entry.query
      .replace("@SINCE@", since)
      .concat(topicQualifier, languageQualifier),
  }));

  let stored = 0;
  let total = 0;
  const seen = new Set<string>();

  for (const entry of queries) {
    let result: GithubSearchResult;
    try {
      result = await searchRepositories({
        query: entry.query,
        sort: entry.sort,
        perPage,
        page: 1,
      });
    } catch (error) {
      warnings.push(
        `${entry.label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    total += result.items.length;
    const fresh = result.items.filter((item) => {
      if (seen.has(item.full_name)) return false;
      seen.add(item.full_name);
      return true;
    });

    try {
      stored += await storeGithubRepos(fresh, entry.query, requestedTopics);
    } catch (error) {
      warnings.push(
        `Storing results for "${entry.label}" failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return {
    total,
    stored,
    durationMs: Date.now() - started,
    warnings,
    queries: queries.map((entry) => entry.query),
  };
}
