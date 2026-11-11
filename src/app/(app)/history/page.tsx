import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/news/article-card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listHistory } from "@/lib/db/user";
import { describeDbError, getSchemaStatus, isMissingSchemaError } from "@/lib/db/schema";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { getSession } from "@/lib/auth/session";
import { isConfigured } from "@/lib/env";
import { formatRelativeTime } from "@/lib/utils";
import { getDictionaryForRequest, getLanguage } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.nav.history };
}

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getSession();
  const t = await getDictionaryForRequest();
  const language = await getLanguage();

  if (!session.user) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.nav.history} />
        <EmptyState
          title={t.empty.signInRequiredTitle}
          description={t.empty.signInRequiredBody}
          action={{ label: t.common.login, href: "/login?next=/history" }}
        />
      </div>
    );
  }

  let history: Awaited<ReturnType<typeof listHistory>> = [];
  let error: string | null = null;
  let schemaMissing = false;

  if (isConfigured("supabase")) {
    try {
      history = await listHistory(session.user.id);
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
        title={t.nav.history}
        description={t.empty.historyBody}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">{t.settings.clearHistory}</Link>
          </Button>
        }
      />

      {schemaMissing && (
        <SchemaSetupNotice initialStatus={await getSchemaStatus()} />
      )}

      {error && !schemaMissing && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {history.length === 0 ? (
        <EmptyState
          title={t.empty.historyTitle}
          description={t.empty.historyBody}
          action={{ label: t.empty.historyAction, href: "/news" }}
        />
      ) : (
        <div className="space-y-3">
          {history.map((entry) =>
            entry.articles ? (
              <div key={entry.id} className="space-y-1">
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatRelativeTime(entry.viewed_at, language)}
                </p>
                <ArticleCard
                  article={entry.articles}
                  canBookmark
                  bookmarked={false}
                />
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
