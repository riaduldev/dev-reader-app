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
import { Suspense } from "react";

import { ArticleCard } from "@/components/news/article-card";
import { CategoryPills } from "@/components/news/category-pills";
import { CurrentDate } from "@/components/layout/current-date";
import { GithubRepoCard } from "@/components/github/repo-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SetupNotice } from "@/components/setup/setup-notice";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { VulnerabilityRow } from "@/components/security/vulnerability-row";
import { listArticles, getArticleStats, getWeeklyHighlights } from "@/lib/db/articles";
import { listGithubRepos } from "@/lib/db/github";
import { listVulnerabilities } from "@/lib/db/vulnerabilities";
import { getLastSuccessfulSync } from "@/lib/db/sources";
import { getLatestRun } from "@/lib/db/runs";
import { isConfigured } from "@/lib/env";
import { getSession } from "@/lib/auth/session";
import { getDictionaryForRequest, getLanguage } from "@/lib/i18n/server";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getSchemaStatus, isMissingSchemaError } from "@/lib/db/schema";
import { format } from "@/lib/i18n";
import { formatRelativeTime } from "@/lib/utils";
import type { Language } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.nav.overview };
}

export const dynamic = "force-dynamic";

function greeting(t: Awaited<ReturnType<typeof getDictionaryForRequest>>) {
  const hour = new Date().getHours();
  if (hour < 12) return t.dashboard.greetingMorning;
  if (hour < 18) return t.dashboard.greetingAfternoon;
  return t.dashboard.greetingEvening;
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

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const t = await getDictionaryForRequest();
  const language: Language = await getLanguage();

  const category = params.category ?? "all";
  const page = Number(params.page ?? "1") || 1;

  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");
  const session = await getSession();

  let stats = null;
  let important: Awaited<ReturnType<typeof listArticles>> | null = null;
  let feed: Awaited<ReturnType<typeof listArticles>> | null = null;
  let highlights: Awaited<ReturnType<typeof getWeeklyHighlights>> = [];
  let repos: Awaited<ReturnType<typeof listGithubRepos>> = [];
  let vulns: Awaited<ReturnType<typeof listVulnerabilities>> = [];
  let lastSync: Awaited<ReturnType<typeof getLastSuccessfulSync>> = null;
  let lastRun: Awaited<ReturnType<typeof getLatestRun>> = null;
  let dbError: string | null = null;
  let schemaMissing = false;

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
      schemaMissing = isMissingSchemaError(error);
      dbError = schemaMissing
        ? t.errors.dbSchema
        : error instanceof Error
          ? error.message
          : t.errors.dbRead;
    }
  }

  const schemaStatus = schemaMissing ? await getSchemaStatus() : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {greeting(t)} 👋
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {t.dashboard.intro}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          <CurrentDate /> · {t.app.tagline}
        </p>
      </div>

      {!dbConfigured && <SetupNotice />}

      {schemaStatus && (
        <SchemaSetupNotice
          initialStatus={schemaStatus}
          canCopy={session.user?.profile?.role === "admin"}
        />
      )}

      {dbError && !schemaStatus && (
        <Card className="border-[var(--danger)]/40">
          <CardContent className="p-4 text-sm text-[var(--danger)]">
            {t.errors.dbRead}: {dbError}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.dashboard.totalArticles}
          value={stats?.totalArticles ?? 0}
          hint={t.dashboard.articlesCollected}
          icon={BookMarked}
        />
        <StatCard
          label={t.dashboard.last24h}
          value={stats?.articles24h ?? 0}
          hint={t.dashboard.last24hHint}
          icon={Activity}
        />
        <StatCard
          label={t.dashboard.last7d}
          value={stats?.articles7d ?? 0}
          hint={t.dashboard.last7dHint}
          icon={Cpu}
        />
        <StatCard
          label={t.dashboard.analyzed}
          value={stats?.analyzedArticles ?? 0}
          hint={t.dashboard.analyzedHint}
          icon={GitBranch}
        />
      </section>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">
              {t.dashboard.lastSync}:
            </span>{" "}
            {lastSync
              ? `${lastSync.sourceName} — ${formatRelativeTime(lastSync.at, language)}`
              : t.dashboard.neverSynced}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {lastRun
              ? format(t.dashboard.runSummary, {
                  status: lastRun.status,
                  articles: String(lastRun.new_articles),
                  ok: String(lastRun.ok_sources),
                  total: String(lastRun.total_sources),
                })
              : t.dashboard.noRunYet}
          </p>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4 text-[var(--danger)]" />
              {t.dashboard.importantNews}
            </CardTitle>
            <Link
              href="/news?sort=importance"
              className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)]"
            >
              {t.common.viewAll}
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
                      <span>
                        {formatRelativeTime(article.published_at, language)}
                      </span>
                    </div>
                    <Link
                      href={`/article/${article.id}`}
                      className="mt-1 block text-sm font-medium leading-snug transition-colors hover:text-[var(--accent)]"
                    >
                      {article.title}
                    </Link>
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
                title={t.empty.importantTitle}
                description={t.empty.importantBody}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-[var(--warning)]" />
              {t.dashboard.securityAlerts}
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
                title={t.empty.securityTitle}
                description={t.empty.securityBody}
              />
            )}
            <Link
              href="/security"
              className="mt-3 inline-block text-xs font-medium text-[var(--accent)]"
            >
              {t.common.viewAll} →
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {t.dashboard.chronologicalFeed}
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
            title={t.empty.articlesTitle}
            description={t.empty.articlesBody}
            action={{
              label: t.empty.articlesAction,
              href:
                session.user?.profile?.role === "admin"
                  ? "/admin/sources"
                  : "/news",
            }}
          />
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-4" />
              {t.dashboard.githubResults}
            </CardTitle>
            <Link
              href="/github"
              className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)]"
            >
              {t.common.viewAll}
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {repos.length > 0 ? (
              repos.map((repo) => (
                <GithubRepoCard key={repo.full_name} repo={repo} />
              ))
            ) : (
              <EmptyState
                title={t.empty.reposTitle}
                description={t.empty.reposBody}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4 text-[var(--accent)]" />
              {t.dashboard.weeklyHighlights}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {highlights.length > 0 ? (
              <ul className="divide-y divide-[var(--border)]">
                {highlights.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/article/${item.id}`}
                      className="block text-sm font-medium leading-snug transition-colors hover:text-[var(--accent)]"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {item.source_name ?? "—"} ·{" "}
                      {formatRelativeTime(item.published_at, language)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={t.empty.highlightsTitle}
                description={t.empty.highlightsBody}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <p className="pb-4 text-xs text-[var(--muted-foreground)]">
        {t.dashboard.statsNote}
      </p>
    </div>
  );
}

/**
 * The dashboard renders its data inside a Suspense boundary so the shell and
 * the skeleton appear immediately while the queries run. The boundary is
 * deliberately placed inside the page (instead of a route-level loading.tsx)
 * so that other routes — for example a missing article — can still answer
 * with a real 404 status.
 */
export default function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
