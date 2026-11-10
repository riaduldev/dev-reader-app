"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/lib/auth/types";

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  next?: string;
}) {
  const [state, formAction, pending] = React.useActionState(action, {
    error: null,
    message: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="full_name">পুরো নাম</Label>
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            placeholder="যেমন: রাকিউল ইসলাম"
            required
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">ইমেইল</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">পাসওয়ার্ড</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="••••••••"
          required
        />
        {mode === "signup" && (
          <p className="text-xs text-[var(--muted-foreground)]">
            কমপক্ষে ৮ অক্ষর, একটি সংখ্যা ও একটি অক্ষর থাকতে হবে।
          </p>
        )}
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="rounded-lg border border-[var(--success)]/40 bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]"
        >
          {state.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {mode === "login" ? "সাইন ইন" : "সাইন আপ"}
      </Button>

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        {mode === "login" ? "অ্যাকাউন্ট নেই?" : "আগে থেকেই অ্যাকাউন্ট আছে?"}{" "}
        <Link
          href={
            mode === "login"
              ? `/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`
              : `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`
          }
          className="font-medium text-[var(--accent)] hover:underline"
        >
          {mode === "login" ? "সাইন আপ করুন" : "লগইন করুন"}
        </Link>
      </p>
    </form>
  );
}
