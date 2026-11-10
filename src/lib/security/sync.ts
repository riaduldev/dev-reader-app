import { fetchKevCatalog, severityFromCvss } from "@/lib/security/cisa";
import { fetchRecentCves } from "@/lib/security/nvd";
import { upsertVulnerabilities, type VulnerabilityUpsertInput } from "@/lib/db/vulnerabilities";

export interface SecuritySyncResult {
  total: number;
  stored: number;
  kevCount: number;
  nvdCount: number;
  warnings: string[];
  durationMs: number;
}

/**
 * Refreshes the vulnerability tables.
 *
 * - CISA KEV entries are the only source that marks a CVE as exploited in the
 *   wild (`exploited = true`, `in_kev = true`).
 * - NVD provides CVE identifiers, CVSS metrics, descriptions and references.
 *
 * The two sources are merged on the CVE identifier; KEV data always wins for
 * the exploitation flags.
 */
export async function syncVulnerabilities(options?: {
  windowInDays?: number;
}): Promise<SecuritySyncResult> {
  const started = Date.now();
  const warnings: string[] = [];

  const kev = await fetchKevCatalog().catch((error) => {
    warnings.push(
      `CISA KEV catalog unavailable: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  });

  const nvd = await fetchRecentCves({ windowInDays: options?.windowInDays ?? 7 }).catch(
    (error) => {
      warnings.push(
        `NVD API unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    },
  );

  const kevById = new Map((kev?.entries ?? []).map((entry) => [entry.cveID, entry]));
  const rows: VulnerabilityUpsertInput[] = [];

  for (const cve of nvd?.cves ?? []) {
    const kevEntry = kevById.get(cve.cveId);
    rows.push({
      cve_id: cve.cveId,
      title: cve.description?.slice(0, 400) ?? null,
      description: cve.description,
      cvss_score: cve.cvssScore,
      cvss_vector: cve.cvssVector,
      severity: severityFromCvss(cve.cvssScore),
      vendor: kevEntry?.vendorProject ?? null,
      product: kevEntry?.product ?? null,
      published_at: cve.published,
      modified_at: cve.lastModified,
      exploited: Boolean(kevEntry),
      exploitation_source: kevEntry
        ? "CISA Known Exploited Vulnerabilities catalog"
        : null,
      in_kev: Boolean(kevEntry),
      kev_due_date: kevEntry?.dueDate ?? null,
      kev_ransomware_use: kevEntry?.knownRansomwareCampaignUse ?? null,
      reference_urls: cve.references,
      origin: "nvd",
      raw: cve.raw,
    });
  }

  // KEV entries that NVD has not published yet are still valuable.
  const nvdIds = new Set((nvd?.cves ?? []).map((cve) => cve.cveId));
  for (const entry of kev?.entries ?? []) {
    if (nvdIds.has(entry.cveID)) continue;
    rows.push({
      cve_id: entry.cveID,
      title: entry.vulnerabilityName,
      description: entry.shortDescription,
      cvss_score: null,
      cvss_vector: null,
      severity: "unknown",
      vendor: entry.vendorProject,
      product: entry.product,
      published_at: null,
      modified_at: entry.dateAdded,
      exploited: true,
      exploitation_source: "CISA Known Exploited Vulnerabilities catalog",
      in_kev: true,
      kev_due_date: entry.dueDate,
      kev_ransomware_use: entry.knownRansomwareCampaignUse,
      reference_urls: ["https://www.cisa.gov/known-exploited-vulnerabilities-catalog"],
      origin: "cisa_kev",
      raw: entry as unknown as Record<string, unknown>,
    });
  }

  const stored = await upsertVulnerabilities(rows);

  return {
    total: rows.length,
    stored,
    kevCount: kev?.entries.length ?? 0,
    nvdCount: nvd?.cves.length ?? 0,
    warnings,
    durationMs: Date.now() - started,
  };
}
