import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionaryForRequest } from "@/lib/i18n/server";
import { env, isConfigured } from "@/lib/env";

/**
 * Shown when required credentials are missing. It documents exactly what has to
 * be configured instead of rendering an empty dashboard.
 */
export async function SetupNotice({ compact = false }: { compact?: boolean }) {
  const t = await getDictionaryForRequest();

  const missing: string[] = [];
  if (!isConfigured("supabase")) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!isConfigured("supabaseAdmin")) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!isConfigured("openai")) {
    missing.push("OPENAI_API_KEY");
  }

  if (missing.length === 0) return null;

  return (
    <Card className="border-[var(--warning)]/40 bg-[var(--warning-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--warning)]">
          <AlertTriangle className="size-4" />
          {t.setup.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
        <p>{t.setup.description}</p>
        <p className="font-medium text-[var(--foreground)]">
          {t.setup.envTitle}
        </p>
        <ul className="list-inside list-disc space-y-1 font-mono text-xs">
          {missing.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
        {!compact && (
          <p className="text-xs">
            {t.setup.nextSteps}:{" "}
            <code className="font-mono">supabase/migrations/0001_init.sql</code>{" "}
            {t.setup.schemaHint}{" "}
            <code className="font-mono">README.md</code>
          </p>
        )}
        <p className="text-xs opacity-70">
          {t.setup.currentMode}:{" "}
          <span className="font-mono">
            {env().NEXT_PUBLIC_SUPABASE_URL
              ? t.setup.modeDatabase
              : t.setup.modeNoDatabase}
          </span>{" "}
          — {t.setup.noDemoData}
        </p>
      </CardContent>
    </Card>
  );
}
