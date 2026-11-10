import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env, isConfigured } from "@/lib/env";

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function isConfigurationError(error: unknown): boolean {
  return error instanceof ConfigurationError;
}

export function isSupabaseConfigured(): boolean {
  return isConfigured("supabase");
}

/** Session-scoped client: RLS applies, so users can only reach their own rows. */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const e = env();
  if (!e.NEXT_PUBLIC_SUPABASE_URL || !e.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new ConfigurationError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component: the proxy already refreshed the
          // session, so writes are a no-op here.
        }
      },
    },
  }) as unknown as SupabaseClient;
}

/**
 * Read client for public content. Prefers the service role (no RLS overhead);
 * falls back to the session client, which is still allowed to SELECT the
 * public tables under the policies in the migration.
 */
export async function createReadClient(): Promise<SupabaseClient> {
  if (isConfigured("supabaseAdmin")) {
    return createServiceSupabaseClient();
  }
  return createServerSupabaseClient();
}

/** Service-role client: bypasses RLS. Only used by ingestion and admin routes. */
export function createServiceSupabaseClient(): SupabaseClient {
  const e = env();
  if (!e.NEXT_PUBLIC_SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY) {
    throw new ConfigurationError(
      "Supabase service role is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
