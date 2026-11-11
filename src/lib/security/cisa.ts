import { env } from "@/lib/env";
import { fetchWithRetry } from "@/lib/ingestion/http";

export interface CisaKevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: "Known" | "Unknown";
  notes?: string;
}

export interface CisaKevResult {
  entries: CisaKevEntry[];
  catalogVersion: string | null;
  dateReleased: string | null;
  count: number;
}

const KEV_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

/**
 * Downloads the CISA Known Exploited Vulnerabilities (KEV) catalog.
 * The catalog is the authoritative source that a vulnerability is known to be
 * exploited in the wild — DevReaderHub only marks `exploited = true` from this data.
 */
export async function fetchKevCatalog(): Promise<CisaKevResult> {
  const response = await fetchWithRetry(KEV_URL, {
    headers: { Accept: "application/json" },
    timeoutMs: env().INGEST_TIMEOUT_MS,
  });

  const json = (await response.json()) as {
    catalogVersion?: string;
    dateReleased?: string;
    count?: number;
    vulnerabilities?: CisaKevEntry[];
  };

  return {
    entries: json.vulnerabilities ?? [],
    catalogVersion: json.catalogVersion ?? null,
    dateReleased: json.dateReleased ?? null,
    count: json.count ?? json.vulnerabilities?.length ?? 0,
  };
}

export function severityFromCvss(score: number | null): "critical" | "high" | "medium" | "low" | "unknown" {
  if (score === null || Number.isNaN(score)) return "unknown";
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "medium";
  return "low";
}
