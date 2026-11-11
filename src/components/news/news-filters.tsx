"use client";

import { Filter, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n/client";

const SORT_OPTIONS = ["latest", "oldest", "importance"] as const;

export function NewsFilters({
  basePath,
  showSort = true,
}: {
  basePath: string;
  showSort?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");
  const [from, setFrom] = React.useState(searchParams.get("from") ?? "");
  const [to, setTo] = React.useState(searchParams.get("to") ?? "");
  const [sort, setSort] = React.useState(
    searchParams.get("sort") ?? "latest",
  );

  const apply = React.useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page");
      const queryString = params.toString();
      router.push(queryString ? `${basePath}?${queryString}` : basePath);
    },
    [basePath, router, searchParams],
  );

  const hasFilters =
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("from")) ||
    Boolean(searchParams.get("to")) ||
    (searchParams.get("sort") ?? "latest") !== "latest";

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        apply({ q: query.trim(), from, to, ...(showSort ? { sort } : {}) });
      }}
    >
      <div className="flex min-w-48 flex-1 flex-col gap-1.5">
        <label htmlFor="news-search" className="text-xs text-[var(--muted-foreground)]">
          {t.filters.searchLabel}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            id="news-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.filters.searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="news-from" className="text-xs text-[var(--muted-foreground)]">
          {t.filters.from}
        </label>
        <Input
          id="news-from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="news-to" className="text-xs text-[var(--muted-foreground)]">
          {t.filters.to}
        </label>
        <Input
          id="news-to"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      {showSort && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-[var(--muted-foreground)]">
            {t.filters.sortLabel}
          </span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="sm:w-44" aria-label={t.filters.sortLabel}>
              <SelectValue>
                {t.sort[sort as keyof typeof t.sort] ?? t.filters.sortLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t.sort[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="default" size="default">
          <Filter className="size-4" />
          {t.common.filter}
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t.common.clearFilters}
            title={t.common.clearFilters}
            onClick={() => {
              setQuery("");
              setFrom("");
              setTo("");
              setSort("latest");
              router.push(basePath);
            }}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
