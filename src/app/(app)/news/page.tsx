import type { Metadata } from "next";

import { NewsFeed } from "@/components/news/news-feed";
import { NewsFilters } from "@/components/news/news-filters";
import { PageHeader } from "@/components/ui/page-header";
import { listArticles } from "@/lib/db/articles";
import { listBookmarkedArticleIds } from "@/lib/db/user";
import { getSession } from "@/lib/auth/session";
import { isConfigured } from "@/lib/env";
import { strings } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "সর্বশেষ খবর",
};

export const dynamic = "force-dynamic";

export default async function LatestNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const sort =
    params.sort === "oldest" || params.sort === "importance" ? params.sort : "latest";

  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");
  const session = await getSession();

  let result = null;
  let bookmarkedIds: string[] = [];
  let error: string | null = null;

  if (dbConfigured) {
    try {
      result = await listArticles({
        q: params.q,
        from: params.from ? new Date(params.from).toISOString() : undefined,
        to: params.to ? new Date(`${params.to}T23:59:59`).toISOString() : undefined,
        sort,
        page,
        pageSize: 12,
      });
      if (session.user) {
        bookmarkedIds = await listBookmarkedArticleIds(session.user.id);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "নিবন্ধ লোড করা যায়নি।";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={strings.nav.latest}
        description="গত ২৪ ঘণ্টার সব সংগৃহীত নিবন্ধ — ফিল্টার, সর্ট ও পেজিনেশন সহ।"
      />

      <NewsFilters basePath="/news" />

      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {result && (
        <NewsFeed
          result={result}
          basePath="/news"
          linkParams={{
            q: params.q,
            from: params.from,
            to: params.to,
            sort: params.sort,
          }}
          canBookmark={Boolean(session.user)}
          bookmarkedIds={bookmarkedIds}
        />
      )}
    </div>
  );
}
