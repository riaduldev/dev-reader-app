import type { SupabaseClient } from "@supabase/supabase-js";

export interface DatabaseArticle {
  id: string;
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
  collected_at: string;
  importance: number | null;
  ai_summary_bn: string | null;
  ai_why_it_matters: string | null;
  ai_developer_impact: string | null;
  ai_practical_action: string | null;
  ai_tags: string[] | null;
  ai_confidence: string | null;
  ai_fact_status: string | null;
  ai_model: string | null;
  ai_processed_at: string | null;
  word_count: number | null;
  created_at: string;
  updated_at: string;
  sources?: { name: string; slug: string; site_url: string | null; reliability: string } | null;
}

export interface DatabaseSource {
  id: string;
  slug: string;
  name: string;
  feed_url: string | null;
  site_url: string | null;
  category: string;
  source_type: "rss" | "atom" | "json_api" | "html_index";
  reliability: "official" | "trusted" | "community";
  is_active: boolean;
  fetch_interval_minutes: number;
  last_success_at: string | null;
  last_attempt_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  consecutive_failures: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseGithubRepo {
  id: string;
  full_name: string;
  owner: string | null;
  name: string | null;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  language: string | null;
  license: string | null;
  topics: string[] | null;
  github_created_at: string | null;
  github_updated_at: string | null;
  github_pushed_at: string | null;
  score: number;
  score_components: Record<string, unknown> | null;
  query: string | null;
  collected_at: string;
}

export interface DatabaseVulnerability {
  id: string;
  cve_id: string;
  title: string | null;
  description: string | null;
  cvss_score: number | null;
  cvss_vector: string | null;
  severity: "critical" | "high" | "medium" | "low" | "unknown" | null;
  vendor: string | null;
  product: string | null;
  published_at: string | null;
  modified_at: string | null;
  exploited: boolean;
  exploitation_source: string | null;
  in_kev: boolean;
  kev_due_date: string | null;
  kev_ransomware_use: string | null;
  reference_urls: string[] | null;
  origin: string;
  raw: Record<string, unknown> | null;
  collected_at: string;
}

export interface DatabaseIngestionRun {
  id: string;
  trigger: string;
  status: "running" | "success" | "partial" | "failed";
  lookback_hours: number;
  started_at: string;
  finished_at: string | null;
  total_sources: number;
  ok_sources: number;
  failed_sources: number;
  new_articles: number;
  duplicate_articles: number;
  ai_processed: number;
  ai_failed: number;
  error: string | null;
}

export interface DatabaseIngestionRunItem {
  id: string;
  run_id: string;
  source_id: string | null;
  source_name: string;
  status: "success" | "failed" | "skipped";
  item_count: number;
  new_count: number;
  duplicate_count: number;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
}

export interface DatabaseBookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
  articles: DatabaseArticle | null;
}

export interface DatabaseHistoryEntry {
  id: string;
  user_id: string;
  article_id: string;
  viewed_at: string;
  articles: DatabaseArticle | null;
}

export interface DatabaseUserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface DatabaseUserPreferences {
  user_id: string;
  theme: "dark" | "light" | "system";
  language: "bn" | "en";
  density: "comfortable" | "compact";
  categories: string[] | null;
  email_digest: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseNotification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  kind: "info" | "success" | "warning" | "error";
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export type ServiceClient = SupabaseClient;
