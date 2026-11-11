import { connection } from "next/server";
import Link from "next/link";

import { AppShell, type ShellNotification } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth/session";
import { listNotifications } from "@/lib/db/user";
import { getPreferences } from "@/lib/db/user";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getDictionaryForRequest, getLanguage } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Everything in the app shell is request-time data (session, notifications).
  await connection();

  const session = await getSession();
  const t = await getDictionaryForRequest();
  const language = await getLanguage();

  let notifications: ShellNotification[] = [];
  let needsOnboarding = false;

  if (session.user && isSupabaseConfigured()) {
    try {
      notifications = (await listNotifications(session.user.id, 10)) as ShellNotification[];
    } catch {
      notifications = [];
    }

    try {
      const preferences = await getPreferences(session.user.id);
      needsOnboarding = preferences ? !preferences.onboarding_completed : false;
    } catch {
      needsOnboarding = false;
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

  const dateLabel = new Intl.DateTimeFormat(intlLocale(language), {
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
      {needsOnboarding && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3">
          <p className="text-sm text-[var(--foreground)]">
            {t.onboarding.bannerTitle}
          </p>
          <Link
            href="/onboarding"
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90"
          >
            {t.onboarding.bannerAction}
          </Link>
        </div>
      )}
      {children}
    </AppShell>
  );
}
