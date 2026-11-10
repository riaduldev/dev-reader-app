import type { Metadata } from "next";

import { NewsFeed } from "@/components/news/news-feed";
import { NewsFilters } from "@/components/news/news-filters";
import { PageHeader } from "@/components/ui/page-header";
import { listArticles } from "@/lib/db/articles";
import { listBookmarkedArticleIds } from "@/lib/db/user";
import { getSession } from "@/lib/auth/session";
import { isConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Developer Jobs",
  description:
    "frontend, backend, full-stack, remote ও software engineering job openings সংগৃহীত অফিসিয়াল ও বিশ্বস্ত ফিড থেকে।",
};

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string; sort?: string; page?: string }>;
}) {
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
      error = err instanceof Error ? err.message : "কর্মসংস্থানের তথ্য লোড করা যায়নি।";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Jobs ও Careers"
        description="Remote OK, We Work Remotely ও Arbeitnow-এর পাবলিক API থেকে সংগৃহীত সফটওয়্যার ইঞ্জিনিয়ারিং ও ডেভেলপার পদ।"
      />

      <NewsFilters basePath="/jobs" />

      {error && (
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
