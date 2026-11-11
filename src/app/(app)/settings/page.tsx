import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemePicker } from "@/components/settings/theme-picker";
import { DeleteAccountCard } from "@/components/settings/delete-account-card";
import { PreferencePicker } from "@/components/settings/preference-picker";
import { getSession } from "@/lib/auth/session";
import { getPreferences } from "@/lib/db/user";
import { isConfigured } from "@/lib/env";
import { getDictionaryForRequest } from "@/lib/i18n/server";
import {
  clearHistoryAction,
  saveSettingsPreferencesAction,
  updatePreferencesAction,
  updateProfileAction,
} from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.settings.title };
}

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  const t = await getDictionaryForRequest();

  if (!session.user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t.settings.title}
          description={t.settings.description}
        />
        <EmptyState
          title={t.empty.signInRequiredTitle}
          description={t.empty.signInRequiredBody}
          action={{ label: t.common.login, href: "/login?next=/settings" }}
        />
      </div>
    );
  }

  const preferences = isConfigured("supabase")
    ? await getPreferences(session.user.id).catch(() => null)
    : null;

  const theme = (preferences?.theme ?? "dark") as "dark" | "light" | "system";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.settings.title}
        description={t.settings.description}
        actions={
          session.user.profile?.role === "admin" ? (
            <Badge variant="info">{t.settings.roleAdmin}</Badge>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.settings.profile}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">{t.auth.fullName}</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={session.user.profile?.full_name ?? ""}
                  placeholder={t.auth.fullNamePlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input
                  id="email"
                  value={session.user.email ?? ""}
                  disabled
                  readOnly
                />
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t.settings.emailHint}
                </p>
              </div>
              <Button type="submit" size="sm">
                {t.common.save}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.settings.appearance}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t.common.theme}</Label>
              <ThemePicker />
            </div>
            <form action={updatePreferencesAction} className="space-y-4">
              <input type="hidden" name="theme" value={theme} />
              <input
                type="hidden"
                name="language"
                value={preferences?.language ?? "bn"}
              />
              <div className="space-y-1.5">
                <Label htmlFor="density">{t.settings.density}</Label>
                <select
                  id="density"
                  name="density"
                  defaultValue={preferences?.density ?? "comfortable"}
                  className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] sm:w-56"
                >
                  <option value="comfortable">
                    {t.settings.densityComfortable}
                  </option>
                  <option value="compact">{t.settings.densityCompact}</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t.settings.emailDigest}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t.settings.emailDigestHint}
                  </p>
                </div>
                <Switch
                  id="email_digest"
                  name="email_digest"
                  defaultChecked={preferences?.email_digest ?? false}
                />
              </div>
              <Button type="submit" size="sm">
                {t.common.save}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.settings.preferences}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              {t.settings.preferencesHint}
            </p>
          </CardHeader>
          <CardContent>
            <PreferencePicker
              action={saveSettingsPreferencesAction}
              initialCategories={preferences?.categories ?? []}
              initialTechnologies={preferences?.technologies ?? []}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.settings.data}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">{t.settings.clearHistory}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {t.settings.clearHistoryHint}
              </p>
              <form action={clearHistoryAction} className="mt-3">
                <Button type="submit" variant="destructive" size="sm">
                  {t.settings.clearHistory}
                </Button>
              </form>
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm font-medium">{t.settings.deleteAccount}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {t.settings.deleteAccountHint}
              </p>
              <div className="mt-3">
                <DeleteAccountCard />
              </div>
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <a
                href="/admin/sources"
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                {t.nav.sources} →
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.settings.notifications}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>{t.settings.notificationsBody}</p>
            <p className="text-xs">
              {t.setup.currentMode}:{" "}
              <span className="font-mono">
                {isConfigured("supabase")
                  ? t.settings.supabaseConnected
                  : t.settings.supabaseMissing}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
