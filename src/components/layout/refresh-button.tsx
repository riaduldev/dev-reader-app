"use client";

import { Loader2, RefreshCw } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n";

import { Button } from "@/components/ui/button";

export function RefreshButton({ enabled }: { enabled: boolean }) {
  const t = useT();
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const refresh = async () => {
    if (!enabled) {
      toast.error(t.common.login);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/refresh", { method: "POST" });
      const json = (await response.json()) as {
        error?: string;
        newArticles?: number;
        okSources?: number;
        failedSources?: number;
      };
      if (!response.ok) throw new Error(json.error ?? t.errors.generic);
      toast.success(
        format(t.dashboard.refreshDone, {
          ok: String(json.okSources ?? 0),
          count: String(json.newArticles ?? 0),
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
    <Button
      variant="ghost"
      size="icon"
      onClick={refresh}
      disabled={loading}
      aria-label={t.common.refresh}
      title={t.common.refresh}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
    </Button>
  );
}
