import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/password-forms";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.auth.forgotTitle, description: t.auth.forgotDescription };
}

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const t = await getDictionaryForRequest();
  return (
    <AuthShell
      title={t.auth.forgotTitle}
      description={t.auth.forgotDescription}
      footer={
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          {t.auth.haveAccount}{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--accent)] hover:underline"
          >
            {t.auth.signIn}
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm action={requestPasswordResetAction} />
    </AuthShell>
  );
}
