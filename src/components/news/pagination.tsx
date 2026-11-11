"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}

function buildHref(
  basePath: string,
  params: Record<string, string | undefined> | undefined,
  page: number,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({ page, totalPages, basePath, params }: PaginationProps) {
  const t = useT();
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) =>
      candidate === 1 || candidate === totalPages || Math.abs(candidate - page) <= 1,
  );

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 pt-2"
      aria-label={t.common.page}
    >
      <Button
        asChild
        variant="outline"
        size="sm"
        disabled={page <= 1}
        className={cn(page <= 1 && "pointer-events-none opacity-50")}
      >
        <Link href={buildHref(basePath, params, Math.max(1, page - 1))}>
          <ChevronLeft className="size-4" />
          {t.common.previous}
        </Link>
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((candidate, index) => {
          const previous = pages[index - 1];
          const showGap = previous !== undefined && candidate - previous > 1;
          return (
            <React.Fragment key={candidate}>
              {showGap && (
                <span className="px-1 text-sm text-[var(--muted-foreground)]">…</span>
              )}
              <Link
                href={buildHref(basePath, params, candidate)}
                aria-current={candidate === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors",
                  candidate === page
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                )}
              >
                {candidate}
              </Link>
            </React.Fragment>
          );
        })}
      </div>

      <Button
        asChild
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        className={cn(page >= totalPages && "pointer-events-none opacity-50")}
      >
        <Link href={buildHref(basePath, params, Math.min(totalPages, page + 1))}>
          {t.common.next}
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </nav>
  );
}
