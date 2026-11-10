"use client";

import { Loader2, RefreshCw } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function RefreshButton({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const refresh = async () => {
    if (!enabled) {
      toast.error("রিফ্রেশ করতে সাইন ইন করতে হবে।");
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
      if (!response.ok) throw new Error(json.error ?? "রিফ্রেশ ব্যর্থ।");
      toast.success(
        `রিফ্রেশ সম্পন্ন — ${json.okSources ?? 0} টি সোর্স থেকে ${json.newArticles ?? 0} টি নতুন নিবন্ধ পাওয়া গেছে।`,
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "রিফ্রেশ ব্যর্থ।");
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
      aria-label="খবর রিফ্রেশ করুন"
      title="খবর রিফ্রেশ করুন"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
    </Button>
  );
}
