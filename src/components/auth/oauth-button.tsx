"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Inline brand marks (lucide-react no longer ships brand icons). */
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.7 0 2.9.73 3.5 1.35l2.4-2.3C16.5 3.6 14.5 2.6 12 2.6a9.4 9.4 0 1 0 0 18.8c5.4 0 9-3.8 9-9.1 0-.6-.07-1.06-.15-1.5H12z"
      />
    </svg>
  );
}

export function GitHubMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.3 1.19-3.1-.12-.3-.52-1.48.11-3.08 0 0 .97-.31 3.18 1.19a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.19 3.17-1.19.63 1.6.23 2.78.11 3.08.74.8 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
      />
    </svg>
  );
}

export interface OAuthButtonProps {
  provider: "google" | "github";
  enabled: boolean;
  pending: boolean;
  action: (formData: FormData) => void;
  next?: string;
}

/**
 * "Continue with Google / GitHub".
 *
 * When the provider is not enabled in the Supabase project the button is
 * disabled and the reason is shown, so the UI never dead-ends.
 */
export function OAuthButton({
  provider,
  enabled,
  pending,
  action,
  next,
}: OAuthButtonProps) {
  const t = useT();
  const label = provider === "google" ? "Google" : "GitHub";

  return (
    <form action={action} className="w-full">
      {next && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="provider" value={provider} />
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={!enabled || pending}
        title={
          enabled
            ? format(t.auth.signInWith, { provider: label })
            : format(t.auth.providerDisabledTitle, { provider: label })
        }
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : provider === "google" ? (
          <GoogleMark className="size-4" />
        ) : (
          <GitHubMark className="size-4" />
        )}
        {format(t.auth.signInWith, { provider: label })}
      </Button>
      {!enabled && (
        <p className="mt-1.5 text-center text-xs text-[var(--muted-foreground)]">
          {format(t.auth.providerDisabled, { provider: label })}
        </p>
      )}
    </form>
  );
}

export function AuthDivider({ className }: { className?: string }) {
  const t = useT();
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px flex-1 bg-[var(--border)]" />
      <span className="text-xs text-[var(--muted-foreground)]">{t.auth.or}</span>
      <span className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}
