import { createReadClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import type { DatabaseVulnerability } from "@/lib/db/types";

export interface VulnerabilityView {
  cveId: string;
  title: string | null;
  description: string | null;
  cvssScore: number | null;
  cvssVector: string | null;
  severity: DatabaseVulnerability["severity"];
  vendor: string | null;
  product: string | null;
  publishedAt: string | null;
  modifiedAt: string | null;
  exploited: boolean;
  exploitationSource: string | null;
  inKev: boolean;
  kevDueDate: string | null;
  kevRansomwareUse: string | null;
  reference_urls: string[];
  origin: string;
  collectedAt: string;
}

function toView(row: DatabaseVulnerability): VulnerabilityView {
  return {
    cveId: row.cve_id,
    title: row.title,
    description: row.description,
    cvssScore: row.cvss_score,
    cvssVector: row.cvss_vector,
    severity: row.severity,
    vendor: row.vendor,
    product: row.product,
    publishedAt: row.published_at,
    modifiedAt: row.modified_at,
    exploited: row.exploited,
    exploitationSource: row.exploitation_source,
    inKev: row.in_kev,
    kevDueDate: row.kev_due_date,
    kevRansomwareUse: row.kev_ransomware_use,
    reference_urls: row.reference_urls ?? [],
    origin: row.origin,
    collectedAt: row.collected_at,
  };
}

export async function listVulnerabilities(options?: {
  limit?: number;
  exploitedOnly?: boolean;
  severity?: string;
  query?: string;
}): Promise<VulnerabilityView[]> {
  const supabase = await createReadClient();
  const limit = Math.min(200, options?.limit ?? 30);

  let builder = supabase
    .from("vulnerabilities")
    .select("*")
    .order("exploited", { ascending: false })
    .order("modified_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (options?.exploitedOnly) {
    builder = builder.eq("exploited", true);
  }
  if (options?.severity && options.severity !== "all") {
    builder = builder.eq("severity", options.severity);
  }
  if (options?.query) {
    const safe = options.query.replace(/[,%()]/g, " ").trim();
    if (safe) {
      builder = builder.or(
        `cve_id.ilike.%${safe}%,title.ilike.%${safe}%,description.ilike.%${safe}%,product.ilike.%${safe}%`,
      );
    }
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list vulnerabilities: ${error.message}`);
  }
  return ((data ?? []) as DatabaseVulnerability[]).map(toView);
}

export interface VulnerabilityUpsertInput {
  cve_id: string;
  title: string | null;
  description: string | null;
  cvss_score: number | null;
  cvss_vector: string | null;
  severity: DatabaseVulnerability["severity"];
  vendor: string | null;
  product: string | null;
  published_at: string | null;
  modified_at: string | null;
  exploited: boolean;
  exploitation_source: string | null;
  in_kev: boolean;
  kev_due_date: string | null;
  kev_ransomware_use: string | null;
  reference_urls: string[];
  origin: string;
  raw: Record<string, unknown>;
}

export async function upsertVulnerabilities(items: VulnerabilityUpsertInput[]): Promise<number> {
  if (items.length === 0) return 0;
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("vulnerabilities")
    .upsert(items, { onConflict: "cve_id" });
  if (error) {
    throw new Error(`Failed to store vulnerabilities: ${error.message}`);
  }
  return items.length;
}
