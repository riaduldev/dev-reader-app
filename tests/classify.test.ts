import { describe, expect, it } from "vitest";

import { classifyArticle, looksLikeJobPosting } from "@/lib/ingestion/classify";

describe("classifyArticle", () => {
  it("uses the source category when the text does not match anything else", () => {
    const result = classifyArticle({
      title: "A new release is available",
      description: "General update",
      sourceCategory: "web",
    });
    expect(result.category).toBe("web");
  });

  it("prefers explicit keyword matches over the source category", () => {
    const result = classifyArticle({
      title: "Critical CVE-2026-1234 vulnerability in Kubernetes",
      description: "A vulnerability was found in the Kubernetes API server.",
      sourceCategory: "web",
    });
    expect(result.category).toBe("security");
    expect(result.matchedTerms.length).toBeGreaterThan(0);
  });

  it("detects AI content", () => {
    const result = classifyArticle({
      title: "OpenAI ships a new LLM with agentic coding support",
      description: "The model improves ChatGPT reasoning.",
      sourceCategory: "industry",
    });
    expect(result.category).toBe("ai");
  });

  it("detects developer job postings", () => {
    const result = classifyArticle({
      title: "We are hiring a senior React engineer",
      description: "Apply now for a remote full-stack role.",
      sourceCategory: "industry",
    });
    expect(result.category).toBe("jobs");
  });

  it("falls back to industry for unmatched content", () => {
    const result = classifyArticle({
      title: "Something happened today",
      description: "No keywords here.",
    });
    expect(result.category).toBe("industry");
    expect(result.confidence).toBe("low");
  });
});

describe("looksLikeJobPosting", () => {
  it("detects hiring language", () => {
    expect(looksLikeJobPosting("We are hiring developers")).toBe(true);
    expect(looksLikeJobPosting("Now hiring: backend engineer")).toBe(true);
  });

  it("ignores regular news", () => {
    expect(looksLikeJobPosting("React 19 is released")).toBe(false);
  });
});
