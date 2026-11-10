import { createReadClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import type { DatabaseArticle } from "@/lib/db/types";

export interface ArticleQuery {
  category?: string;
  sourceId?: string;
  q?: string;
  from?: string;
  to?: string;
  sort?: "latest" | "oldest" | "importance";
  page?: number;
  pageSize?: number;
  minImportance?: number;
  analyzedOnly?: boolean;
}

export interface ArticleListResult {
  items: DatabaseArticle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const ARTICLE_SELECT = "*, sources(name, slug, site_url, reliability)";

export async function listArticles(query: ArticleQuery = {}): Promise<ArticleListResult> {
  const supabase = await createReadClient();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 12));
  const from = (page - 1) * pageSize;

  let builder = supabase
    .from("articles")
    .select(ARTICLE_SELECT, { count: "exact" })
    .order("published_at", { ascending: query.sort !== "oldest" });

  if (query.sort === "importance") {
    builder = builder
      .order("importance", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false });
  }

  if (query.category && query.category !== "all") {
    builder = builder.eq("category", query.category);
  }
  if (query.sourceId) {
    builder = builder.eq("source_id", query.sourceId);
  }
  if (query.from) {
    builder = builder.gte("published_at", query.from);
  }
  if (query.to) {
    builder = builder.lte("published_at", query.to);
  }
  if (typeof query.minImportance === "number") {
    builder = builder.gte("importance", query.minImportance);
  }
  if (query.analyzedOnly) {
    builder = builder.not("ai_summary_bn", "is", null);
  }
  if (query.q) {
    const safe = query.q.replace(/[,%()]/g, " ").trim();
    if (safe.length > 0) {
      builder = builder.or(
        `title.ilike.%${safe}%,description.ilike.%${safe}%,ai_summary_bn.ilike.%${safe}%`,
      );
    }
  }

  const { data, error, count } = await builder.range(from, from + pageSize - 1);
  if (error) {
    throw new Error(`Failed to list articles: ${error.message}`);
  }

  const total = count ?? data?.length ?? 0;
  return {
    items: (data ?? []) as DatabaseArticle[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getArticleById(id: string): Promise<DatabaseArticle | null> {
  const supabase = await createReadClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load article: ${error.message}`);
  }
  return (data as DatabaseArticle | null) ?? null;
}

export async function getArticlesByIds(ids: string[]): Promise<DatabaseArticle[]> {
  if (ids.length === 0) return [];
  const supabase = await createReadClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .in("id", ids);
  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }
  return (data ?? []) as DatabaseArticle[];
}

export interface ArticleStats {
  totalArticles: number;
  articles24h: number;
  articles7d: number;
  analyzedArticles: number;
  totalSources: number;
  activeSources: number;
  categoryCounts: Record<string, number>;
  importantCount: number;
}

export async function getArticleStats(): Promise<ArticleStats> {
  const supabase = await createReadClient();
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [total, last24, last7, analyzed, sources, activeSources, categories, important] =
    await Promise.all([
      supabase.from("articles").select("id", { count: "exact", head: true }),
      supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .gte("published_at", dayAgo),
      supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .gte("published_at", weekAgo),
      supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .not("ai_summary_bn", "is", null),
      supabase.from("sources").select("id", { count: "exact", head: true }),
      supabase
        .from("sources")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase.from("articles").select("category"),
      supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .gte("importance", 4),
    ]);

  const categoryCounts: Record<string, number> = {};
  for (const row of categories.data ?? []) {
    categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1;
  }

  return {
    totalArticles: total.count ?? 0,
    articles24h: last24.count ?? 0,
    articles7d: last7.count ?? 0,
    analyzedArticles: analyzed.count ?? 0,
    totalSources: sources.count ?? 0,
    activeSources: activeSources.count ?? 0,
    categoryCounts,
    importantCount: important.count ?? 0,
  };
}

export interface WeeklyHighlight {
  id: string;
  title: string;
  url: string;
  category: string;
  published_at: string;
  importance: number | null;
  ai_summary_bn: string | null;
  source_name: string | null;
}

/** Weekly highlights are computed from stored records only. */
export async function getWeeklyHighlights(limit = 5): Promise<WeeklyHighlight[]> {
  const supabase = await createReadClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, title, url, category, published_at, importance, ai_summary_bn, sources(name)",
    )
    .gte("published_at", weekAgo)
    .order("importance", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load weekly highlights: ${error.message}`);
  }

  return (
    (data ?? []) as unknown as Array<{
      id: string;
      title: string;
      url: string;
      category: string;
      published_at: string;
      importance: number | null;
      ai_summary_bn: string | null;
      sources: { name: string } | null;
    }>
  ).map((row) => ({ ...row, source_name: row.sources?.name ?? null }));
}

export interface InsertArticleInput {
  source_id: string | null;
  title: string;
  url: string;
  canonical_url: string | null;
  url_hash: string;
  description: string | null;
  content: string | null;
  author: string | null;
  image_url: string | null;
  category: string;
  published_at: string;
  importance?: number | null;
  word_count?: number | null;
}

export interface InsertResult {
  inserted: number;
  duplicates: number;
  errors: string[];
}

/**
 * Inserts articles, skipping URLs that already exist (URL uniqueness is
 * enforced by a database constraint as well).
 */
export async function insertArticles(items: InsertArticleInput[]): Promise<InsertResult> {
  if (items.length === 0) {
    return { inserted: 0, duplicates: 0, errors: [] };
  }

  const supabase = createServiceSupabaseClient();
  const urls = items.map((item) => item.url);
  const { data: existing, error: existingError } = await supabase
    .from("articles")
    .select("url")
    .in("url", urls);
  if (existingError) {
    throw new Error(`Failed to check existing articles: ${existingError.message}`);
  }

  const existingUrls = new Set((existing ?? []).map((row) => row.url));
  const fresh = items.filter((item) => !existingUrls.has(item.url));
  const duplicates = items.length - fresh.length;

  if (fresh.length === 0) {
    return { inserted: 0, duplicates, errors: [] };
  }

  const { data, error } = await supabase
    .from("articles")
    .upsert(fresh, { onConflict: "url", ignoreDuplicates: true })
    .select("id");

  if (error) {
    return { inserted: 0, duplicates, errors: [error.message] };
  }

  return { inserted: data?.length ?? 0, duplicates, errors: [] };
}

export async function getUnprocessedArticles(limit: number): Promise<DatabaseArticle[]> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, sources(name, slug, site_url, reliability)")
    .is("ai_processed_at", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Failed to load unprocessed articles: ${error.message}`);
  }
  return (data ?? []) as DatabaseArticle[];
}

export async function markArticleAnalyzed(
  id: string,
  analysis: {
    summary_bn: string;
    why_it_matters: string;
    developer_impact: string;
    practical_action: string;
    importance_score: number;
    tags: string[];
    confidence: "low" | "medium" | "high";
    fact_status: "confirmed" | "reported" | "unverified";
    model: string;
  },
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("articles")
    .update({
      ai_summary_bn: analysis.summary_bn,
      ai_why_it_matters: analysis.why_it_matters,
      ai_developer_impact: analysis.developer_impact,
      ai_practical_action: analysis.practical_action,
      importance: analysis.importance_score,
      ai_tags: analysis.tags,
      ai_confidence: analysis.confidence,
      ai_fact_status: analysis.fact_status,
      ai_model: analysis.model,
      ai_processed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to save AI analysis: ${error.message}`);
  }
}

export async function setArticleImportance(id: string, importance: number): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("articles")
    .update({ importance })
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to update importance: ${error.message}`);
  }
}
