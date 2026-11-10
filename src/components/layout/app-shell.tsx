"use client";

import * as React from "react";

import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationsBell } from "@/components/layout/notifications";
import { RefreshButton } from "@/components/layout/refresh-button";
import { MobileMenuButton, Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu, type UserMenuUser } from "@/components/layout/user-menu";

export interface ShellNotification {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function AppShell({
  user,
  notifications,
  notificationsEnabled,
  dateLabel,
  children,
}: {
  user: UserMenuUser | null;
  notifications: ShellNotification[];
  notificationsEnabled: boolean;
  dateLabel: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-dvh bg-[var(--background)]">
      <Sidebar
        isAdmin={user?.role === "admin"}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[var(--border)] bg-[var(--background)]/85 px-3 backdrop-blur sm:px-5">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />

          <div className="hidden flex-1 sm:block">
            <GlobalSearch />
          </div>
          <div className="flex-1 sm:hidden" />

          <span className="hidden text-xs text-[var(--muted-foreground)] xl:block">
            {dateLabel}
          </span>

          <RefreshButton enabled={Boolean(user)} />
          <NotificationsBell
            initialNotifications={notifications}
            enabled={notificationsEnabled}
          />
          <ThemeToggle />
          <UserMenu user={user} />
        </header>

        <main className="flex-1 px-3 py-5 sm:px-5 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
