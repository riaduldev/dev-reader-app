import type { Metadata } from "next";
import Link from "next/link";

import { ThemePicker } from "@/components/settings/theme-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { getSession } from "@/lib/auth/session";
import { getPreferences } from "@/lib/db/user";
import { isConfigured } from "@/lib/env";
import { strings } from "@/lib/i18n";
import {
  clearHistoryAction,
  updatePreferencesAction,
  updateProfileAction,
} from "./actions";

export const metadata: Metadata = {
  title: "সেটিংস",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session.user) {
    return (
      <div className="space-y-6">
        <PageHeader title={strings.settings.title} description={strings.settings.description} />
        <EmptyState
          title="সাইন ইন করতে হবে"
          description="আপনার পছন্দ ও প্রোফাইল দেখতে সাইন ইন করুন।"
          action={{ label: "লগইন", href: "/login?next=/settings" }}
        />
      </div>
    );
  }

  const preferences =
    isConfigured("supabase") ? await getPreferences(session.user.id).catch(() => null) : null;

  const theme = (preferences?.theme ?? "dark") as "dark" | "light" | "system";

  return (
    <div className="space-y-6">
      <PageHeader
        title={strings.settings.title}
        description={strings.settings.description}
        actions={
          session.user.profile?.role === "admin" ? (
            <Badge variant="info">অ্যাডমিন</Badge>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{strings.settings.profile}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">পুরো নাম</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={session.user.profile?.full_name ?? ""}
                  placeholder="আপনার নাম"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">ইমেইল</Label>
                <Input
                  id="email"
                  value={session.user.email ?? ""}
                  disabled
                  readOnly
                />
                <p className="text-xs text-[var(--muted-foreground)]">
                  ইমেইল পরিবর্তন Supabase ড্যাশবোর্ড থেকে করতে হবে।
                </p>
              </div>
              <Button type="submit" size="sm">
                সংরক্ষণ
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{strings.settings.appearance}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>থিম</Label>
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
                <Label htmlFor="density">ডেনসিটি</Label>
                <select
                  id="density"
                  name="density"
                  defaultValue={preferences?.density ?? "comfortable"}
                  className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)] sm:w-56"
                >
                  <option value="comfortable">আরামদায়ক</option>
                  <option value="compact">কমপ্যাক্ট</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{strings.settings.emailDigest}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {strings.settings.emailDigestHint}
                  </p>
                </div>
                <Switch
                  id="email_digest"
                  name="email_digest"
                  defaultChecked={preferences?.email_digest ?? false}
                />
              </div>
              <Button type="submit" size="sm">
                সংরক্ষণ
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{strings.settings.data}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">{strings.settings.clearHistory}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {strings.settings.clearHistoryHint}
              </p>
              <form action={clearHistoryAction} className="mt-3">
                <Button type="submit" variant="destructive" size="sm">
                  {strings.settings.clearHistory}
                </Button>
              </form>
            </div>
            <div className="border-t border-[var(--border)] pt-4">
              <Link
                href="/admin/sources"
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                সোর্স ম্যানেজমেন্ট →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{strings.settings.notifications}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>
              গুরুত্বপূর্ণ নিবন্ধ ও সিঙ্কের ফলাফল এই প্যানেলের বেল চিহ্নিত নোটিফিকেশন
              হিসেবে দেখা যায়।
            </p>
            <p className="text-xs">
              বর্তমান অবস্থা:{" "}
              <span className="font-mono">
                {isConfigured("supabase") ? "Supabase কানেক্ট করা" : "কনফিগার করা নেই"}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
