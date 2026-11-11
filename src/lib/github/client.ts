import { env } from "@/lib/env";

export type GithubSort = "stars" | "forks" | "updated" | "help-wanted-issues" | "created";

export interface GithubSearchOptions {
  /** Free-text query terms, already escaped for the GitHub search syntax. */
  query: string;
  sort?: GithubSort;
  order?: "asc" | "desc";
  page?: number;
  perPage?: number;
  language?: string;
  topic?: string;
  createdAfter?: string;
}

export interface GithubRepoRaw {
  id: number;
  full_name: string;
  owner: { login: string } | null;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  license: { spdx_id: string | null; name: string } | null;
  topics?: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
}

export interface GithubSearchResult {
  items: GithubRepoRaw[];
  totalCount: number;
  incompleteResults: boolean;
  rateLimitRemaining: number | null;
  rateLimitReset: Date | null;
}

export class GithubApiError extends Error {
  status: number;
  rateLimitRemaining: number | null;
  rateLimitReset: Date | null;

  constructor(
    message: string,
    status: number,
    rateLimitRemaining: number | null = null,
    rateLimitReset: Date | null = null,
  ) {
    super(message);
    this.name = "GithubApiError";
    this.status = status;
    this.rateLimitRemaining = rateLimitRemaining;
    this.rateLimitReset = rateLimitReset;
  }
}

function headers(): Record<string, string> {
  const base: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DevReaderHub/0.1 (+https://github.com)",
  };
  const token = env().GITHUB_TOKEN;
  if (token) {
    base.Authorization = `Bearer ${token}`;
  }
  return base;
}

function parseRateLimit(response: Response) {
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  return {
    remaining: remaining === null ? null : Number(remaining),
    reset: reset === null ? null : new Date(Number(reset) * 1000),
  };
}

/** Escapes a value for use inside a GitHub search qualifier (`topic:`, `language:`). */
export function escapeQualifier(value: string): string {
  return value.replace(/["\\]/g, " ").trim();
}

export async function searchRepositories(
  options: GithubSearchOptions,
): Promise<GithubSearchResult> {
  const params = new URLSearchParams();
  params.set("q", options.query);
  params.set("sort", options.sort ?? "stars");
  params.set("order", options.order ?? "desc");
  params.set("page", String(options.page ?? 1));
  params.set("per_page", String(Math.min(100, options.perPage ?? 30)));

  const response = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
    headers: headers(),
    next: { revalidate: 900 },
  });

  const limit = parseRateLimit(response);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    if (response.status === 403 || response.status === 429) {
      throw new GithubApiError(
        `GitHub API rate limit reached (${response.status}). Add GITHUB_TOKEN to raise the limit from 10 requests/minute to 30.${body ? ` ${body.slice(0, 200)}` : ""}`,
        response.status,
        limit.remaining,
        limit.reset,
      );
    }
    throw new GithubApiError(
      `GitHub API request failed (${response.status}): ${body.slice(0, 300)}`,
      response.status,
      limit.remaining,
      limit.reset,
    );
  }

  const json = (await response.json()) as {
    total_count: number;
    incomplete_results: boolean;
    items: GithubRepoRaw[];
  };

  return {
    items: json.items ?? [],
    totalCount: json.total_count ?? 0,
    incompleteResults: Boolean(json.incomplete_results),
    rateLimitRemaining: limit.remaining,
    rateLimitReset: limit.reset,
  };
}

export interface GithubRateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  resource: string;
}

export async function getRateLimit(): Promise<GithubRateLimit | null> {
  const response = await fetch("https://api.github.com/rate_limit", {
    headers: headers(),
    next: { revalidate: 60 },
  });
  if (!response.ok) return null;
  const json = (await response.json()) as {
    resources?: Record<string, { limit: number; remaining: number; reset: number }>;
  };
  const core = json.resources?.core;
  const search = json.resources?.search;
  const target = search && search.remaining > 0 ? search : core;
  if (!target) return null;
  return {
    limit: target.limit,
    remaining: target.remaining,
    reset: new Date(target.reset * 1000),
    resource: search && search.remaining > 0 ? "search" : "core",
  };
}
