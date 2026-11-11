"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";
import type { AuthFormState } from "@/lib/auth/types";

const INITIAL_STATE: AuthFormState = { error: null, message: null };

export function ForgotPasswordForm({
  action,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const t = useT();
  const [state, formAction, pending] = React.useActionState(action, INITIAL_STATE);
  const [email, setEmail] = React.useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      {state.error && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-[var(--success)]/40 bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]"
        >
          {state.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t.auth.resetRequest}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({
  action,
  canReset,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  canReset: boolean;
}) {
  const t = useT();
  const [state, formAction, pending] = React.useActionState(action, INITIAL_STATE);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  if (!canReset) {
    return (
      <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
        <p>{t.auth.resetExpired}</p>
        <p>
          <a
            href="/forgot-password"
            className="font-medium text-[var(--accent)] hover:underline"
          >
            {t.auth.requestNewReset}
          </a>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">{t.auth.newPassword}</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          showRules
          value={password}
          onChange={setPassword}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">{t.auth.repeatPassword}</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />
      </div>

      {state.error && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-[var(--success)]/40 bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]"
        >
          {state.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t.auth.updatePassword}
      </Button>
    </form>
  );
}
