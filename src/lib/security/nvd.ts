import { env } from "@/lib/env";
import { fetchWithRetry } from "@/lib/ingestion/http";
import { severityFromCvss } from "@/lib/security/cisa";

export interface NvdCve {
  cveId: string;
  sourceIdentifier: string | null;
  published: string | null;
  lastModified: string | null;
  vulnStatus: string | null;
  description: string | null;
  cvssScore: number | null;
  cvssVector: string | null;
  cvssVersion: string | null;
  references: string[];
  weaknesses: string[];
  vendor: string | null;
  product: string | null;
  raw: Record<string, unknown>;
}

export interface NvdResult {
  cves: NvdCve[];
  totalResults: number;
}

const NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0";

function pickCvss(cve: Record<string, unknown>): {
  score: number | null;
  vector: string | null;
  version: string | null;
} {
  const metrics = cve.metrics as Record<string, unknown> | undefined;
  if (!metrics) return { score: null, vector: null, version: null };

  const order = ["cvssMetricV31", "cvssMetricV30", "cvssMetricV2", "cvssMetricV40"];
  for (const key of order) {
    const entries = metrics[key] as Array<Record<string, unknown>> | undefined;
    const entry = entries?.[0];
    const data = entry?.cvssData as Record<string, unknown> | undefined;
    if (data) {
      return {
        score: typeof data.baseScore === "number" ? data.baseScore : null,
        vector: typeof data.vectorString === "string" ? data.vectorString : null,
        version: typeof data.version === "string" ? data.version : null,
      };
    }
  }
  return { score: null, vector: null, version: null };
}

function pickDescription(cve: Record<string, unknown>): string | null {
  const descriptions = cve.descriptions as Array<{ lang: string; value: string }> | undefined;
  const english = descriptions?.find((d) => d.lang === "en") ?? descriptions?.[0];
  return english?.value ?? null;
}

function pickWeaknesses(cve: Record<string, unknown>): string[] {
  const weaknesses = cve.weaknesses as Array<Record<string, unknown>> | undefined;
  const out: string[] = [];
  for (const weakness of weaknesses ?? []) {
    for (const desc of (weakness.description as Array<{ value: string }>) ?? []) {
      if (desc?.value) out.push(desc.value);
    }
  }
  return out;
}

/**
 * Queries the NVD CVE 2.0 API for recently published or modified CVEs.
 * NVD data is authoritative for CVE identifiers, CVSS metrics and references.
 */
export async function fetchRecentCves(options?: {
  windowInDays?: number;
  resultsPerPage?: number;
}): Promise<NvdResult> {
  const windowInDays = options?.windowInDays ?? 7;
  const resultsPerPage = Math.min(2000, options?.resultsPerPage ?? 100);
  const publishedStart = new Date(
    Date.now() - windowInDays * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .replace(/\.\d{3}Z$/, ".000");

  const url = `${NVD_API}?pubStartDate=${encodeURIComponent(
    publishedStart,
  )}&pubEndDate=${encodeURIComponent(
    new Date().toISOString().replace(/\.\d{3}Z$/, ".000"),
  )}&resultsPerPage=${resultsPerPage}`;

  const response = await fetchWithRetry(url, {
    headers: { Accept: "application/json" },
    timeoutMs: Math.max(env().INGEST_TIMEOUT_MS, 30000),
  });

  const json = (await response.json()) as {
    totalResults?: number;
    vulnerabilities?: Array<{ cve: Record<string, unknown> }>;
  };

  const cves: NvdCve[] = [];
  for (const entry of json.vulnerabilities ?? []) {
    const cve = entry.cve ?? {};
    const id = typeof cve.id === "string" ? cve.id : null;
    if (!id) continue;
    const cvss = pickCvss(cve);
    cves.push({
      cveId: id,
      sourceIdentifier:
        typeof cve.sourceIdentifier === "string" ? cve.sourceIdentifier : null,
      published: typeof cve.published === "string" ? cve.published : null,
      lastModified: typeof cve.lastModified === "string" ? cve.lastModified : null,
      vulnStatus: typeof cve.vulnStatus === "string" ? cve.vulnStatus : null,
      description: pickDescription(cve),
      cvssScore: cvss.score,
      cvssVector: cvss.vector,
      cvssVersion: cvss.version,
      references: (
        (cve.references as Array<{ url: string }>) ?? []
      )
        .map((ref) => ref.url)
        .filter(Boolean),
      weaknesses: pickWeaknesses(cve),
      vendor: null,
      product: null,
      raw: cve,
    });
  }

  return { cves, totalResults: json.totalResults ?? cves.length };
}

export function severityOf(cve: Pick<NvdCve, "cvssScore">) {
  return severityFromCvss(cve.cvssScore);
}
