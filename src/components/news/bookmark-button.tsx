"use client";

import { Bookmark } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  articleId,
  initialBookmarked,
  signedIn = true,
  articlePath,
}: {
  articleId: string;
  initialBookmarked: boolean;
  /** When false the button sends the visitor to the sign-in page first. */
  signedIn?: boolean;
  /** Where the user should land after signing in (usually the article page). */
  articlePath?: string;
}) {
  const t = useT();
  const router = useRouter();
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [loading, setLoading] = React.useState(false);

  const toggle = async () => {
    if (loading) return;

    if (!signedIn) {
      const target = articlePath ?? `/article/${articleId}`;
      router.push(`/login?next=${encodeURIComponent(target)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const json = (await response.json()) as {
        error?: string;
        bookmarked?: boolean;
      };
      if (!response.ok) throw new Error(json.error ?? t.errors.generic);
      setBookmarked(Boolean(json.bookmarked));
      toast.success(
        json.bookmarked ? t.common.bookmarked : t.common.unbookmark,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.errors.generic,
      );
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
      aria-label={bookmarked ? t.common.unbookmark : t.common.bookmark}
      className={cn(
        "gap-1.5",
        bookmarked && "text-[var(--accent)] hover:text-[var(--accent)]",
      )}
    >
      <Bookmark className={cn("size-3.5", bookmarked && "fill-current")} />
      {bookmarked ? t.common.bookmarked : t.common.bookmark}
    </Button>
  );
}
