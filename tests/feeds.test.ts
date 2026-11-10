import { describe, expect, it } from "vitest";

import { buildNormalizedItems, parseFeedDocument } from "@/lib/ingestion/feeds";

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <link>https://example.com</link>
    <description>An example</description>
    <item>
      <title>Critical CVE-2026-9999 affects Kubernetes</title>
      <link>https://example.com/security/cve-2026-9999?utm_source=rss</link>
      <pubDate>Mon, 05 Jan 2026 10:00:00 GMT</pubDate>
      <description><![CDATA[<p>A vulnerability in the Kubernetes API server.</p>]]></description>
      <author>editor@example.com</author>
    </item>
    <item>
      <title>Item without a date</title>
      <link>https://example.com/no-date</link>
    </item>
  </channel>
</rss>`;

describe("parseFeedDocument", () => {
  it("parses RSS items", async () => {
    const result = await parseFeedDocument(RSS);
    expect(result.feedTitle).toBe("Example Feed");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toContain("CVE-2026-9999");
    expect(result.items[0].publishedAt).toBe("2026-01-05T10:00:00.000Z");
  });

  it("throws a descriptive error for malformed feeds", async () => {
    await expect(parseFeedDocument("<not-a-feed")).rejects.toThrow(
      /Malformed feed/i,
    );
  });
});

describe("buildNormalizedItems", () => {
  it("classifies, normalizes and skips unusable items", async () => {
    const parsed = await parseFeedDocument(RSS);
    const { items, skipped } = buildNormalizedItems(parsed.items, "industry");
    expect(items).toHaveLength(1);
    expect(skipped).toBe(1);
    expect(items[0].category).toBe("security");
    expect(items[0].url).toBe("https://example.com/security/cve-2026-9999");
  });
});
