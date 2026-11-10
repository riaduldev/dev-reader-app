import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/news/article-card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listBookmarks } from "@/lib/db/user";
import { getSession } from "@/lib/auth/session";
import { isConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "সংরক্ষিত নিবন্ধ",
};

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await getSession();

  if (!session.user) {
    return (
      <div className="space-y-6">
        <PageHeader title="সংরক্ষিত নিবন্ধ" />
        <EmptyState
          title="সাইন ইন করতে হবে"
          description="আপনার সংরক্ষিত নিবন্ধ দেখতে DevPulse অ্যাকাউন্টে সাইন ইন করুন।"
          action={{ label: "লগইন", href: "/login?next=/saved" }}
        />
      </div>
    );
  }

  let bookmarks: Awaited<ReturnType<typeof listBookmarks>> = [];
  let error: string | null = null;

  if (isConfigured("supabase")) {
    try {
      bookmarks = await listBookmarks(session.user.id);
    } catch (err) {
      error = err instanceof Error ? err.message : "সংরক্ষিত নিবন্ধ লোড করা যায়নি।";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="সংরক্ষিত নিবন্ধ"
        description="আপনি বুকমার্ক করা সব নিবন্ধ এখানে সংরক্ষিত থাকে।"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/news">আরও নিবন্ধ খুঁজুন</Link>
          </Button>
        }
      />

      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {bookmarks.length === 0 ? (
        <EmptyState
          title="এখনো কোনো নিবন্ধ সংরক্ষণ করা হয়নি"
          description="যেকোনো নিবন্ধের পাশের “সংরক্ষণ” বাটনে ক্লিক করলে সেটি এখানে জমা হবে।"
          action={{ label: "সর্বশেষ খবর দেখুন", href: "/news" }}
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
