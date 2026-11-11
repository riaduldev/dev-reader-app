import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { APP_NAME } from "@/lib/categories";
import { getDictionaryForRequest } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/lib/i18n/client";

/** Shared frame for the authentication pages. */
export async function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = await getDictionaryForRequest();

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--border)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/devreaderhub-logo.png"
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0"
              priority
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{APP_NAME}</span>
              <span className="hidden text-[11px] text-[var(--muted-foreground)] sm:block">
                {t.app.tagline}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/"
              className="hidden text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:inline"
            >
              {t.auth.browseNews}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              {description}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
            {children}
          </div>

          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {t.auth.publicAccess}
          </p>

          {footer}

          <p className="text-center text-xs text-[var(--muted-foreground)]">
            {t.auth.termsNote}{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-[var(--foreground)]"
            >
              {t.auth.terms}
            </Link>{" "}
            &amp;{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-[var(--foreground)]"
            >
              {t.auth.privacy}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
