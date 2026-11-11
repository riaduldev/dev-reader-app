"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-[var(--danger-soft)] text-[var(--danger)]">
            <AlertTriangle className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="font-medium">{t.common.error}</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {t.errors.generic}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-[var(--muted-foreground)]">
                {error.digest}
              </p>
            )}
          </div>
          <Button onClick={reset}>{t.common.retry}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
