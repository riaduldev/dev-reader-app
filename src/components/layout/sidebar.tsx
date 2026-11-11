"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { APP_NAME } from "@/lib/categories";
import { ADMIN_NAV_ITEM, NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar({
  isAdmin,
  open,
  onClose,
}: {
  isAdmin: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const groups: Array<{ key: string; label: string; items: typeof NAV_ITEMS }> = [
    {
      key: "primary",
      label: t.nav.groupNews,
      items: NAV_ITEMS.filter((item) => item.group === "primary"),
    },
    {
      key: "personal",
      label: t.nav.groupMine,
      items: NAV_ITEMS.filter((item) => item.group === "personal"),
    },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label={t.nav.primaryNav}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-[var(--border)] px-4">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <Image
              src="/devreaderhub-logo.png"
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0"
              priority
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{APP_NAME}</span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {t.app.tagline}
              </span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onClose}
            aria-label={t.nav.closeMenu}
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
          {groups.map((group) => (
            <div key={group.key} className="mb-4">
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">
                        {t.nav[item.labelKey as keyof typeof t.nav]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {isAdmin && (
            <div className="mb-4">
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {t.nav.groupAdmin}
              </p>
              <Link
                href={ADMIN_NAV_ITEM.href}
                onClick={onClose}
                aria-current={isActive(ADMIN_NAV_ITEM.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  isActive(ADMIN_NAV_ITEM.href)
                    ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                )}
              >
                <ADMIN_NAV_ITEM.icon className="size-4 shrink-0" />
                <span className="truncate">
                  {t.nav[ADMIN_NAV_ITEM.labelKey as keyof typeof t.nav]}
                </span>
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t border-[var(--border)] px-4 py-3 text-[11px] text-[var(--muted-foreground)]">
          <p>DevReaderHub · {t.nav.taglineHint}</p>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={onClick}
      aria-label={t.nav.openMenu}
    >
      <Menu className="size-5" />
    </Button>
  );
}
