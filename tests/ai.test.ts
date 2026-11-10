import { describe, expect, it } from "vitest";

import { aiAnalysisSchema } from "@/lib/ai/analyze";
import { scoreImportance } from "@/lib/ingestion/importance";

describe("aiAnalysisSchema", () => {
  const valid = {
    summary_bn: "React 19 প্রকাশিত হয়েছে নতুন ফিচারসহ।",
    why_it_matters: "React ব্যবহারকারী ডেভেলপারদের জন্য গুরুত্বপূর্ণ।",
    developer_impact: "ব্রেকিং চেঞ্জ মোকাবিলা লাগবে।",
    practical_action: "আপগ্রেডের আগে মাইগ্রেশন গাইড পড়ুন।",
    importance_score: 4,
    tags: ["React", "JavaScript"],
    confidence: "high",
    fact_status: "confirmed",
  };

  it("accepts a complete analysis", () => {
    const parsed = aiAnalysisSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects an out-of-range importance score", () => {
    const parsed = aiAnalysisSchema.safeParse({ ...valid, importance_score: 9 });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown fact statuses", () => {
    const parsed = aiAnalysisSchema.safeParse({ ...valid, fact_status: "maybe" });
    expect(parsed.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const incomplete = { ...valid } as Record<string, unknown>;
    delete incomplete.summary_bn;
    expect(aiAnalysisSchema.safeParse(incomplete).success).toBe(false);
  });
});

describe("scoreImportance", () => {
  it("rates security news higher than job posts", () => {
    const security = scoreImportance({
      title: "Critical vulnerability patched in OpenSSL",
      category: "security",
      sourceReliability: "official",
    });
    const jobs = scoreImportance({
      title: "Company is hiring engineers",
      category: "jobs",
      sourceReliability: "trusted",
    });
    expect(security).toBeGreaterThan(jobs);
    expect(security).toBeLessThanOrEqual(5);
    expect(jobs).toBeGreaterThanOrEqual(1);
  });

  it("never leaves the 1–5 range", () => {
    const score = scoreImportance({
      title: "launches acquires vulnerability outage deprecation open sources",
      category: "security",
      matchedTerms: ["a", "b", "c", "d"],
      sourceReliability: "official",
    });
    expect(score).toBeLessThanOrEqual(5);
    expect(score).toBeGreaterThanOrEqual(1);
  });
});
