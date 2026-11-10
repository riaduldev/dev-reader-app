"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
