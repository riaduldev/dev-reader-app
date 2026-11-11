import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getDictionaryForRequest();
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-5xl font-semibold tracking-tight">404</p>
          <div className="space-y-1">
            <p className="font-medium">{t.errors.notFoundTitle}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {t.errors.notFoundBody}
            </p>
          </div>
          <Button asChild>
            <Link href="/">{t.errors.backHome}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
