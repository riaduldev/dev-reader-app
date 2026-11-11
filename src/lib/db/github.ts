import { createReadClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import type { DatabaseGithubRepo } from "@/lib/db/types";
import type { GithubRepoRaw } from "@/lib/github/client";
import { scoreAndSort } from "@/lib/github/trending";

export interface GithubRepoQuery {
  query: string;
  page?: number;
  perPage?: number;
  language?: string;
  topic?: string;
  sort?: "stars" | "updated" | "created";
  requestedTopics?: string[];
}

export interface GithubRepoView {
  full_name: string;
  owner: string;
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  license: string | null;
  topics: string[];
  githubCreatedAt: string | null;
  githubUpdatedAt: string | null;
  githubPushedAt: string | null;
  score: number;
  scoreComponents: Record<string, number> | null;
  query: string | null;
  collectedAt: string;
}

function toView(row: DatabaseGithubRepo): GithubRepoView {
  const components = (row.score_components ?? {}) as Record<string, number>;
  return {
    full_name: row.full_name,
    owner: row.owner ?? row.full_name.split("/")[0] ?? "",
    name: row.name ?? row.full_name,
    description: row.description,
    url: row.url,
    homepage: row.homepage,
    stars: row.stars,
    forks: row.forks,
    watchers: row.watchers,
    openIssues: row.open_issues,
    language: row.language,
    license: row.license,
    topics: row.topics ?? [],
    githubCreatedAt: row.github_created_at,
    githubUpdatedAt: row.github_updated_at,
    githubPushedAt: row.github_pushed_at,
    score: row.score,
    scoreComponents: Object.keys(components).length > 0 ? components : null,
    query: row.query,
    collectedAt: row.collected_at,
  };
}

export async function listGithubRepos(options: {
  page?: number;
  perPage?: number;
  category?: string;
} = {}): Promise<GithubRepoView[]> {
  const supabase = await createReadClient();
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(50, Math.max(1, options.perPage ?? 12));
  const from = (page - 1) * perPage;

  const { data, error } = await supabase
    .from("github_repos")
    .select("*")
    .order("score", { ascending: false })
    .order("stars", { ascending: false })
    .range(from, from + perPage - 1);
  if (error) {
    throw new Error(`Failed to list GitHub repositories: ${error.message}`);
  }
  return ((data ?? []) as DatabaseGithubRepo[]).map(toView);
}

export async function listGithubRepoCount(): Promise<number> {
  const supabase = await createReadClient();
  const { count } = await supabase
    .from("github_repos")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

/** Stores freshly collected search results with their DevReaderHub score. */
export async function storeGithubRepos(
  repos: GithubRepoRaw[],
  query: string,
  requestedTopics: string[] = [],
): Promise<number> {
  if (repos.length === 0) return 0;

  const supabase = createServiceSupabaseClient();
  const now = new Date();
  const scored = scoreAndSort(
    repos.map((repo) => ({
      repo,
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      topics: repo.topics ?? [],
    })),
    { requestedTopics, now },
  );

  const rows = scored.map((entry) => ({
    full_name: entry.repo.full_name,
    owner: entry.repo.owner?.login ?? entry.repo.full_name.split("/")[0] ?? null,
    name: entry.repo.name,
    description: entry.repo.description,
    url: entry.repo.html_url,
    homepage: entry.repo.homepage,
    stars: entry.repo.stargazers_count ?? 0,
    forks: entry.repo.forks_count ?? 0,
    watchers: entry.repo.watchers_count ?? 0,
    open_issues: entry.repo.open_issues_count ?? 0,
    language: entry.repo.language,
    license: entry.repo.license?.spdx_id ?? entry.repo.license?.name ?? null,
    topics: entry.repo.topics ?? [],
    github_created_at: entry.repo.created_at,
    github_updated_at: entry.repo.updated_at,
    github_pushed_at: entry.repo.pushed_at,
    score: entry.score,
    score_components: entry.scoreComponents,
    query,
    collected_at: now.toISOString(),
  }));

  const { error } = await supabase
    .from("github_repos")
    .upsert(rows, { onConflict: "full_name" });
  if (error) {
    throw new Error(`Failed to store GitHub repositories: ${error.message}`);
  }
  return rows.length;
}
