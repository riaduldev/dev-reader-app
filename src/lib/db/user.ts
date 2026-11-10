import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  DatabaseBookmark,
  DatabaseHistoryEntry,
  DatabaseNotification,
  DatabaseUserPreferences,
  DatabaseUserProfile,
} from "@/lib/db/types";

const ARTICLE_SELECT = "articles(*, sources(name, slug, site_url, reliability))";

export async function listBookmarks(userId: string): Promise<DatabaseBookmark[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select(`*, ${ARTICLE_SELECT}`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Failed to load bookmarks: ${error.message}`);
  }
  return (data ?? []) as DatabaseBookmark[];
}

export async function listBookmarkedArticleIds(userId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select("article_id")
    .eq("user_id", userId);
  if (error) {
    throw new Error(`Failed to load bookmarks: ${error.message}`);
  }
  return (data ?? []).map((row) => row.article_id as string);
}

export async function toggleBookmark(
  userId: string,
  articleId: string,
): Promise<{ bookmarked: boolean }> {
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: lookupError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("article_id", articleId)
    .maybeSingle();
  if (lookupError) {
    throw new Error(`Failed to check bookmark: ${lookupError.message}`);
  }

  if (existing) {
    const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
    if (error) {
      throw new Error(`Failed to remove bookmark: ${error.message}`);
    }
    return { bookmarked: false };
  }

  const { error } = await supabase
    .from("bookmarks")
    .insert({ user_id: userId, article_id: articleId });
  if (error) {
    throw new Error(`Failed to add bookmark: ${error.message}`);
  }
  return { bookmarked: true };
}

export async function recordReading(userId: string, articleId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("reading_history").upsert(
    { user_id: userId, article_id: articleId, viewed_at: new Date().toISOString() },
    { onConflict: "user_id,article_id" },
  );
  if (error) {
    throw new Error(`Failed to record reading history: ${error.message}`);
  }
}

export async function listHistory(
  userId: string,
  limit = 50,
): Promise<DatabaseHistoryEntry[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reading_history")
    .select(`*, ${ARTICLE_SELECT}`)
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Failed to load reading history: ${error.message}`);
  }
  return (data ?? []) as DatabaseHistoryEntry[];
}

export async function clearHistory(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("reading_history").delete().eq("user_id", userId);
  if (error) {
    throw new Error(`Failed to clear reading history: ${error.message}`);
  }
}

export async function getPreferences(
  userId: string,
): Promise<DatabaseUserPreferences | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load preferences: ${error.message}`);
  }
  return (data as DatabaseUserPreferences | null) ?? null;
}

export async function updatePreferences(
  userId: string,
  patch: Partial<
    Pick<
      DatabaseUserPreferences,
      "theme" | "language" | "density" | "categories" | "email_digest"
    >
  >,
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
}

export async function getProfile(userId: string): Promise<DatabaseUserProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }
  return (data as DatabaseUserProfile | null) ?? null;
}

export async function updateProfile(
  userId: string,
  patch: { full_name?: string | null; avatar_url?: string | null },
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("user_profiles")
    .update(patch)
    .eq("id", userId);
  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

export async function listNotifications(
  userId: string,
  limit = 20,
): Promise<DatabaseNotification[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Failed to load notifications: ${error.message}`);
  }
  return (data ?? []) as DatabaseNotification[];
}

export async function markNotificationsRead(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) {
    throw new Error(`Failed to update notifications: ${error.message}`);
  }
}
