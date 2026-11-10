import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NewsFeed } from "@/components/news/news-feed";
import { NewsFilters } from "@/components/news/news-filters";
import { PageHeader } from "@/components/ui/page-header";
import { listArticles } from "@/lib/db/articles";
import { listBookmarkedArticleIds } from "@/lib/db/user";
import { getSession } from "@/lib/auth/session";
import { CATEGORY_MAP, isCategoryId } from "@/lib/categories";
import { isConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isCategoryId(slug)) return { title: "ক্যাটাগরি" };
  const category = CATEGORY_MAP[slug];
  return { title: category.label, description: category.description };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; from?: string; to?: string; sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  if (!isCategoryId(slug)) {
    notFound();
  }
  const category = CATEGORY_MAP[slug];
  const query = await searchParams;
  const page = Number(query.page ?? "1") || 1;
  const sort =
    query.sort === "oldest" || query.sort === "importance" ? query.sort : "latest";

  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");
  const session = await getSession();

  let result = null;
  let bookmarkedIds: string[] = [];
  let error: string | null = null;

  if (dbConfigured) {
    try {
      result = await listArticles({
        category: slug,
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
      error = err instanceof Error ? err.message : "নিবন্ধ লোড করা যায়নি।";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={category.label} description={category.description} />

      <NewsFilters basePath={`/category/${slug}`} />

      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {result && (
        <NewsFeed
          result={result}
          basePath={`/category/${slug}`}
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
