"use client";

import { Loader2, Search } from "lucide-react";
import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/lib/categories";
import { relativeTimeBn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  url: string;
  category: string;
  published_at: string;
  importance: number | null;
  summary: string | null;
  source: string | null;
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const json = (await response.json()) as { results?: SearchResult[]; error?: string };
        if (!response.ok) throw new Error(json.error ?? "অনুসন্ধান ব্যর্থ।");
        setResults(json.results ?? []);
        setError(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "অনুসন্ধান ব্যর্থ।");
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  const visibleResults = query.trim().length >= 2 ? results : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-3)]"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">খুঁজুন…</span>
        <kbd className="hidden rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0">
          <DialogHeader className="border-b border-[var(--border)] p-4">
            <DialogTitle className="sr-only">গ্লোবাল সার্চ</DialogTitle>
            <DialogDescription className="sr-only">
              সংগৃহীত নিবন্ধগুলোর মধ্যে খুঁজুন।
            </DialogDescription>
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="size-4 animate-spin text-[var(--muted-foreground)]" />
              ) : (
                <Search className="size-4 text-[var(--muted-foreground)]" />
              )}
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="খবর, ট্যাগ বা সোর্স খুঁজুন…"
                className="h-9 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
            {error ? (
              <p className="p-4 text-sm text-[var(--danger)]">{error}</p>
            ) : query.trim().length < 2 ? (
              <p className="p-4 text-sm text-[var(--muted-foreground)]">
                অন্তত ২ অক্ষর লিখুন।
              </p>
            ) : visibleResults.length === 0 && !loading ? (
              <p className="p-4 text-sm text-[var(--muted-foreground)]">
                কোনো ফলাফল পাওয়া যায়নি।
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {visibleResults.map((result) => (
                  <li key={result.id}>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-2)]"
                    >
                      <span className="line-clamp-2 text-sm font-medium">{result.title}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <Badge variant="secondary">{categoryLabel(result.category)}</Badge>
                        {result.source && <span>{result.source}</span>}
                        <span>{relativeTimeBn(result.published_at)}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
