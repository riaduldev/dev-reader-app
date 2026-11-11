import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();
  return { title: t.legal.termsTitle, description: t.legal.termsDescription };
}

export default async function TermsPage() {
  const t = await getDictionaryForRequest();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t.legal.termsTitle}
        description={t.legal.termsDescription}
      />

      <div className="space-y-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
        {t.legal.termsSections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              {section.title}
            </h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        {t.legal.seePrivacy}{" "}
        <Link
          href="/privacy"
          className="font-medium text-[var(--accent)] hover:underline"
        >
          {t.auth.privacy}
        </Link>
      </p>
    </div>
  );
}
