"use client";

import { Loader2, Play } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n";

export function RunIngestionButton() {
  const t = useT();
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const run = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await response.json()) as {
        error?: string;
        newArticles?: number;
        okSources?: number;
        failedSources?: number;
        aiProcessed?: number;
      };
      if (!response.ok) throw new Error(json.error ?? t.errors.generic);
      toast.success(
        format(t.dashboard.runSummary, {
          status: `${json.okSources ?? 0} ok / ${json.failedSources ?? 0} failed`,
          articles: String(json.newArticles ?? 0),
          ok: String(json.okSources ?? 0),
          total: String((json.okSources ?? 0) + (json.failedSources ?? 0)),
        }),
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={run} size="sm" disabled={loading}>
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Play className="size-4" />
      )}
      {t.admin.syncAll}
    </Button>
  );
}
