"use client";

import { ArticleCard } from "@/components/news/article-card";
import { Pagination } from "@/components/news/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/client";
import type { ArticleListResult } from "@/lib/db/articles";

export function NewsFeed({
  result,
  basePath,
  linkParams,
  canBookmark = false,
  bookmarkedIds = [],
}: {
  result: ArticleListResult;
  basePath: string;
  linkParams?: Record<string, string | undefined>;
  canBookmark?: boolean;
  bookmarkedIds?: string[];
}) {
  const t = useT();

  if (result.items.length === 0) {
    return (
      <EmptyState
        title={t.empty.filterTitle}
        description={t.empty.filterBody}
      />
    );
  }

  const bookmarked = new Set(bookmarkedIds);

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--muted-foreground)]">
        {t.common.total} {result.total} {t.common.results} · {t.common.page}{" "}
        {result.page}/{result.totalPages}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {result.items.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            canBookmark={canBookmark}
            bookmarked={bookmarked.has(article.id)}
          />
        ))}
      </div>
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath={basePath}
        params={linkParams}
      />
    </div>
  );
}
