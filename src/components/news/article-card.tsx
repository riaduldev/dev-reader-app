import { ExternalLink, Flame, Tag } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BookmarkButton } from "@/components/news/bookmark-button";
import { ArticleLink } from "@/components/news/article-link";
import { categoryLabel } from "@/lib/categories";
import type { DatabaseArticle } from "@/lib/db/types";
import { importanceLabel } from "@/lib/ingestion/importance";
import { relativeTimeBn, truncate } from "@/lib/utils";

export function ArticleCard({
  article,
  bookmarked = false,
  canBookmark = false,
  showAi = true,
}: {
  article: DatabaseArticle;
  bookmarked?: boolean;
  canBookmark?: boolean;
  showAi?: boolean;
}) {
  const summary = article.ai_summary_bn ?? article.description;
  const tags = (article.ai_tags ?? []).slice(0, 4);

  return (
    <Card className="group flex flex-col gap-3 p-4 transition-colors hover:border-[var(--border-strong)] sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{categoryLabel(article.category)}</Badge>
        {article.importance ? (
          <Badge
            variant={article.importance >= 4 ? "danger" : article.importance === 3 ? "warning" : "outline"}
          >
            {article.importance >= 4 && <Flame className="size-3" />}
            {importanceLabel(article.importance)}
          </Badge>
        ) : null}
        {article.ai_fact_status && (
          <Badge variant={article.ai_fact_status === "confirmed" ? "success" : "outline"}>
            {article.ai_fact_status === "confirmed"
              ? "সোর্স নিশ্চিত"
              : article.ai_fact_status === "reported"
                ? "রিপোর্ট করা"
                : "অযাচাইকৃত"}
          </Badge>
        )}
        <span className="text-xs text-[var(--muted-foreground)]">
          {article.sources?.name ?? "অজানা সোর্স"}
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">·</span>
        <time
          className="text-xs text-[var(--muted-foreground)]"
          dateTime={article.published_at}
        >
          {relativeTimeBn(article.published_at)}
        </time>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold leading-snug tracking-tight">
          <ArticleLink
            articleId={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[var(--accent)]"
          >
            {article.title}
          </ArticleLink>
        </h3>
        {summary && (
          <p className="line-clamp-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {truncate(summary, 260)}
          </p>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="size-3 text-[var(--muted-foreground)]" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--muted-foreground)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/article/${article.id}`}
            className="text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--accent)]"
          >
            বিস্তারিত
          </Link>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--accent)]"
          >
            মূল নিবন্ধ
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        {canBookmark && (
          <BookmarkButton
            articleId={article.id}
            initialBookmarked={bookmarked}
            showAi={showAi}
          />
        )}
      </div>
    </Card>
  );
}

export function ArticleCardSkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex gap-2">
        <div className="skeleton h-5 w-24 rounded-md" />
        <div className="skeleton h-5 w-16 rounded-md" />
      </div>
      <div className="skeleton h-5 w-full rounded-md" />
      <div className="skeleton h-5 w-3/4 rounded-md" />
      <div className="skeleton h-4 w-full rounded-md" />
      <div className="skeleton h-4 w-2/3 rounded-md" />
    </Card>
  );
}

export function ArticleListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ArticleCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategoryLink({ category }: { category: string }) {
  return (
    <Link
      href={`/category/${category}`}
      className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
    >
      {categoryLabel(category)}
    </Link>
  );
}
