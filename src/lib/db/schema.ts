import { env, isConfigured } from "@/lib/env";
import { getDictionaryForRequest } from "@/lib/i18n/server";

/**
 * Every table the application needs. The list mirrors
 * `supabase/migrations/0001_init.sql` and `0002_auth_onboarding.sql`.
 */
export const REQUIRED_TABLES = [
  "articles",
  "sources",
  "ingestion_runs",
  "ingestion_run_items",
  "github_repos",
  "vulnerabilities",
  "user_profiles",
  "user_preferences",
  "bookmarks",
  "reading_history",
  "notifications",
] as const;

export interface SchemaStatus {
  ok: boolean;
  present: string[];
  missing: string[];
  checkedAt: string;
  error: string | null;
}

/**
 * Detects the PostgREST error that is raised when a table does not exist in
 * the database (or when its schema cache is out of date).
 */
export function isMissingSchemaError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return (
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("PGRST205") ||
    message.includes("does not exist") ||
    message.includes("relation \"public.")
  );
}

/** A short, actionable, localised message for database failures. */
export async function describeDbError(error: unknown): Promise<string> {
  const t = await getDictionaryForRequest();
  if (isMissingSchemaError(error)) {
    return t.errors.dbSchema;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return t.errors.dbUnavailable;
}

/**
 * Reads the Data API schema and reports which tables exist.
 *
 * The OpenAPI document of the Data API lists every exposed table, so this is
 * a cheap and reliable way to find out whether the migrations were applied.
 */
export async function getSchemaStatus(): Promise<SchemaStatus> {
  const t = await getDictionaryForRequest();
  const checkedAt = new Date().toISOString();

  if (!isConfigured("supabaseAdmin")) {
    return {
      ok: false,
      present: [],
      missing: [...REQUIRED_TABLES],
      checkedAt,
      error: t.errors.dbUnavailable,
    };
  }

  const e = env();
  try {
    const response = await fetch(
      `${e.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/`,
      {
        headers: {
          apikey: e.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        present: [],
        missing: [...REQUIRED_TABLES],
        checkedAt,
        error: `${t.errors.dbUnavailable} (HTTP ${response.status})`,
      };
    }

    const document = (await response.json()) as { paths?: Record<string, unknown> };
    const exposed = Object.keys(document.paths ?? {});

    const present = REQUIRED_TABLES.filter((table) =>
      exposed.some((path) => path === `/${table}`),
    );
    const missing = REQUIRED_TABLES.filter((table) => !present.includes(table));

    return {
      ok: missing.length === 0,
      present,
      missing,
      checkedAt,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      present: [],
      missing: [...REQUIRED_TABLES],
      checkedAt,
      error: error instanceof Error ? error.message : t.errors.dbUnavailable,
    };
  }
}
