import { describe, expect, it } from "vitest";

import { fetchKevCatalog } from "@/lib/security/cisa";
import { fetchRecentCves } from "@/lib/security/nvd";
import { searchRepositories } from "@/lib/github/client";

/**
 * Live-network check of the external integrations (skipped unless
 * `LIVE_FEEDS=1` is set):
 *
 *   LIVE_FEEDS=1 npm test
 */
const live = process.env.LIVE_FEEDS === "1";

describe.skipIf(!live)("live integrations", () => {
  it("downloads the CISA KEV catalog", async () => {
    const kev = await fetchKevCatalog();
    expect(kev.entries.length).toBeGreaterThan(0);
    expect(kev.entries[0].cveID).toMatch(/^CVE-/);
    expect(kev.entries[0].dueDate).toBeTruthy();
  });

  it("downloads recent CVEs from the NVD API", async () => {
    const nvd = await fetchRecentCves({ windowInDays: 7, resultsPerPage: 5 });
    expect(nvd.cves.length).toBeGreaterThan(0);
    expect(nvd.cves[0].cveId).toMatch(/^CVE-/);
  });

  it("searches GitHub repositories", async () => {
    const result = await searchRepositories({
      query: "stars:>100 created:>=2026-01-01",
      perPage: 3,
      page: 1,
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].full_name).toContain("/");
    expect(result.items[0].html_url).toMatch(/^https:\/\/github\.com\//);
  });
});
