import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PreferencePicker } from "@/components/settings/preference-picker";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { getPreferences } from "@/lib/db/user";
import { getDictionaryForRequest } from "@/lib/i18n/server";
import { savePreferencesAction, skipOnboardingAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.onboarding.title, description: t.onboarding.description };
}

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSession();
  const t = await getDictionaryForRequest();

  if (!session.user) {
    redirect("/login?next=/onboarding");
  }

  const preferences = await getPreferences(session.user.id).catch(() => null);

  if (preferences?.onboarding_completed) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t.onboarding.title}
        description={t.onboarding.description}
      />

      <PreferencePicker
        action={savePreferencesAction}
        skipAction={skipOnboardingAction}
        skipLabel={t.common.skip}
        initialCategories={preferences?.categories ?? []}
        initialTechnologies={preferences?.technologies ?? []}
      />
    </div>
  );
}
