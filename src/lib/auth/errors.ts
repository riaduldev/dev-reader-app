import type { Dictionary } from "@/lib/i18n/types";

/**
 * Translates Supabase auth failures into user-facing messages.
 *
 * The raw server error is never returned to the browser: it is logged on the
 * server (for diagnostics) and only the friendly message travels back.
 */

export interface SupabaseLikeError {
  message: string;
  code?: string;
  status?: number;
}

export function logAuthFailure(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[auth] ${context}: ${error.message}`, error);
    return;
  }
  console.error(`[auth] ${context}:`, error);
}

export function describeAuthError(
  error: SupabaseLikeError,
  context: string,
  t: Dictionary,
): string {
  logAuthFailure(context, error);

  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login")) {
    return t.authErrors.invalidCredentials;
  }
  if (code === "email_not_confirmed" || message.includes("not confirmed")) {
    return t.authErrors.emailNotConfirmed;
  }
  if (code === "user_already_exists" || message.includes("already registered")) {
    return t.authErrors.accountExists;
  }
  if (code === "weak_password" || message.includes("password should be")) {
    return t.authErrors.weakPassword;
  }
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit"
  ) {
    return t.authErrors.rateLimited;
  }
  if (code === "signup_disabled" || message.includes("signups not allowed")) {
    return t.authErrors.signupDisabled;
  }
  if (code === "email_provider_disabled" || message.includes("email provider")) {
    return t.authErrors.emailProviderDisabled;
  }
  if (
    code === "provider_not_found" ||
    code === "oauth_provider_not_enabled" ||
    message.includes("provider is not enabled") ||
    message.includes("unsupported provider")
  ) {
    return t.authErrors.providerNotEnabled;
  }
  if (code === "validation_failed" || message.includes("unable to validate email")) {
    return t.authErrors.invalidEmail;
  }
  if (code === "bad_oauth_state" || code === "bad_code_verifier") {
    return t.authErrors.expiredLink;
  }
  if (message.includes("fetch failed") || message.includes("network")) {
    return t.authErrors.networkError;
  }

  return t.authErrors.generic;
}

/**
 * Validates a redirect target. Only same-site absolute paths are allowed, so a
 * crafted `?next=https://evil.example` can never be used for an open redirect.
 */
export function safeRedirectPath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/",
): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (raw.includes("\\")) return fallback;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(raw)) return fallback;
  return raw;
}
