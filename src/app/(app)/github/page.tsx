import type { Metadata } from "next";

import { GithubRepoCard } from "@/components/github/repo-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/news/pagination";
import { listGithubRepos, listGithubRepoCount } from "@/lib/db/github";
import { isConfigured } from "@/lib/env";
import { strings } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "GitHub রিপোজিটরি",
};

export const dynamic = "force-dynamic";

export default async function GithubPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const perPage = 12;

  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");

  let repos: Awaited<ReturnType<typeof listGithubRepos>> = [];
  let total = 0;
  let error: string | null = null;

  if (dbConfigured) {
    try {
      [repos, total] = await Promise.all([
        listGithubRepos({ page, perPage }),
        listGithubRepoCount(),
      ]);
    } catch (err) {
      error = err instanceof Error ? err.message : "রিপোজিটরি লোড করা যায়নি।";
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <PageHeader title={strings.github.title} description={strings.github.description} />

      <Card className="border-[var(--info)]/40 bg-[var(--info-soft)]">
        <CardContent className="p-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">গুরুত্বপূর্ণ:</span>{" "}
          {strings.github.disclaimer}
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {repos.length === 0 ? (
        <EmptyState
          title="কোনো রিপোজিটরি সংগৃহ করা হয়নি"
          description="অ্যাডমিন প্যানেল থেকে GitHub সিঙ্ক চালালে রিপোজিটরি ও DevPulse স্কোর এখানে দেখা যাবে।"
        />
      ) : (
        <>
          <p className="text-xs text-[var(--muted-foreground)]">
            মোট {total} টি রিপোজিটরি · পৃষ্ঠা {page}/{totalPages}
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {repos.map((repo) => (
              <GithubRepoCard key={repo.full_name} repo={repo} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/github"
            params={{}}
          />
        </>
      )}
    </div>
  );
}
