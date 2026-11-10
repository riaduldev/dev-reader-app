"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Browser client (anon key). RLS protects per-user tables.
 * Returns `null` when Supabase is not configured so the UI can degrade.
 */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  const e = env();
  if (!e.NEXT_PUBLIC_SUPABASE_URL || !e.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  if (!cached) {
    cached = createBrowserClient(
      e.NEXT_PUBLIC_SUPABASE_URL,
      e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return cached;
}
