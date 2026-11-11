import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GithubRepoCard } from "@/components/github/repo-card";
import { Pagination } from "@/components/news/pagination";
import { getDictionaryForRequest } from "@/lib/i18n/server";
import { listGithubRepos, listGithubRepoCount } from "@/lib/db/github";
import { isConfigured } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.github.title };
}

export const dynamic = "force-dynamic";

export default async function GithubPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const t = await getDictionaryForRequest();
  const page = Number(params.page ?? "1") || 1;
  const perPage = 12;

  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");

  let repos: Awaited<ReturnType<typeof listGithubRepos>> = [];
  let total = 0;
  let error: string | null = null;

  if (dbConfigured) {
    try {
      [repos, total] = await Promise.all([
        listGithubRepos({ page, perPage }),
        listGithubRepoCount(),
      ]);
    } catch (err) {
      error = err instanceof Error ? err.message : t.errors.articlesLoad;
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <PageHeader title={t.github.title} description={t.github.description} />

      <Card className="border-[var(--info)]/40 bg-[var(--info-soft)]">
        <CardContent className="p-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">Note: </span>
          {t.github.disclaimer}
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {repos.length === 0 ? (
        <EmptyState
          title={t.empty.reposTitle}
          description={t.empty.reposBody}
        />
      ) : (
        <>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t.common.total} {total} {t.common.results} · {t.common.page} {page}/
            {totalPages}
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {repos.map((repo) => (
              <GithubRepoCard key={repo.full_name} repo={repo} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/github"
            params={{}}
          />
        </>
      )}
    </div>
  );
}
