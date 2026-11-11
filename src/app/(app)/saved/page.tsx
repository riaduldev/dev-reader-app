import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/news/article-card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listBookmarks } from "@/lib/db/user";
import { describeDbError, getSchemaStatus, isMissingSchemaError } from "@/lib/db/schema";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { getSession } from "@/lib/auth/session";
import { isConfigured } from "@/lib/env";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.nav.saved };
}

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await getSession();
  const t = await getDictionaryForRequest();

  if (!session.user) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.nav.saved} />
        <EmptyState
          title={t.empty.signInRequiredTitle}
          description={t.empty.signInRequiredBody}
          action={{ label: t.common.login, href: "/login?next=/saved" }}
        />
      </div>
    );
  }

  let bookmarks: Awaited<ReturnType<typeof listBookmarks>> = [];
  let error: string | null = null;
  let schemaMissing = false;

  if (isConfigured("supabase")) {
    try {
      bookmarks = await listBookmarks(session.user.id);
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
        title={t.nav.saved}
        description={t.empty.savedBody}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/news">{t.empty.savedAction}</Link>
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

      {bookmarks.length === 0 ? (
        <EmptyState
          title={t.empty.savedTitle}
          description={t.empty.savedBody}
          action={{ label: t.empty.savedAction, href: "/news" }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookmarks.map((bookmark) =>
            bookmark.articles ? (
              <ArticleCard
                key={bookmark.id}
                article={bookmark.articles}
                canBookmark
                bookmarked
              />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
