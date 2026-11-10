import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Flame,
  ShieldCheck,
} from "lucide-react";

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
import { strings } from "@/lib/i18n";
import { formatDateTimeBn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const article = await getArticleById(id);
    if (!article) return { title: "নিবন্ধ" };
    return { title: article.title, description: article.description ?? undefined };
  } catch {
    return { title: "নিবন্ধ" };
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  let article = null;
  let bookmarked = false;

  try {
    article = await getArticleById(id);
    if (article && session.user) {
      const ids = await listBookmarkedArticleIds(session.user.id);
      bookmarked = ids.includes(article.id);
    }
  } catch {
    article = null;
  }

  if (!article) {
    notFound();
  }

  const factStatusLabel: Record<string, string> = {
    confirmed: strings.article.factsConfirmed,
    reported: strings.article.factsReported,
    unverified: strings.article.factsUnverified,
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/news">
          <ArrowLeft className="size-4" />
          ফিরে যান
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
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                {strings.article.sourceOriginal}
              </a>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Badge variant="secondary">{categoryLabel(article.category)}</Badge>
        {article.importance ? (
          <Badge variant={article.importance >= 4 ? "danger" : "warning"}>
            <Flame className="size-3" />
            {importanceLabel(article.importance)}
          </Badge>
        ) : null}
        <span>{article.sources?.name ?? "অজানা সোর্স"}</span>
        <span>·</span>
        <time dateTime={article.published_at}>
          {formatDateTimeBn(article.published_at)}
        </time>
        {article.ai_fact_status && (
          <Badge variant={article.ai_fact_status === "confirmed" ? "success" : "outline"}>
            <ShieldCheck className="size-3" />
            {factStatusLabel[article.ai_fact_status] ?? article.ai_fact_status}
          </Badge>
        )}
      </div>

      {article.ai_summary_bn ? (
        <Card>
          <CardHeader>
            <CardTitle>{strings.article.aiSummary}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{article.ai_summary_bn}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">{strings.article.whyItMatters}</h3>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {article.ai_why_it_matters ?? "—"}
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">
                  {strings.article.developerImpact}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {article.ai_developer_impact ?? "—"}
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">
                  {strings.article.practicalAction}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {article.ai_practical_action ?? "—"}
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">{strings.article.confidence}</h3>
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
            এই নিবন্ধের AI বিশ্লেষণ এখনো প্রক্রিয়া করা হয়নি।
          </CardContent>
        </Card>
      )}

      {article.content && (
        <Card>
          <CardHeader>
            <CardTitle>সংক্ষিপ্ত বিবরণ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">
              {article.content}
            </p>
          </CardContent>
        </Card>
      )}

      <p className="pb-6 text-xs text-[var(--muted-foreground)]">
        মূল লেখা{" "}
        <ArticleLink
          articleId={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--accent)] hover:underline"
        >
          {article.sources?.name ?? article.url}
        </ArticleLink>{" "}
        এ লেখা হয়েছে।
      </p>
    </div>
  );
}
