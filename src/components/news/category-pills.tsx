"use client";

import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function CategoryPills({
  active,
  basePath,
}: {
  active: string;
  basePath: string;
}) {
  const t = useT();
  const items = [{ id: "all", label: t.common.all }, ...CATEGORIES];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => {
        const isActive = item.id === active;
        const label =
          "label" in item && typeof item.label === "string"
            ? item.label
            : t.categories[item.id as keyof typeof t.categories].label;
        return (
          <Link
            key={item.id}
            href={item.id === "all" ? basePath : `${basePath}/${item.id}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-transparent bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
