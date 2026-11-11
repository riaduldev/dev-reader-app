import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getAuthSettings } from "@/lib/auth/settings";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { loginAction, signInWithOAuthAction } from "@/lib/auth/actions";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.auth.signIn, description: t.auth.loginSubtitle };
}

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const settings = await getAuthSettings();
  const t = await getDictionaryForRequest();

  return (
    <AuthShell
      title={t.auth.loginTitle}
      description={t.auth.loginSubtitle}
    >
      <AuthForm
        mode="login"
        action={loginAction}
        oauthAction={signInWithOAuthAction}
        providers={{ google: settings.google, github: settings.github }}
        configured={isSupabaseConfigured()}
        next={params.next}
        urlError={params.error}
      />
    </AuthShell>
  );
}
