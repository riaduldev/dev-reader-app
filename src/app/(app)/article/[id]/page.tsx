import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Flame, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ArticleLink } from "@/components/news/article-link";
import { BookmarkButton } from "@/components/news/bookmark-button";
import { getArticleById } from "@/lib/db/articles";
import { listBookmarkedArticleIds } from "@/lib/db/user";
import { getSession } from "@/lib/auth/session";
import { categoryLabel } from "@/lib/categories";
import { importanceLabel } from "@/lib/ingestion/importance";
import { getDictionaryForRequest, getLanguage } from "@/lib/i18n/server";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * The article is looked up once per request and shared between
 * `generateMetadata` and the page itself.
 *
 * A missing article resolves to `null` (rendered as a 404), while a database
 * failure is re-thrown so the page can show an error state instead of a
 * misleading "page not found".
 *
 * `notFound()` is also raised from `generateMetadata`: metadata is resolved
 * before the HTML shell is flushed, so the response keeps the correct 404
 * status instead of degrading to a 200 with an empty body.
 */
const loadArticle = cache(async (id: string) => getArticleById(id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getDictionaryForRequest();

  let article = null;
  try {
    article = await loadArticle(id);
  } catch {
    // A database failure must not be reported as "page not found".
    return { title: t.common.details };
  }

  if (!article) {
    notFound();
  }
  return {
    title: article.title,
    description: article.description ?? undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const t = await getDictionaryForRequest();
  const language = await getLanguage();

  let article = null;
  try {
    article = await loadArticle(id);
  } catch (error) {
    console.error("[article] failed to load article:", error);
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/news">
            <ArrowLeft className="size-4" />
            {t.common.viewAll}
          </Link>
        </Button>
        <Card className="border-[var(--danger)]/40">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm font-medium text-[var(--danger)]">
              {t.article.loadFailed}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {t.article.loadFailedBody}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let bookmarked = false;
  if (article && session.user) {
    try {
      const ids = await listBookmarkedArticleIds(session.user.id);
      bookmarked = ids.includes(article.id);
    } catch {
      bookmarked = false;
    }
  }

  if (!article) {
    notFound();
  }

  const factStatusLabel: Record<string, string> = {
    confirmed: t.article.factsConfirmed,
    reported: t.article.factsReported,
    unverified: t.article.factsUnverified,
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/news">
          <ArrowLeft className="size-4" />
          {t.nav.latest}
        </Link>
      </Button>

      <PageHeader
        title={article.title}
        description={article.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {session.user && (
              <BookmarkButton
                articleId={article.id}
                initialBookmarked={bookmarked}
              />
            )}
            <Button asChild variant="outline" size="sm">
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                {t.common.originalArticle}
              </a>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Badge variant="secondary">{categoryLabel(article.category, t)}</Badge>
        {article.importance ? (
          <Badge variant={article.importance >= 4 ? "danger" : "warning"}>
            <Flame className="size-3" />
            {importanceLabel(article.importance, t)}
          </Badge>
        ) : null}
        <span>{article.sources?.name ?? "—"}</span>
        <span>·</span>
        <time dateTime={article.published_at}>
          {formatDateTime(article.published_at, language)}
        </time>
        {article.ai_fact_status && (
          <Badge
            variant={article.ai_fact_status === "confirmed" ? "success" : "outline"}
          >
            <ShieldCheck className="size-3" />
            {factStatusLabel[article.ai_fact_status] ?? article.ai_fact_status}
          </Badge>
        )}
      </div>

      {article.ai_summary_bn ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.article.aiSummary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{article.ai_summary_bn}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">{t.article.whyItMatters}</h3>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {article.ai_why_it_matters ?? "—"}
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">
                  {t.article.developerImpact}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {article.ai_developer_impact ?? "—"}
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">
                  {t.article.practicalAction}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {article.ai_practical_action ?? "—"}
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">{t.article.confidence}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {article.ai_confidence ?? "—"}
                  {article.ai_model ? ` · ${article.ai_model}` : ""}
                </p>
              </div>
            </div>

            {(article.ai_tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-4">
                {(article.ai_tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5 text-sm text-[var(--muted-foreground)]">
            {t.article.notAnalyzed}
          </CardContent>
        </Card>
      )}

      {article.content && (
        <Card>
          <CardHeader>
            <CardTitle>{t.article.summary}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">
              {article.content}
            </p>
          </CardContent>
        </Card>
      )}

      <p className="pb-6 text-xs text-[var(--muted-foreground)]">
        {t.article.writtenBy}{" "}
        <ArticleLink
          articleId={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--accent)] hover:underline"
        >
          {article.sources?.name ?? article.url}
        </ArticleLink>
      </p>
    </div>
  );
}
