import {
  Activity,
  BookMarked,
  Cpu,
  Flame,
  GitBranch,
  ShieldAlert,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/news/article-card";
import { CategoryPills } from "@/components/news/category-pills";
import { CurrentDate } from "@/components/layout/current-date";
import { GithubRepoCard } from "@/components/github/repo-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SetupNotice } from "@/components/setup/setup-notice";
import { VulnerabilityRow } from "@/components/security/vulnerability-row";
import { listArticles, getArticleStats, getWeeklyHighlights } from "@/lib/db/articles";
import { listGithubRepos } from "@/lib/db/github";
import { listVulnerabilities } from "@/lib/db/vulnerabilities";
import { getLastSuccessfulSync } from "@/lib/db/sources";
import { getLatestRun } from "@/lib/db/runs";
import { isConfigured } from "@/lib/env";
import { CATEGORIES } from "@/lib/categories";
import { strings } from "@/lib/i18n";
import { relativeTimeBn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ওভারভিউ",
};

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return strings.dashboard.greetingMorning;
  if (hour < 18) return strings.dashboard.greetingAfternoon;
  return strings.dashboard.greetingEvening;
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-4">
      <CardContent className="flex items-start justify-between gap-3 p-0">
        <div className="space-y-1">
          <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>}
        </div>
        <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--muted-foreground)]">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const page = Number(params.page ?? "1") || 1;

  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");

  let stats = null;
  let important: Awaited<ReturnType<typeof listArticles>> | null = null;
  let feed: Awaited<ReturnType<typeof listArticles>> | null = null;
  let highlights: Awaited<ReturnType<typeof getWeeklyHighlights>> = [];
  let repos: Awaited<ReturnType<typeof listGithubRepos>> = [];
  let vulns: Awaited<ReturnType<typeof listVulnerabilities>> = [];
  let lastSync: Awaited<ReturnType<typeof getLastSuccessfulSync>> = null;
  let lastRun: Awaited<ReturnType<typeof getLatestRun>> = null;
  let dbError: string | null = null;

  if (dbConfigured) {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      [stats, important, feed, highlights, repos, vulns, lastSync, lastRun] =
        await Promise.all([
          getArticleStats(),
          listArticles({
            minImportance: 4,
            from: weekAgo,
            pageSize: 5,
            sort: "latest",
          }),
          listArticles({
            category,
            page,
            pageSize: 8,
            sort: "latest",
          }),
          getWeeklyHighlights(5),
          listGithubRepos({ perPage: 4 }),
          listVulnerabilities({ limit: 5, exploitedOnly: true }),
          getLastSuccessfulSync(),
          getLatestRun(),
        ]);
    } catch (error) {
      dbError = error instanceof Error ? error.message : "ডেটাবেস পড়া যায়নি।";
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {greeting()} 👋
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          <CurrentDate /> · {strings.tagline}
        </p>
      </div>

      {!dbConfigured && <SetupNotice />}

      {dbError && (
        <Card className="border-[var(--danger)]/40">
          <CardContent className="p-4 text-sm text-[var(--danger)]">
            ডেটাবেস পড়তে সমস্যা হয়েছে: {dbError}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={strings.dashboard.totalArticles}
          value={stats?.totalArticles ?? 0}
          hint="সংগৃহীত মোট নিবন্ধ"
          icon={BookMarked}
        />
        <StatCard
          label={strings.dashboard.last24h}
          value={stats?.articles24h ?? 0}
          hint="গত ২৪ ঘণ্টায় প্রকাশিত"
          icon={Activity}
        />
        <StatCard
          label={strings.dashboard.last7d}
          value={stats?.articles7d ?? 0}
          hint="গত ৭ দিনে প্রকাশিত"
          icon={Cpu}
        />
        <StatCard
          label={strings.dashboard.analyzed}
          value={stats?.analyzedArticles ?? 0}
          hint="AI বিশ্লেষণ সম্পন্ন"
          icon={GitBranch}
        />
      </section>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">
              {strings.dashboard.lastSync}:
            </span>{" "}
            {lastSync
              ? `${lastSync.sourceName} — ${relativeTimeBn(lastSync.at)}`
              : strings.dashboard.neverSynced}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {lastRun
              ? `শেষ রান: ${lastRun.status} · ${lastRun.new_articles} নতুন নিবন্ধ · ${lastRun.ok_sources}/${lastRun.total_sources} সোর্স`
              : "এখনো কোনো সংগ্রহ রান হয়নি।"}
          </p>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4 text-[var(--danger)]" />
              {strings.dashboard.importantNews}
            </CardTitle>
            <Link
              href="/news?sort=importance"
              className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)]"
            >
              {strings.common.viewAll}
            </Link>
          </CardHeader>
          <CardContent>
            {important && important.items.length > 0 ? (
              <ul className="divide-y divide-[var(--border)]">
                {important.items.map((article) => (
                  <li key={article.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span className="font-medium text-[var(--foreground)]">
                        {article.sources?.name ?? "—"}
                      </span>
                      <span>·</span>
                      <span>{relativeTimeBn(article.published_at)}</span>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm font-medium leading-snug transition-colors hover:text-[var(--accent)]"
                    >
                      {article.title}
                    </a>
                    {article.ai_summary_bn && (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                        {article.ai_summary_bn}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="এখনো কোনো গুরুত্বপূর্ণ নিবন্ধ নেই"
                description="সিঙ্ক চালানোর পর গুরুত্বপূর্ণ নিবন্ধগুলো এখানে দেখা যাবে।"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-[var(--warning)]" />
              {strings.dashboard.securityAlerts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vulns.length > 0 ? (
              <ul className="divide-y divide-[var(--border)]">
                {vulns.map((vuln) => (
                  <li key={vuln.cveId} className="py-3 first:pt-0 last:pb-0">
                    <VulnerabilityRow vulnerability={vuln} compact />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="কোনো নিরাপত্তা অ্যালার্ট নেই"
                description="CISA KEV ও NVD সিঙ্ক করলে এখানে তালিকা দেখা যাবে।"
              />
            )}
            <Link
              href="/security"
              className="mt-3 inline-block text-xs font-medium text-[var(--accent)]"
            >
              সব নিরাপত্তা তথ্য →
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {strings.dashboard.chronologicalFeed}
          </h2>
          <CategoryPills active={category} basePath="/" />
        </div>

        {feed && feed.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {feed.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="কোনো নিবন্ধ পাওয়া যায়নি"
            description={
              dbConfigured
                ? "সংগ্রহ এখনো কোনো নিবন্ধ যোগ করেনি। অ্যাডমিন প্যানেল থেকে ম্যানুয়াল সিঙ্ক চালান।"
                : "ডেটাবেস কনফিগার না করা পর্যন্ত কোনো তথ্য দেখানো হবে না।"
            }
          />
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-4" />
              {strings.dashboard.githubResults}
            </CardTitle>
            <Link
              href="/github"
              className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)]"
            >
              {strings.common.viewAll}
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {repos.length > 0 ? (
              repos.map((repo) => <GithubRepoCard key={repo.full_name} repo={repo} />)
            ) : (
              <EmptyState
                title="কোনো রিপোজিটরি সংগ্রহ করা হয়নি"
                description="GitHub সিঙ্ক চালালে এখানে রিপোজিটরি দেখা যাবে।"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4 text-[var(--accent)]" />
              {strings.dashboard.weeklyHighlights}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {highlights.length > 0 ? (
              <ul className="divide-y divide-[var(--border)]">
                {highlights.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-medium leading-snug transition-colors hover:text-[var(--accent)]"
                    >
                      {item.title}
                    </a>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {item.source_name ?? "—"} · {relativeTimeBn(item.published_at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="এই সপ্তাহে কোনো হাইলাইট নেই"
                description="গত ৭ দিনের সংগৃহীত নিবন্ধের মধ্যে গুরুত্বপূর্ণ কিছু পাওয়া যায়নি।"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <p className="pb-4 text-xs text-[var(--muted-foreground)]">
        সব পরিসংখ্যান শুধুমাত্র সংগৃহীত রেকর্ড থেকে হিসাব করা হয়েছে।{" "}
        {CATEGORIES.length}টি ক্যাটাগরি সক্রিয়।
      </p>
    </div>
  );
}
