import type { Metadata } from "next";

import { SourceManager } from "@/components/admin/source-manager";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { RunIngestionButton } from "@/components/admin/run-ingestion-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { listSources } from "@/lib/db/sources";
import { listRuns, getRunWithItems } from "@/lib/db/runs";
import type { DatabaseIngestionRun, DatabaseSource } from "@/lib/db/types";
import { getSession } from "@/lib/auth/session";
import { isConfigured } from "@/lib/env";
import { getSchemaStatus } from "@/lib/db/schema";
import { getDictionaryForRequest, getLanguage } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";
import { formatRelativeTime } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.admin.title };
}

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const session = await getSession();
  const t = await getDictionaryForRequest();
  const language = await getLanguage();

  if (!session.user) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.admin.title} description={t.admin.description} />
        <EmptyState
          title={t.empty.signInRequiredTitle}
          description={t.empty.signInRequiredBody}
          action={{ label: t.common.login, href: "/login?next=/admin/sources" }}
        />
      </div>
    );
  }

  if (session.user.profile?.role !== "admin") {
    return (
      <div className="space-y-6">
        <PageHeader title={t.admin.title} description={t.admin.description} />
        <EmptyState
          title={t.admin.adminOnly}
          description={t.admin.adminOnlyBody}
        />
      </div>
    );
  }

  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");
  const schemaStatus = await getSchemaStatus();

  let sources: DatabaseSource[] = [];
  let runs: DatabaseIngestionRun[] = [];
  let failedItems: Array<{
    source_name: string;
    error: string | null;
    created_at: string;
    run_id: string;
  }> = [];

  if (dbConfigured) {
    try {
      sources = await listSources();
      runs = await listRuns(10);
      const detailed = await Promise.all(runs.map((run) => getRunWithItems(run.id)));
      failedItems = detailed
        .flatMap((run) => run?.items ?? [])
        .filter((item) => item.status === "failed")
        .map((item) => ({
          source_name: item.source_name,
          error: item.error,
          created_at: item.created_at,
          run_id: item.run_id,
        }));
    } catch {
      sources = [];
      runs = [];
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.admin.title}
        description={t.admin.description}
        actions={<RunIngestionButton />}
      />

      {schemaStatus && !schemaStatus.ok && (
        <SchemaSetupNotice initialStatus={schemaStatus} canCopy />
      )}

      <SourceManager initialSources={sources} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.runs}</CardTitle>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t.admin.noRuns}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {runs.map((run) => (
                  <li key={run.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge
                        variant={
                          run.status === "success"
                            ? "success"
                            : run.status === "partial"
                              ? "warning"
                              : run.status === "failed"
                                ? "danger"
                                : "outline"
                        }
                      >
                        {run.status}
                      </Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {run.trigger} · {formatRelativeTime(run.started_at, language)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {format(t.dashboard.runSummary, {
                        status: run.status,
                        articles: String(run.new_articles),
                        ok: String(run.ok_sources),
                        total: String(run.total_sources),
                      })}
                    </p>
                    {run.error && (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--danger)]">
                        {run.error}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.admin.errors}</CardTitle>
          </CardHeader>
          <CardContent>
            {failedItems.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                {t.admin.noErrors}
              </p>
            ) : (
              <ul className="space-y-2">
                {failedItems.slice(0, 15).map((item, index) => (
                  <li
                    key={`${item.run_id}-${index}`}
                    className="rounded-lg border border-[var(--border)] p-3 text-xs"
                  >
                    <p className="font-medium">{item.source_name}</p>
                    <p className="mt-0.5 text-[var(--danger)]">{item.error}</p>
                    <p className="mt-0.5 text-[var(--muted-foreground)]">
                      {formatRelativeTime(item.created_at, language)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
