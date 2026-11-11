"use client";

import { Bell, Check } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";
import { useT, useLanguage } from "@/lib/i18n/client";

interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationsBell({
  initialNotifications,
  enabled,
}: {
  initialNotifications: NotificationItem[];
  enabled: boolean;
}) {
  const t = useT();
  const [language] = useLanguage();
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const unread = notifications.filter((item) => !item.read_at).length;

  const markAllRead = async () => {
    if (!enabled) return;
    try {
      const response = await fetch("/api/notifications/read", { method: "POST" });
      if (!response.ok) throw new Error(t.errors.generic);
      setNotifications((items) =>
        items.map((item) => ({
          ...item,
          read_at: item.read_at ?? new Date().toISOString(),
        })),
      );
      toast.success(t.common.markAllRead);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t.common.notifications}
          title={t.common.notifications}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[var(--danger)] text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t.common.notifications}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-[var(--muted-foreground)]">
            {t.common.noNotifications}
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {notifications.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <a
                  href={item.link ?? "#"}
                  className="flex flex-col items-start gap-0.5"
                  onClick={() =>
                    setNotifications((items) =>
                      items.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              read_at: entry.read_at ?? new Date().toISOString(),
                            }
                          : entry,
                      ),
                    )
                  }
                >
                  <span className="flex w-full items-center gap-2">
                    {!item.read_at && (
                      <span className="size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    )}
                    <span className="line-clamp-1 flex-1 text-sm">{item.title}</span>
                    {item.read_at && <Check className="size-3.5 opacity-60" />}
                  </span>
                  {item.body && (
                    <span className="line-clamp-2 text-xs text-[var(--muted-foreground)]">
                      {item.body}
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    {formatRelativeTime(item.created_at, language)}
                  </span>
                </a>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {unread > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={markAllRead}>
              {t.common.markAllRead}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
