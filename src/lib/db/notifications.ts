import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { DatabaseNotification } from "@/lib/db/types";

export interface NotificationInput {
  title: string;
  body?: string | null;
  kind?: "info" | "success" | "warning" | "error";
  link?: string | null;
}

/**
 * Creates a notification for every registered user.
 * Used by the ingestion engine to report new content.
 */
export async function notifyAllUsers(input: NotificationInput): Promise<number> {
  const supabase = createServiceSupabaseClient();

  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("id");
  if (error) {
    throw new Error(`Failed to load user profiles: ${error.message}`);
  }

  const rows = (profiles ?? []).map((profile) => ({
    user_id: profile.id,
    title: input.title,
    body: input.body ?? null,
    kind: input.kind ?? "info",
    link: input.link ?? null,
  }));
  if (rows.length === 0) return 0;

  const { error: insertError } = await supabase
    .from("notifications")
    .insert(rows);
  if (insertError) {
    throw new Error(`Failed to create notifications: ${insertError.message}`);
  }
  return rows.length;
}

export async function listRecentNotifications(
  limit = 20,
): Promise<DatabaseNotification[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Failed to load notifications: ${error.message}`);
  }
  return (data ?? []) as DatabaseNotification[];
}
