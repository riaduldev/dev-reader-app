import { beforeAll, describe, expect, it } from "vitest";

import { analyzeArticle } from "@/lib/ai/analyze";

/**
 * Live OpenAI check (skipped unless `LIVE_AI=1` is set):
 *
 *   LIVE_AI=1 npm test
 *
 * The local `.env.local` is loaded into the process environment so the real
 * key is used — nothing is ever written to the repository.
 */
const live = process.env.LIVE_AI === "1";

if (live) {
  beforeAll(() => {
    try {
      process.loadEnvFile(".env.local");
    } catch {
      // No local env file — the test will fail with a clear configuration error.
    }
  });
}

describe.skipIf(!live)("live OpenAI analysis", () => {
  it("returns a schema-valid Bangla analysis", async () => {
    const analysis = await analyzeArticle({
      title: "React 19 adds new server component features",
      description:
        "The React team announced React 19 with improved server components, a new form actions API and faster hydration.",
      category: "web",
      sourceName: "React Blog",
      sourceReliability: "official",
      publishedAt: new Date().toISOString(),
      url: "https://react.dev/blog/react-19",
    });

    expect(analysis).not.toBeNull();
    expect(analysis?.summary_bn.length).toBeGreaterThan(5);
    expect(analysis?.importance_score).toBeGreaterThanOrEqual(1);
    expect(analysis?.importance_score).toBeLessThanOrEqual(5);
    expect(["confirmed", "reported", "unverified"]).toContain(analysis?.fact_status);
    expect(["low", "medium", "high"]).toContain(analysis?.confidence);
    expect(Array.isArray(analysis?.tags)).toBe(true);
  }, 60_000);
});
