"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { AuthDivider, OAuthButton } from "@/components/auth/oauth-button";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";
import type { AuthFormState } from "@/lib/auth/types";

const INITIAL_STATE: AuthFormState = { error: null, message: null };

export interface AuthFormProps {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  oauthAction: (
    state: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
  providers: { google: boolean; github: boolean };
  /** False when Supabase itself is not configured on this deployment. */
  configured?: boolean;
  next?: string;
  /** Error code coming from the URL (for example after a failed OAuth callback). */
  urlError?: string;
}

const URL_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "signInFailed",
  missing_code: "signInFailed",
  exchange_failed: "signInFailed",
  not_configured: "notConfigured",
  session_expired: "signInFailed",
};

export function AuthForm({
  mode,
  action,
  oauthAction,
  providers,
  configured = true,
  next,
  urlError,
}: AuthFormProps) {
  const t = useT();
  const [state, formAction, pending] = React.useActionState(action, INITIAL_STATE);
  const [oauthState, oauthFormAction, oauthPending] = React.useActionState(
    oauthAction,
    INITIAL_STATE,
  );
  const [password, setPassword] = React.useState("");

  const urlErrorMessage = urlError
    ? URL_ERROR_MESSAGES[urlError]
      ? t.auth[URL_ERROR_MESSAGES[urlError] as keyof typeof t.auth]
      : t.errors.generic
    : null;

  const resolvedError = urlErrorMessage ?? state.error;
  const resolvedMessage = oauthState.message ?? state.message;

  return (
    <div className="space-y-5">
      {!configured ? (
        <p
          role="status"
          className="rounded-lg border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]"
        >
          {t.setup.description}
        </p>
      ) : (
        <div className="space-y-2">
          <OAuthButton
            provider="google"
            enabled={providers.google}
            pending={oauthPending}
            action={oauthFormAction}
            next={next}
          />
          <OAuthButton
            provider="github"
            enabled={providers.github}
            pending={oauthPending}
            action={oauthFormAction}
            next={next}
          />
          <AuthDivider />
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="full_name">{t.auth.fullName}</Label>
            <Input
              id="full_name"
              name="full_name"
              autoComplete="name"
              placeholder={t.auth.fullNamePlaceholder}
              required
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t.auth.emailPlaceholder}
            aria-invalid={Boolean(resolvedError) || undefined}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            {mode === "login" && (
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                {t.auth.forgotPassword}
              </Link>
            )}
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            showRules={mode === "signup"}
            value={password}
            onChange={setPassword}
            invalid={Boolean(resolvedError)}
          />
        </div>

        {resolvedError && (
          <p
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
          >
            {resolvedError}
          </p>
        )}
        {oauthState.error && (
          <p
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
          >
            {oauthState.error}
          </p>
        )}
        {resolvedMessage && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg border border-[var(--success)]/40 bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]"
          >
            {resolvedMessage}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "login" ? t.auth.signIn : t.auth.signUp}
        </Button>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          {mode === "login" ? t.auth.noAccount : t.auth.haveAccount}{" "}
          <Link
            href={
              mode === "login"
                ? `/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`
                : `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`
            }
            className="font-medium text-[var(--accent)] hover:underline"
          >
            {mode === "login" ? t.auth.signUp : t.auth.signIn}
          </Link>
        </p>
      </form>
    </div>
  );
}
