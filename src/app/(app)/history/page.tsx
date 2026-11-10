import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/news/article-card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listHistory } from "@/lib/db/user";
import { getSession } from "@/lib/auth/session";
import { isConfigured } from "@/lib/env";
import { relativeTimeBn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "পঠন ইতিহাস",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getSession();

  if (!session.user) {
    return (
      <div className="space-y-6">
        <PageHeader title="পঠন ইতিহাস" />
        <EmptyState
          title="সাইন ইন করতে হবে"
          description="আপনার পঠন ইতিহাস দেখতে DevPulse অ্যাকাউন্টে সাইন ইন করুন।"
          action={{ label: "লগইন", href: "/login?next=/history" }}
        />
      </div>
    );
  }

  let history: Awaited<ReturnType<typeof listHistory>> = [];
  let error: string | null = null;

  if (isConfigured("supabase")) {
    try {
      history = await listHistory(session.user.id);
    } catch (err) {
      error = err instanceof Error ? err.message : "পঠন ইতিহাস লোড করা যায়নি।";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="পঠন ইতিহাস"
        description="আপনি যে নিবন্ধগুলো পড়েছেন সেগুলোর তালিকা।"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">ইতিহাস মুছুন</Link>
          </Button>
        }
      />

      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {history.length === 0 ? (
        <EmptyState
          title="এখনো কোনো নিবন্ধ পড়া হয়নি"
          description="আপনি যে নিবন্ধগুলো খুলবেন সেগুলো এখানে সাজানো হবে।"
          action={{ label: "সর্বশেষ খবর দেখুন", href: "/news" }}
        />
      ) : (
        <div className="space-y-3">
          {history.map((entry) =>
            entry.articles ? (
              <div key={entry.id} className="space-y-1">
                <p className="text-xs text-[var(--muted-foreground)]">
                  {relativeTimeBn(entry.viewed_at)} পড়েছেন
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
