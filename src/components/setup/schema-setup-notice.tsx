"use client";

import { AlertTriangle, Check, Copy, Loader2, RefreshCw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/client";

interface SchemaStatus {
  ok: boolean;
  present: string[];
  missing: string[];
  checkedAt: string;
  error: string | null;
}

const MIGRATIONS = ["0001_init.sql", "0002_auth_onboarding.sql"];

/**
 * Shown when the database schema is missing. Instead of a raw PostgREST
 * error it explains what is missing and offers the exact SQL to run.
 */
export function SchemaSetupNotice({
  initialStatus,
  canCopy = false,
}: {
  initialStatus: SchemaStatus;
  canCopy?: boolean;
}) {
  const t = useT();
  const [status, setStatus] = React.useState(initialStatus);
  const [checking, setChecking] = React.useState(false);
  const [copying, setCopying] = React.useState<string | null>(null);

  const recheck = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/admin/schema", { cache: "no-store" });
      if (!response.ok) throw new Error(t.errors.generic);
      const json = (await response.json()) as SchemaStatus;
      setStatus(json);
      if (json.ok) {
        toast.success(t.setup.schemaOk);
      } else {
        toast.error(t.setup.schemaStillMissing);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setChecking(false);
    }
  };

  const copyMigration = async (file: string) => {
    setCopying(file);
    try {
      const response = await fetch(`/api/admin/migration?file=${file}`);
      const json = (await response.json()) as { sql?: string; error?: string };
      if (!response.ok || !json.sql) {
        throw new Error(json.error ?? t.errors.generic);
      }
      await navigator.clipboard.writeText(json.sql);
      toast.success(`${file} ${t.common.copied}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setCopying(null);
    }
  };

  return (
    <Card className="border-[var(--danger)]/40 bg-[var(--danger-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--danger)]">
          <AlertTriangle className="size-4" />
          {t.setup.schemaTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-[var(--muted-foreground)]">
        <p>{t.setup.schemaBody}</p>

        <ol className="space-y-2">
          {MIGRATIONS.map((file, index) => (
            <li
              key={file}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            >
              <span className="min-w-0 break-all font-mono text-xs">
                {index + 1}. supabase/migrations/{file}
              </span>
              {canCopy && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={copying === file}
                  onClick={() => copyMigration(file)}
                >
                  {copying === file ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {t.setup.copySql}
                </Button>
              )}
            </li>
          ))}
        </ol>

        <p className="text-xs leading-relaxed">{t.setup.schemaHint}</p>

        {status.missing.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs">{t.setup.missingTables}:</span>
            {status.missing.map((table) => (
              <Badge key={table} variant="danger">
                {table}
              </Badge>
            ))}
          </div>
        )}

        {status.present.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs">{t.setup.presentTables}:</span>
            {status.present.map((table) => (
              <Badge key={table} variant="success">
                <Check className="size-3" />
                {table}
              </Badge>
            ))}
          </div>
        )}

        {status.error && (
          <p className="text-xs text-[var(--danger)]">{status.error}</p>
        )}

        {canCopy && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={recheck}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t.setup.recheck}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
