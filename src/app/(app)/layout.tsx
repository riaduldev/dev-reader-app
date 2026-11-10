import { connection } from "next/server";

import { AppShell, type ShellNotification } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth/session";
import { listNotifications } from "@/lib/db/user";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Everything in the app shell is request-time data (session, notifications).
  await connection();

  const session = await getSession();

  let notifications: ShellNotification[] = [];
  if (session.user && isSupabaseConfigured()) {
    try {
      notifications = (await listNotifications(session.user.id, 10)) as ShellNotification[];
    } catch {
      notifications = [];
    }
  }

  const user = session.user
    ? {
        email: session.user.email,
        fullName: session.user.profile?.full_name ?? null,
        avatarUrl: session.user.profile?.avatar_url ?? null,
        role: session.user.profile?.role ?? ("user" as const),
      }
    : null;

  const dateLabel = new Intl.DateTimeFormat("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <AppShell
      user={user}
      notifications={notifications}
      notificationsEnabled={Boolean(session.user)}
      dateLabel={dateLabel}
    >
      {children}
    </AppShell>
  );
}
