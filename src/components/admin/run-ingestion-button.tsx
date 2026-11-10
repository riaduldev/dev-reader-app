"use client";

import { Loader2, Play } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function RunIngestionButton() {
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
      if (!response.ok) throw new Error(json.error ?? "সিঙ্ক ব্যর্থ।");
      toast.success(
        `সিঙ্ক সম্পন্ন — ${json.okSources ?? 0} সোর্স সফল, ${json.failedSources ?? 0} ব্যর্থ, ${json.newArticles ?? 0} নতুন নিবন্ধ, AI বিশ্লেষণ ${json.aiProcessed ?? 0}।`,
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "সিঙ্ক ব্যর্থ।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={run} size="sm" disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
      সব সোর্স সিঙ্ক করুন
    </Button>
  );
}
