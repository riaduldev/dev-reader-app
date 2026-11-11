import { env } from "@/lib/env";
import { fetchWithRetry } from "@/lib/ingestion/http";
import { normalizeItem, type NormalizedItem } from "@/lib/ingestion/normalize";
import { classifyArticle, looksLikeJobPosting } from "@/lib/ingestion/classify";

export interface JsonApiItem {
  title: string | null;
  url: string | null;
  description: string | null;
  content: string | null;
  author: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
}

export interface JsonApiResult {
  items: JsonApiItem[];
  warnings: string[];
}

function toIsoFromEpoch(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

/** Remote OK public API: https://remoteok.com/api */
function parseRemoteOk(json: unknown): JsonApiResult {
  if (!Array.isArray(json)) {
    throw new Error("Remote OK response was not an array.");
  }
  const items: JsonApiItem[] = [];
  for (const entry of json) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.position !== "string") continue;
    if (typeof row.url !== "string") continue;
    const company = typeof row.company === "string" ? row.company : null;
    const location = typeof row.location === "string" ? row.location : null;
    const tags = Array.isArray(row.tags) ? (row.tags as string[]).join(", ") : null;
    items.push({
      title: company ? `${row.position} — ${company}` : row.position,
      url: row.url,
      description:
        (typeof row.description === "string" ? row.description : null) ??
        tags ??
        (location ? `Location: ${location}` : null),
      content: null,
      author: company,
      imageUrl: typeof row.logo === "string" ? row.logo : null,
      publishedAt: toIsoFromEpoch(row.date),
    });
  }
  return { items, warnings: [] };
}

/** Arbeitnow job board API: https://www.arbeitnow.com/api/job-board-api */
function parseArbeitnow(json: unknown): JsonApiResult {
  const rows =
    json && typeof json === "object" && Array.isArray((json as { data?: unknown }).data)
      ? ((json as { data: unknown[] }).data)
      : null;
  if (!rows) {
    throw new Error("Arbeitnow response did not contain a data array.");
  }
  const items: JsonApiItem[] = [];
  for (const entry of rows) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.title !== "string" || typeof row.url !== "string") continue;
    items.push({
      title: row.title,
      url: row.url,
      description:
        (typeof row.description === "string" ? row.description : null) ??
        (Array.isArray(row.tags) ? (row.tags as string[]).join(", ") : null),
      content: null,
      author: typeof row.company === "string" ? row.company : null,
      imageUrl: null,
      publishedAt: toIsoFromEpoch(row.date),
    });
  }
  return { items, warnings: [] };
}

/**
 * Fetches a JSON API source. Only officially published, public APIs are used —
 * DevReaderHub never scrapes HTML pages that lack a feed or API.
 */
export async function fetchJsonApiItems(
  url: string,
  sourceSlug: string,
): Promise<JsonApiResult> {
  const response = await fetchWithRetry(url, {
    accept: "application/json",
    timeoutMs: env().INGEST_TIMEOUT_MS,
  });
  const json = (await response.json()) as unknown;

  if (sourceSlug === "remoteok") return parseRemoteOk(json);
  if (sourceSlug === "arbeitnow") return parseArbeitnow(json);

  throw new Error(
    `No JSON API adapter is registered for source "${sourceSlug}". Add an adapter in src/lib/ingestion/apis.ts before enabling this source.`,
  );
}

export function buildJsonApiItems(
  rawItems: JsonApiItem[],
  sourceCategory: string,
): { items: NormalizedItem[]; skipped: number } {
  const items: NormalizedItem[] = [];
  let skipped = 0;

  for (const raw of rawItems) {
    const classification = classifyArticle({
      title: raw.title ?? "",
      description: raw.description,
      sourceCategory,
    });

    const category = looksLikeJobPosting(raw.title ?? "", raw.description)
      ? "jobs"
      : classification.category;

    const normalized = normalizeItem({
      title: raw.title,
      url: raw.url,
      description: raw.description,
      author: raw.author,
      imageUrl: raw.imageUrl,
      publishedAt: raw.publishedAt,
      category,
      matchedTerms: classification.matchedTerms,
    });

    if (!normalized) {
      skipped += 1;
      continue;
    }
    items.push(normalized);
  }

  return { items, skipped };
}
