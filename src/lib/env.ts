import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? undefined : v))
  .optional();

/**
 * Runtime-validated environment configuration.
 *
 * The app is designed to boot without any credentials so that the UI can show
 * a precise "not configured" state instead of crashing. Every integration
 * checks `isConfigured()` / `requireConfig()` before doing real work.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-4o-mini"),
  OPENAI_BASE_URL: optionalString,
  GITHUB_TOKEN: optionalString,
  CRON_SECRET: optionalString,
  INGEST_LOOKBACK_HOURS: z.coerce.number().int().min(1).max(720).default(24),
  INGEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
  INGEST_MAX_RETRIES: z.coerce.number().int().min(0).max(6).default(3),
  AI_IMPORTANCE_THRESHOLD: z.coerce.number().int().min(1).max(5).default(3),
  AI_MAX_ARTICLES_PER_RUN: z.coerce.number().int().min(0).max(500).default(40),
  NEXT_PUBLIC_SITE_URL: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      CRON_SECRET: process.env.CRON_SECRET,
      INGEST_LOOKBACK_HOURS: process.env.INGEST_LOOKBACK_HOURS,
      INGEST_TIMEOUT_MS: process.env.INGEST_TIMEOUT_MS,
      INGEST_MAX_RETRIES: process.env.INGEST_MAX_RETRIES,
      AI_IMPORTANCE_THRESHOLD: process.env.AI_IMPORTANCE_THRESHOLD,
      AI_MAX_ARTICLES_PER_RUN: process.env.AI_MAX_ARTICLES_PER_RUN,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    });

    if (!parsed.success) {
      throw new Error(
        `Invalid environment configuration: ${parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      );
    }
    cached = parsed.data;
  }
  return cached;
}

export type ConfigKey =
  | "supabase"
  | "supabaseAdmin"
  | "openai"
  | "github"
  | "cron";

export function isConfigured(key: ConfigKey): boolean {
  const e = env();
  switch (key) {
    case "supabase":
      return Boolean(e.NEXT_PUBLIC_SUPABASE_URL && e.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    case "supabaseAdmin":
      return Boolean(
        e.NEXT_PUBLIC_SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY,
      );
    case "openai":
      return Boolean(e.OPENAI_API_KEY);
    case "github":
      return true; // Unauthenticated GitHub search works with a lower rate limit.
    case "cron":
      return Boolean(e.CRON_SECRET);
  }
}

export function missingConfigMessage(key: ConfigKey): string {
  switch (key) {
    case "supabase":
    case "supabaseAdmin":
      return "Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY এবং SUPABASE_SERVICE_ROLE_KEY।";
    case "openai":
      return "OpenAI configuration missing. Set OPENAI_API_KEY।";
    case "github":
      return "GitHub configuration missing.";
    case "cron":
      return "CRON_SECRET configuration missing.";
  }
}
