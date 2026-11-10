import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/categories";
import { signupAction } from "@/app/auth-actions";
import { strings } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "সাইন আপ",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
              DP
            </span>
            <span className="text-lg font-semibold">{APP_NAME}</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{strings.auth.signupTitle}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              {strings.auth.signupSubtitle}
            </p>
          </CardHeader>
          <CardContent>
            <AuthForm mode="signup" action={signupAction} next={next} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
