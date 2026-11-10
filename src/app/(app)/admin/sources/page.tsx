import type { Metadata } from "next";

import { SourceManager } from "@/components/admin/source-manager";
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
import { strings } from "@/lib/i18n";
import { relativeTimeBn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "সোর্স ম্যানেজমেন্ট",
};

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const session = await getSession();

  if (!session.user) {
    return (
      <div className="space-y-6">
        <PageHeader title={strings.admin.title} description={strings.admin.description} />
        <EmptyState
          title="সাইন ইন করতে হবে"
          description="এই পেজটি শুধুমাত্র অ্যাডমিন ব্যবহার করতে পারবেন।"
          action={{ label: "লগইন", href: "/login?next=/admin/sources" }}
        />
      </div>
    );
  }

  if (session.user.profile?.role !== "admin") {
    return (
      <div className="space-y-6">
        <PageHeader title={strings.admin.title} description={strings.admin.description} />
        <EmptyState
          title="অ্যাডমিন প্রিভিলেজ প্রয়োজন"
          description="এই পেজটি শুধুমাত্র admin role ধারণকারী ব্যবহারকারীদের জন্য। আপনার প্রোফাইলে role পরিবর্তন করতে ডেটাবেসে user_profiles টেবিল আপডেট করুন।"
        />
      </div>
    );
  }

  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");

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
        title={strings.admin.title}
        description={strings.admin.description}
        actions={<RunIngestionButton />}
      />

      <SourceManager initialSources={sources} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{strings.admin.runs}</CardTitle>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                এখনো কোনো সংগ্রহ রান হয়নি।
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
                        {run.trigger} · {relativeTimeBn(run.started_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {run.new_articles} নতুন · {run.duplicate_articles} ডুপ্লিকেট · AI{" "}
                      {run.ai_processed} · সোর্স {run.ok_sources}/{run.total_sources}
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
            <CardTitle>{strings.admin.errors}</CardTitle>
          </CardHeader>
          <CardContent>
            {failedItems.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                কোনো সংগ্রহ ত্রুটি নেই।
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
                      {relativeTimeBn(item.created_at)}
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
