"use client";

import { Bookmark } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  articleId,
  initialBookmarked,
  showAi = false,
}: {
  articleId: string;
  initialBookmarked: boolean;
  showAi?: boolean;
}) {
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [loading, setLoading] = React.useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const json = (await response.json()) as { error?: string; bookmarked?: boolean };
      if (!response.ok) throw new Error(json.error ?? "সংরক্ষণ ব্যর্থ।");
      setBookmarked(Boolean(json.bookmarked));
      toast.success(
        json.bookmarked ? "নিবন্ধটি সংরক্ষণ করা হয়েছে।" : "সংরক্ষণ থেকে সরানো হয়েছে।",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "সংরক্ষণ ব্যর্থ।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={loading}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "সংরক্ষণ সরান" : "সংরক্ষণ করুন"}
      className={cn(
        "gap-1.5",
        bookmarked && "text-[var(--accent)] hover:text-[var(--accent)]",
      )}
    >
      <Bookmark
        className={cn("size-3.5", bookmarked && "fill-current")}
      />
      {bookmarked ? "সংরক্ষিত" : "সংরক্ষণ"}
      {showAi ? null : null}
    </Button>
  );
}
