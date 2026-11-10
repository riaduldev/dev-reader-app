import { createReadClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import type { DatabaseSource } from "@/lib/db/types";

export async function listSources(options?: {
  activeOnly?: boolean;
  category?: string;
}): Promise<DatabaseSource[]> {
  const supabase = await createReadClient();
  let builder = supabase.from("sources").select("*").order("name");
  if (options?.activeOnly) {
    builder = builder.eq("is_active", true);
  }
  if (options?.category) {
    builder = builder.eq("category", options.category);
  }
  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list sources: ${error.message}`);
  }
  return (data ?? []) as DatabaseSource[];
}

export async function getSourceById(id: string): Promise<DatabaseSource | null> {
  const supabase = await createReadClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load source: ${error.message}`);
  }
  return (data as DatabaseSource | null) ?? null;
}

export async function getLastSuccessfulSync(): Promise<{
  sourceName: string;
  at: string;
} | null> {
  const supabase = await createReadClient();
  const { data, error } = await supabase
    .from("sources")
    .select("name, last_success_at")
    .not("last_success_at", "is", null)
    .order("last_success_at", { ascending: false })
    .limit(1);
  if (error) {
    throw new Error(`Failed to load sync status: ${error.message}`);
  }
  const row = (data ?? [])[0] as { name: string; last_success_at: string } | undefined;
  return row ? { sourceName: row.name, at: row.last_success_at } : null;
}

export interface SourceUpsertInput {
  id?: string;
  slug: string;
  name: string;
  feed_url: string | null;
  site_url: string | null;
  category: string;
  source_type: DatabaseSource["source_type"];
  reliability: DatabaseSource["reliability"];
  is_active: boolean;
  fetch_interval_minutes: number;
  notes?: string | null;
}

export async function upsertSource(input: SourceUpsertInput): Promise<DatabaseSource> {
  const supabase = createServiceSupabaseClient();
  const payload = {
    slug: input.slug,
    name: input.name,
    feed_url: input.feed_url,
    site_url: input.site_url,
    category: input.category,
    source_type: input.source_type,
    reliability: input.reliability,
    is_active: input.is_active,
    fetch_interval_minutes: input.fetch_interval_minutes,
    notes: input.notes ?? null,
  };

  const query = input.id
    ? supabase.from("sources").update(payload).eq("id", input.id).select("*").single()
    : supabase.from("sources").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to save source: ${error.message}`);
  }
  return data as DatabaseSource;
}

export async function setSourceActive(id: string, isActive: boolean): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("sources").update({ is_active: isActive }).eq("id", id);
  if (error) {
    throw new Error(`Failed to update source: ${error.message}`);
  }
}

export async function recordSourceSuccess(id: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("sources")
    .update({
      last_success_at: new Date().toISOString(),
      last_attempt_at: new Date().toISOString(),
      last_error: null,
      last_error_at: null,
      consecutive_failures: 0,
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to update source status: ${error.message}`);
  }
}

export async function recordSourceFailure(id: string, message: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("sources")
    .update({
      last_attempt_at: new Date().toISOString(),
      last_error: message.slice(0, 2000),
      last_error_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to update source status: ${error.message}`);
  }
}

export async function deleteSource(id: string): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("sources").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete source: ${error.message}`);
  }
}
