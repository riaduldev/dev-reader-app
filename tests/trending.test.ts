import { describe, expect, it } from "vitest";

import { computeTrendingScore, scoreAndSort } from "@/lib/github/trending";

const now = new Date("2026-01-10T00:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("computeTrendingScore", () => {
  it("returns a higher score for more stars", () => {
    const small = computeTrendingScore(
      {
        stars: 10,
        forks: 1,
        created_at: daysAgo(30),
        updated_at: daysAgo(1),
        pushed_at: daysAgo(1),
        topics: [],
      },
      { now },
    );
    const large = computeTrendingScore(
      {
        stars: 5000,
        forks: 500,
        created_at: daysAgo(30),
        updated_at: daysAgo(1),
        pushed_at: daysAgo(1),
        topics: [],
      },
      { now },
    );
    expect(large.score).toBeGreaterThan(small.score);
  });

  it("decays with age", () => {
    const fresh = computeTrendingScore(
      {
        stars: 100,
        forks: 10,
        created_at: daysAgo(10),
        updated_at: daysAgo(0),
        pushed_at: daysAgo(0),
        topics: [],
      },
      { now },
    );
    const stale = computeTrendingScore(
      {
        stars: 100,
        forks: 10,
        created_at: daysAgo(200),
        updated_at: daysAgo(120),
        pushed_at: daysAgo(120),
        topics: [],
      },
      { now },
    );
    expect(fresh.score).toBeGreaterThan(stale.score);
    expect(stale.components.recencyScore).toBeLessThan(
      fresh.components.recencyScore,
    );
  });

  it("rewards matching requested topics", () => {
    const repo = {
      stars: 100,
      forks: 10,
      created_at: daysAgo(10),
      updated_at: daysAgo(1),
      pushed_at: daysAgo(1),
      topics: ["react", "nextjs"],
    };
    const matched = computeTrendingScore(repo, { requestedTopics: ["react"], now });
    const unmatched = computeTrendingScore(repo, {
      requestedTopics: ["kubernetes"],
      now,
    });
    expect(matched.components.topicScore).toBe(1);
    expect(unmatched.components.topicScore).toBe(0);
    expect(matched.score).toBeGreaterThan(unmatched.score);
  });

  it("is deterministic", () => {
    const repo = {
      stars: 42,
      forks: 4,
      created_at: daysAgo(5),
      updated_at: daysAgo(1),
      pushed_at: daysAgo(1),
      topics: [],
    };
    expect(computeTrendingScore(repo, { now }).score).toBe(
      computeTrendingScore(repo, { now }).score,
    );
  });
});

describe("scoreAndSort", () => {
  it("sorts by descending score", () => {
    const repos = [
      {
        name: "small",
        stars: 5,
        forks: 1,
        created_at: daysAgo(90),
        updated_at: daysAgo(80),
        pushed_at: daysAgo(80),
        topics: [],
      },
      {
        name: "big",
        stars: 9000,
        forks: 900,
        created_at: daysAgo(90),
        updated_at: daysAgo(1),
        pushed_at: daysAgo(1),
        topics: [],
      },
    ];
    const sorted = scoreAndSort(repos, { now });
    expect(sorted[0].name).toBe("big");
    expect(sorted[0].score).toBeGreaterThan(sorted[1].score);
  });
});
