import { describe, expect, it } from "vitest";

import { buildNormalizedItems, fetchFeedItems } from "@/lib/ingestion/feeds";

/**
 * Live-network check of the collection pipeline.
 *
 * It is skipped unless `LIVE_FEEDS=1` is set, so the default test run stays
 * offline and deterministic:
 *
 *   LIVE_FEEDS=1 npm test
 */
const live = process.env.LIVE_FEEDS === "1";

const FEEDS = [
  { url: "https://nextjs.org/feed.xml", category: "web" },
  { url: "https://github.blog/feed/", category: "opensource" },
  { url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", category: "security" },
  { url: "https://vercel.com/atom", category: "web" },
];

describe.skipIf(!live)("live feed collection", () => {
  for (const feed of FEEDS) {
    it(`collects items from ${feed.url}`, async () => {
      const parsed = await fetchFeedItems(feed.url);
      expect(parsed.items.length).toBeGreaterThan(0);

      const { items, skipped } = buildNormalizedItems(parsed.items, feed.category);
      expect(items.length).toBeGreaterThan(0);
      // Every stored item must carry a valid publication date.
      expect(items.every((item) => !Number.isNaN(item.publishedAt.getTime()))).toBe(true);
      console.log(
        `${feed.url}: ${parsed.items.length} items, ${items.length} normalised, ${skipped} skipped`,
      );
    });
  }
});
