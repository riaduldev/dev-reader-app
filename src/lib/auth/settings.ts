import { env, isConfigured } from "@/lib/env";

export type OAuthProvider = "google" | "github";

export interface AuthSettings {
  /** Email/password sign-in and sign-up are available. */
  email: boolean;
  google: boolean;
  github: boolean;
  /** Supabase confirms new email addresses automatically (no verification step). */
  autoconfirm: boolean;
  /** The project allows new sign-ups. */
  signupEnabled: boolean;
  /** True when the settings endpoint could not be read (offline / not configured). */
  detected: boolean;
}

const FALLBACK: AuthSettings = {
  email: true,
  google: false,
  github: false,
  autoconfirm: false,
  signupEnabled: true,
  detected: false,
};

interface SupabaseAuthSettings {
  external?: Record<string, boolean | { enabled?: boolean }>;
  mailer_autoconfirm?: boolean;
  disable_signup?: boolean;
}

/**
 * Reads the project's Auth configuration from the public GoTrue settings
 * endpoint so the UI can show exactly which sign-in methods are enabled
 * instead of offering a button that cannot work.
 *
 * The endpoint is public by design (it is what the Supabase client library
 * itself uses) and contains no secrets.
 */
export async function getAuthSettings(): Promise<AuthSettings> {
  const e = env();
  if (!e.NEXT_PUBLIC_SUPABASE_URL || !e.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return FALLBACK;
  }

  try {
    const response = await fetch(
      `${e.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/settings`,
      {
        headers: { apikey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY },
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      console.error(
        `[auth] settings endpoint responded with ${response.status}; falling back to email-only UI.`,
      );
      return FALLBACK;
    }

    const settings = (await response.json()) as SupabaseAuthSettings;
    const external = settings.external ?? {};

    const enabled = (provider: string): boolean => {
      const value = external[provider];
      if (typeof value === "boolean") return value;
      if (value && typeof value === "object") return Boolean(value.enabled);
      return false;
    };

    return {
      email: enabled("email"),
      google: enabled("google"),
      github: enabled("github"),
      autoconfirm: Boolean(settings.mailer_autoconfirm),
      signupEnabled: settings.disable_signup !== true,
      detected: true,
    };
  } catch (error) {
    console.error("[auth] failed to read the Auth settings endpoint:", error);
    return FALLBACK;
  }
}

export function providerEnabled(settings: AuthSettings, provider: OAuthProvider): boolean {
  return provider === "google" ? settings.google : settings.github;
}

export function isSupabaseAuthConfigured(): boolean {
  return isConfigured("supabase");
}
