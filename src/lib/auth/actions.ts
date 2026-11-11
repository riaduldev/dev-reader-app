"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { describeAuthError, logAuthFailure, safeRedirectPath } from "@/lib/auth/errors";
import type { AuthFormState } from "@/lib/auth/types";
import { getAuthSettings, type OAuthProvider } from "@/lib/auth/settings";
import { env } from "@/lib/env";
import { getDictionaryForRequest } from "@/lib/i18n/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

const OAUTH_PROVIDERS: OAuthProvider[] = ["google", "github"];

/**
 * Resolves the public origin of the deployment.
 * `NEXT_PUBLIC_SITE_URL` wins; otherwise the forwarded host is used, but only
 * when it looks like a plain host name (no path, no credentials).
 */
export async function getSiteOrigin(): Promise<string> {
  const configured = env().NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? (host ? "https" : "http");

  if (!host || !/^[a-z0-9.\-:[\]]+$/i.test(host)) {
    return "http://localhost:3000";
  }
  return `${proto}://${host}`;
}

/** Builds the OAuth callback URL for the current request. */
export async function buildOAuthRedirectUrl(next: string): Promise<string> {
  const origin = await getSiteOrigin();
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getDictionaryForRequest();

  if (!isSupabaseConfigured()) {
    return { error: t.authErrors.notConfigured, message: null };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!z.email().safeParse(email).success) {
    return { error: t.validation.email, message: null };
  }
  if (password.length < 8) {
    return { error: t.validation.passwordShort, message: null };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: describeAuthError(error, "signInWithPassword", t), message: null };
    }
  } catch (error) {
    logAuthFailure("signInWithPassword threw", error);
    return { error: t.authErrors.serverUnavailable, message: null };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getDictionaryForRequest();

  if (!isSupabaseConfigured()) {
    return { error: t.authErrors.notConfigured, message: null };
  }

  const settings = await getAuthSettings();
  if (settings.detected && !settings.signupEnabled) {
    return { error: t.authErrors.signupDisabled, message: null };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!z.email().safeParse(email).success) {
    return { error: t.validation.email, message: null };
  }
  if (password.length < 8) {
    return { error: t.validation.passwordShort, message: null };
  }
  if (fullName.length < 2) {
    return { error: t.validation.nameShort, message: null };
  }
  if (fullName.length > 120) {
    return { error: t.validation.nameLong, message: null };
  }
  if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
    return { error: t.validation.passwordWeak, message: null };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: await buildOAuthRedirectUrl("/onboarding"),
      },
    });

    if (error) {
      return { error: describeAuthError(error, "signUp", t), message: null };
    }

    if (!data.session) {
      return { error: null, message: t.auth.pendingVerification };
    }
  } catch (error) {
    logAuthFailure("signUp threw", error);
    return { error: t.authErrors.serverUnavailable, message: null };
  }

  redirect(safeRedirectPath(formData.get("next") ?? "/onboarding", "/onboarding"));
}

/**
 * Starts an OAuth sign-in. The provider list is a fixed allow-list and the
 * redirect target is always a same-site path.
 */
export async function signInWithOAuthAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getDictionaryForRequest();

  if (!isSupabaseConfigured()) {
    return { error: t.authErrors.notConfigured, message: null };
  }

  const provider = formData.get("provider");
  if (
    typeof provider !== "string" ||
    !OAUTH_PROVIDERS.includes(provider as OAuthProvider)
  ) {
    return { error: t.validation.unknownProvider, message: null };
  }

  const typedProvider = provider as OAuthProvider;
  const settings = await getAuthSettings();
  const enabled = typedProvider === "google" ? settings.google : settings.github;

  if (settings.detected && !enabled) {
    const label = typedProvider === "google" ? "Google" : "GitHub";
    return {
      error: t.authErrors.providerNotEnabled.replace("{provider}", label),
      message: null,
    };
  }

  const next = safeRedirectPath(formData.get("next"));
  const redirectTo = await buildOAuthRedirectUrl(next);

  let authorizeUrl: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: typedProvider,
      options: { redirectTo },
    });

    if (error) {
      return {
        error: describeAuthError(error, `signInWithOAuth:${typedProvider}`, t),
        message: null,
      };
    }

    authorizeUrl = data.url ?? null;
  } catch (error) {
    logAuthFailure(`signInWithOAuth:${typedProvider} threw`, error);
    return { error: t.authErrors.serverUnavailable, message: null };
  }

  if (!authorizeUrl) {
    return { error: t.authErrors.linkFailed, message: null };
  }

  // `redirect()` throws a control-flow error, so it must never be placed
  // inside a try/catch — otherwise the redirect would be swallowed and the
  // provider would never open.
  redirect(authorizeUrl);
}

/**
 * Sends a password recovery email.
 * The response is intentionally identical for known and unknown addresses so
 * the form cannot be used to discover which emails have an account.
 */
export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getDictionaryForRequest();

  if (!isSupabaseConfigured()) {
    return { error: t.authErrors.notConfigured, message: null };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!z.email().safeParse(email).success) {
    return { error: t.validation.email, message: null };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: await buildOAuthRedirectUrl("/reset-password"),
    });
    if (error) {
      return { error: describeAuthError(error, "resetPasswordForEmail", t), message: null };
    }
  } catch (error) {
    logAuthFailure("resetPasswordForEmail threw", error);
    return { error: t.authErrors.serverUnavailable, message: null };
  }

  return { error: null, message: t.auth.resetSent };
}

/** Sets a new password for the currently authenticated (recovery) session. */
export async function updatePasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getDictionaryForRequest();

  if (!isSupabaseConfigured()) {
    return { error: t.authErrors.notConfigured, message: null };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: t.validation.passwordShort, message: null };
  }
  if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
    return { error: t.validation.passwordWeak, message: null };
  }
  if (password !== confirm) {
    return { error: t.validation.passwordMismatch, message: null };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { error: describeAuthError(error, "updateUser", t), message: null };
    }
  } catch (error) {
    logAuthFailure("updateUser threw", error);
    return { error: t.authErrors.serverUnavailable, message: null };
  }

  redirect("/settings?password=updated");
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch (error) {
    logAuthFailure("signOut threw", error);
  }
  redirect("/");
}
