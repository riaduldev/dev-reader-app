import { env } from "@/lib/env";
import {
  addRunItem,
  createRun,
  finishRun,
} from "@/lib/db/runs";
import { insertArticles, type InsertArticleInput } from "@/lib/db/articles";
import {
  listSources,
  recordSourceFailure,
  recordSourceSuccess,
} from "@/lib/db/sources";
import type { DatabaseSource } from "@/lib/db/types";
import { buildNormalizedItems, fetchFeedItems } from "@/lib/ingestion/feeds";
import { buildJsonApiItems, fetchJsonApiItems } from "@/lib/ingestion/apis";
import { scoreImportance } from "@/lib/ingestion/importance";
import { analyzeArticle } from "@/lib/ai/analyze";
import { getUnprocessedArticles, markArticleAnalyzed } from "@/lib/db/articles";
import { syncVulnerabilities } from "@/lib/security/sync";
import { collectGithubRepositories } from "@/lib/github/collect";
import { notifyAllUsers } from "@/lib/db/notifications";

export interface IngestionOptions {
  trigger: "cron" | "manual" | "admin";
  lookbackHours?: number;
  /** Restrict the run to specific source ids (used by "sync now" in the admin UI). */
  sourceIds?: string[];
  category?: string;
  /** Runs the AI analysis step. Disabled for cheap "collect only" runs. */
  runAi?: boolean;
  /** Runs the security intelligence sync (CISA KEV + NVD). */
  runSecurity?: boolean;
  /** Runs the GitHub repository search. */
  runGithub?: boolean;
  /** Maximum number of sources processed in parallel. */
  concurrency?: number;
}

export interface IngestionSummary {
  runId: string | null;
  status: "success" | "partial" | "failed" | "running";
  totalSources: number;
  okSources: number;
  failedSources: number;
  newArticles: number;
  duplicateArticles: number;
  aiProcessed: number;
  aiFailed: number;
  errors: string[];
  skipped: Array<{ source: string; reason: string }>;
}

function emptySummary(): IngestionSummary {
  return {
    runId: null,
    status: "running",
    totalSources: 0,
    okSources: 0,
    failedSources: 0,
    newArticles: 0,
    duplicateArticles: 0,
    aiProcessed: 0,
    aiFailed: 0,
    errors: [],
    skipped: [],
  };
}

interface SourceResult {
  source: DatabaseSource;
  status: "success" | "failed" | "skipped";
  itemCount: number;
  newCount: number;
  duplicateCount: number;
  durationMs: number;
  error: string | null;
}

/** Raised for sources DevReaderHub intentionally does not collect from. */
class UnsupportedSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedSourceError";
  }
}

/** Collects the items of a single source, honouring the lookback window. */
async function collectSource(
  source: DatabaseSource,
  lookbackHours: number,
): Promise<{ items: InsertArticleInput[]; itemCount: number; skipped: number }> {
  const cutoff = Date.now() - lookbackHours * 60 * 60 * 1000;

  let raw: Array<{
    title: string | null;
    url: string | null;
    description: string | null;
    content: string | null;
    author: string | null;
    imageUrl: string | null;
    publishedAt: string | null;
  }>;

  if (source.source_type === "rss" || source.source_type === "atom") {
    if (!source.feed_url) {
      throw new Error(`Source "${source.name}" has no feed URL configured.`);
    }
    const feed = await fetchFeedItems(source.feed_url);
    raw = feed.items;
  } else if (source.source_type === "json_api") {
    if (!source.feed_url) {
      throw new Error(`Source "${source.name}" has no API URL configured.`);
    }
    if (source.slug === "github-search") {
      throw new UnsupportedSourceError(
        "The GitHub Search API source is collected by the dedicated GitHub step.",
      );
    }
    const api = await fetchJsonApiItems(source.feed_url, source.slug);
    raw = api.items;
  } else {
    throw new UnsupportedSourceError(
      `Source "${source.name}" is an index-only source without a machine-readable feed. DevReaderHub does not scrape it.`,
    );
  }

  const normalized =
    source.source_type === "json_api"
      ? buildJsonApiItems(raw, source.category)
      : buildNormalizedItems(raw, source.category);

  const withinWindow = normalized.items.filter(
    (item) => item.publishedAt.getTime() >= cutoff,
  );

  const rows: InsertArticleInput[] = withinWindow.map((item) => ({
    source_id: source.id,
    title: item.title,
    url: item.url,
    canonical_url: item.canonicalUrl,
    url_hash: item.urlHash,
    description: item.description,
    content: item.content,
    author: item.author,
    image_url: item.imageUrl,
    category: item.category,
    published_at: item.publishedAt.toISOString(),
    importance: scoreImportance({
      title: item.title,
      description: item.description ?? item.content,
      category: item.category,
      sourceReliability: source.reliability,
      matchedTerms: item.matchedTerms,
    }),
    word_count: item.wordCount,
  }));

  return {
    items: rows,
    itemCount: normalized.items.length,
    skipped: normalized.skipped + (normalized.items.length - withinWindow.length),
  };
}

async function processSource(
  source: DatabaseSource,
  lookbackHours: number,
): Promise<SourceResult> {
  const started = Date.now();

  try {
    const { items, itemCount } = await collectSource(source, lookbackHours);
    const result = await insertArticles(items);
    await recordSourceSuccess(source.id);

    return {
      source,
      status: "success",
      itemCount,
      newCount: result.inserted,
      duplicateCount: result.duplicates,
      durationMs: Date.now() - started,
      error: result.errors.length > 0 ? result.errors.join("; ") : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const unsupported = error instanceof UnsupportedSourceError;

    if (!unsupported) {
      try {
        await recordSourceFailure(source.id, message);
      } catch {
        // Ignore status-write failures; the error is still recorded on the run.
      }
    }

    return {
      source,
      status: unsupported ? "skipped" : "failed",
      itemCount: 0,
      newCount: 0,
      duplicateCount: 0,
      durationMs: Date.now() - started,
      error: message,
    };
  }
}

/** Runs the AI analysis step for eligible, not-yet-processed articles. */
async function runAiAnalysis(): Promise<{ processed: number; failed: number }> {
  const e = env();
  if (!e.OPENAI_API_KEY) {
    return { processed: 0, failed: 0 };
  }

  const threshold = e.AI_IMPORTANCE_THRESHOLD;
  const limit = e.AI_MAX_ARTICLES_PER_RUN;
  if (limit <= 0) return { processed: 0, failed: 0 };

  const candidates = await getUnprocessedArticles(limit * 2);
  const eligible = candidates.filter(
    (article) => (article.importance ?? 0) >= threshold,
  ).slice(0, limit);

  let processed = 0;
  let failed = 0;

  for (const article of eligible) {
    try {
      const analysis = await analyzeArticle({
        title: article.title,
        description: article.description,
        content: article.content,
        category: article.category,
        sourceName: article.sources?.name ?? "Unknown source",
        sourceReliability: article.sources?.reliability ?? null,
        publishedAt: article.published_at,
        url: article.url,
      });
      if (!analysis) {
        failed += 1;
        continue;
      }
      await markArticleAnalyzed(article.id, {
        summary_bn: analysis.summary_bn,
        why_it_matters: analysis.why_it_matters,
        developer_impact: analysis.developer_impact,
        practical_action: analysis.practical_action,
        importance_score: analysis.importance_score,
        tags: analysis.tags,
        confidence: analysis.confidence,
        fact_status: analysis.fact_status,
        model: e.OPENAI_MODEL,
      });
      processed += 1;
    } catch (error) {
      // A failed analysis never fabricates content: the article stays
      // unprocessed and can be retried on the next run. The reason is logged
      // on the server so quota/auth problems stay diagnosable.
      console.error(
        `[ai] analysis failed for article ${article.id}:`,
        error instanceof Error ? error.message : error,
      );
      failed += 1;
    }
  }

  return { processed, failed };
}

/**
 * Runs a full ingestion cycle: collect every active source, analyse eligible
 * articles and refresh the security intelligence. One failing source never
 * stops the others.
 */
export async function runIngestion(options: IngestionOptions): Promise<IngestionSummary> {
  const e = env();
  const lookbackHours = options.lookbackHours ?? e.INGEST_LOOKBACK_HOURS;
  const summary = emptySummary();

  const sources = (await listSources({ activeOnly: true })).filter((source) => {
    if (options.sourceIds?.length) return options.sourceIds.includes(source.id);
    if (options.category) return source.category === options.category;
    return true;
  });

  summary.totalSources = sources.length;

  let runId: string | null = null;
  try {
    const run = await createRun(options.trigger, lookbackHours);
    runId = run.id;
    summary.runId = run.id;
  } catch (error) {
    summary.status = "failed";
    summary.errors.push(
      `Could not start the ingestion run: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return summary;
  }

  const concurrency = Math.max(1, options.concurrency ?? 4);
  const queue = [...sources];
  const results: SourceResult[] = [];

  const worker = async (): Promise<void> => {
    for (;;) {
      const source = queue.shift();
      if (!source) return;
      const result = await processSource(source, lookbackHours);
      results.push(result);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, worker));

  for (const result of results) {
    if (result.status === "failed") {
      summary.failedSources += 1;
      summary.errors.push(`${result.source.name}: ${result.error ?? "unknown error"}`);
    } else if (result.status === "skipped") {
      summary.skipped.push({
        source: result.source.name,
        reason: result.error ?? "skipped",
      });
    } else {
      summary.okSources += 1;
      summary.newArticles += result.newCount;
      summary.duplicateArticles += result.duplicateCount;
    }

    await addRunItem(runId, {
      source_id: result.source.id,
      source_name: result.source.name,
      status: result.status,
      item_count: result.itemCount,
      new_count: result.newCount,
      duplicate_count: result.duplicateCount,
      duration_ms: result.durationMs,
      error: result.error,
    });
  }

  if (options.runAi !== false) {
    const ai = await runAiAnalysis();
    summary.aiProcessed = ai.processed;
    summary.aiFailed = ai.failed;
  }

  if (options.runSecurity) {
    try {
      const security = await syncVulnerabilities();
      await addRunItem(runId, {
        source_id: null,
        source_name: "Security intelligence (CISA KEV + NVD)",
        status: "success",
        item_count: security.total,
        new_count: security.stored,
        duplicate_count: 0,
        duration_ms: security.durationMs,
        error: security.warnings.join("; ") || null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push(`Security sync failed: ${message}`);
      await addRunItem(runId, {
        source_id: null,
        source_name: "Security intelligence (CISA KEV + NVD)",
        status: "failed",
        item_count: 0,
        new_count: 0,
        duplicate_count: 0,
        duration_ms: 0,
        error: message,
      });
    }
  }

  if (options.runGithub) {
    try {
      const github = await collectGithubRepositories();
      await addRunItem(runId, {
        source_id: null,
        source_name: "GitHub repository search",
        status: "success",
        item_count: github.total,
        new_count: github.stored,
        duplicate_count: 0,
        duration_ms: github.durationMs,
        error: github.warnings.join("; ") || null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push(`GitHub collection failed: ${message}`);
      await addRunItem(runId, {
        source_id: null,
        source_name: "GitHub repository search",
        status: "failed",
        item_count: 0,
        new_count: 0,
        duplicate_count: 0,
        duration_ms: 0,
        error: message,
      });
    }
  }

  const status: IngestionSummary["status"] =
    summary.failedSources === 0
      ? "success"
      : summary.okSources > 0
        ? "partial"
        : "failed";

  summary.status = status;

  if (summary.newArticles > 0) {
    try {
      await notifyAllUsers({
        title: `${summary.newArticles} টি নতুন নিবন্ধ সংগৃহীত হয়েছে`,
        body: `গত সংগ্রহে ${summary.okSources} টি সোর্স থেকে ${summary.newArticles} টি নতুন নিবন্ধ যোগ হয়েছে।`,
        kind: "success",
        link: "/news",
      });
    } catch {
      // Notification failures must never fail an ingestion run.
    }
  }

  await finishRun(runId, {
    status,
    total_sources: summary.totalSources,
    ok_sources: summary.okSources,
    failed_sources: summary.failedSources,
    new_articles: summary.newArticles,
    duplicate_articles: summary.duplicateArticles,
    ai_processed: summary.aiProcessed,
    ai_failed: summary.aiFailed,
    error: summary.errors.length > 0 ? summary.errors.join("\n").slice(0, 4000) : null,
  });

  return summary;
}

/** Tests a single source without writing any article. */
export async function testSource(source: DatabaseSource): Promise<{
  ok: boolean;
  itemCount: number;
  message: string;
}> {
  try {
    const { items, itemCount } = await collectSource(source, env().INGEST_LOOKBACK_HOURS);
    return {
      ok: true,
      itemCount,
      message: `সফল — ${itemCount} টি আইটেম পাওয়া গেছে, ${items.length} টি লুকব্যাক উইন্ডোর মধ্যে।`,
    };
  } catch (error) {
    return {
      ok: false,
      itemCount: 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
