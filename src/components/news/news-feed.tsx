import { ArticleCard } from "@/components/news/article-card";
import { Pagination } from "@/components/news/pagination";
import { EmptyState } from "@/components/ui/empty-state";
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
  if (result.items.length === 0) {
    return (
      <EmptyState
        title="কোনো নিবন্ধ পাওয়া যায়নি"
        description="ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন, অথবা অ্যাডমিন প্যানেল থেকে সিঙ্ক চালান।"
      />
    );
  }

  const bookmarked = new Set(bookmarkedIds);

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--muted-foreground)]">
        মোট {result.total} টি নিবন্ধ · পৃষ্ঠা {result.page}/{result.totalPages}
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
