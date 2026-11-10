import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryPills({
  active,
  basePath,
}: {
  active: string;
  basePath: string;
}) {
  const items = [{ id: "all", label: "সব", hue: 220 }, ...CATEGORIES];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.id === "all" ? basePath : `${basePath}/${item.id}`}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-transparent bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
