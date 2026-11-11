import type { Metadata } from "next";

import { VulnerabilityRow } from "@/components/security/vulnerability-row";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listVulnerabilities } from "@/lib/db/vulnerabilities";
import { isConfigured } from "@/lib/env";
import { getDictionaryForRequest } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.security.title };
}

export const dynamic = "force-dynamic";

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; severity?: string; exploited?: string }>;
}) {
  const params = await searchParams;
  const t = await getDictionaryForRequest();
  const dbConfigured = isConfigured("supabase") || isConfigured("supabaseAdmin");

  let vulnerabilities: Awaited<ReturnType<typeof listVulnerabilities>> = [];
  let error: string | null = null;

  if (dbConfigured) {
    try {
      vulnerabilities = await listVulnerabilities({
        limit: 60,
        query: params.q,
        severity: params.severity,
        exploitedOnly: params.exploited === "1",
      });
    } catch (err) {
      error = err instanceof Error ? err.message : t.errors.articlesLoad;
    }
  }

  const exploitedCount = vulnerabilities.filter((item) => item.exploited).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.security.title}
        description={t.security.description}
        actions={
          <Badge variant="danger">
            {format(t.security.exploitedCount, { count: exploitedCount })}
          </Badge>
        }
      />

      <Card className="p-4">
        <CardContent className="space-y-2 p-0 text-xs leading-relaxed text-[var(--muted-foreground)]">
          <p>{t.security.sourceNote}</p>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {vulnerabilities.length === 0 ? (
        <EmptyState
          title={t.empty.vulnerabilitiesTitle}
          description={t.empty.vulnerabilitiesBody}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {vulnerabilities.map((vulnerability) => (
            <Card key={vulnerability.cveId} className="p-4">
              <VulnerabilityRow vulnerability={vulnerability} />
              {vulnerability.reference_urls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {vulnerability.reference_urls.slice(0, 3).map((reference) => (
                    <a
                      key={reference}
                      href={reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
                    >
                      {reference.replace(/^https?:\/\//, "").slice(0, 42)}
                    </a>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
