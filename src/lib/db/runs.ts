import { createReadClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import type {
  DatabaseIngestionRun,
  DatabaseIngestionRunItem,
} from "@/lib/db/types";

export interface RunWithItems extends DatabaseIngestionRun {
  items: DatabaseIngestionRunItem[];
}

export async function listRuns(limit = 20): Promise<DatabaseIngestionRun[]> {
  const supabase = await createReadClient();
  const { data, error } = await supabase
    .from("ingestion_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Failed to list ingestion runs: ${error.message}`);
  }
  return (data ?? []) as DatabaseIngestionRun[];
}

export async function getRunWithItems(runId: string): Promise<RunWithItems | null> {
  const supabase = await createReadClient();
  const { data: run, error } = await supabase
    .from("ingestion_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load ingestion run: ${error.message}`);
  }
  if (!run) return null;

  const { data: items, error: itemsError } = await supabase
    .from("ingestion_run_items")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });
  if (itemsError) {
    throw new Error(`Failed to load ingestion run items: ${itemsError.message}`);
  }

  return { ...(run as DatabaseIngestionRun), items: (items ?? []) as DatabaseIngestionRunItem[] };
}

export async function getLatestRun(): Promise<DatabaseIngestionRun | null> {
  const supabase = await createReadClient();
  const { data, error } = await supabase
    .from("ingestion_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1);
  if (error) {
    throw new Error(`Failed to load latest ingestion run: ${error.message}`);
  }
  return ((data ?? [])[0] as DatabaseIngestionRun | undefined) ?? null;
}

export async function createRun(trigger: string, lookbackHours: number) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("ingestion_runs")
    .insert({ trigger, lookback_hours: lookbackHours, status: "running" })
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create ingestion run: ${error.message}`);
  }
  return data as DatabaseIngestionRun;
}

export async function finishRun(
  id: string,
  update: Partial<
    Pick<
      DatabaseIngestionRun,
      | "status"
      | "finished_at"
      | "total_sources"
      | "ok_sources"
      | "failed_sources"
      | "new_articles"
      | "duplicate_articles"
      | "ai_processed"
      | "ai_failed"
      | "error"
    >
  >,
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("ingestion_runs")
    .update({ ...update, finished_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to finish ingestion run: ${error.message}`);
  }
}

export async function addRunItem(
  runId: string,
  item: {
    source_id: string | null;
    source_name: string;
    status: "success" | "failed" | "skipped";
    item_count: number;
    new_count: number;
    duplicate_count: number;
    duration_ms: number;
    error: string | null;
  },
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("ingestion_run_items").insert({ run_id: runId, ...item });
  if (error) {
    throw new Error(`Failed to record ingestion run item: ${error.message}`);
  }
}
