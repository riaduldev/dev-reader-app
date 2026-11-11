import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { updatePasswordAction } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.auth.newPasswordTitle, description: t.auth.newPasswordDescription };
}

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const session = await getSession();
  const t = await getDictionaryForRequest();

  return (
    <AuthShell
      title={t.auth.newPasswordTitle}
      description={t.auth.newPasswordDescription}
    >
      <ResetPasswordForm action={updatePasswordAction} canReset={Boolean(session.user)} />
    </AuthShell>
  );
}
