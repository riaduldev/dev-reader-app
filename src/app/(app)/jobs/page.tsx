import type { Metadata } from "next";

import { NewsFeed } from "@/components/news/news-feed";
import { NewsFilters } from "@/components/news/news-filters";
import { PageHeader } from "@/components/ui/page-header";
import { listArticles } from "@/lib/db/articles";
import { describeDbError, getSchemaStatus, isMissingSchemaError } from "@/lib/db/schema";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { listBookmarkedArticleIds } from "@/lib/db/user";
import { getSession } from "@/lib/auth/session";
import { isConfigured } from "@/lib/env";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.jobs.title, description: t.jobs.description };
}

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string; sort?: string; page?: string }>;
}) {
  const query = await searchParams;
  const t = await getDictionaryForRequest();
  const page = Number(query.page ?? "1") || 1;
  const sort =
    query.sort === "oldest" || query.sort === "importance" ? query.sort : "latest";

  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");
  const session = await getSession();

  let result = null;
  let bookmarkedIds: string[] = [];
  let error: string | null = null;
  let schemaMissing = false;

  if (dbConfigured) {
    try {
      result = await listArticles({
        category: "jobs",
        q: query.q,
        from: query.from ? new Date(query.from).toISOString() : undefined,
        to: query.to ? new Date(`${query.to}T23:59:59`).toISOString() : undefined,
        sort,
        page,
        pageSize: 12,
      });
      if (session.user) {
        bookmarkedIds = await listBookmarkedArticleIds(session.user.id);
      }
    } catch (err) {
      schemaMissing = isMissingSchemaError(err);
      error = schemaMissing
        ? await describeDbError(err)
        : err instanceof Error
          ? err.message
          : t.errors.articlesLoad;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.jobs.title}
        description={t.jobs.description}
      />

      <NewsFilters basePath="/jobs" />

      {schemaMissing && (
        <SchemaSetupNotice initialStatus={await getSchemaStatus()} />
      )}

      {error && !schemaMissing && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {result && (
        <NewsFeed
          result={result}
          basePath="/jobs"
          linkParams={{
            q: query.q,
            from: query.from,
            to: query.to,
            sort: query.sort,
          }}
          canBookmark={Boolean(session.user)}
          bookmarkedIds={bookmarkedIds}
        />
      )}
    </div>
  );
}
