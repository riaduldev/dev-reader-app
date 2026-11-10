import { describe, expect, it } from "vitest";

import {
  canonicalizeUrl,
  countWords,
  hashUrl,
  normalizeItem,
  stripHtml,
} from "@/lib/ingestion/normalize";

describe("canonicalizeUrl", () => {
  it("forces https, removes www and trailing slashes", () => {
    expect(canonicalizeUrl("http://www.example.com/post/")).toBe(
      "https://example.com/post",
    );
  });

  it("removes tracking parameters but keeps meaningful ones", () => {
    const result = canonicalizeUrl(
      "https://example.com/a?utm_source=rss&id=42&fbclid=abc",
    );
    expect(result).toContain("id=42");
    expect(result).not.toContain("utm_source");
    expect(result).not.toContain("fbclid");
  });

  it("drops the fragment", () => {
    expect(canonicalizeUrl("https://example.com/a#section")).toBe(
      "https://example.com/a",
    );
  });
});

describe("hashUrl", () => {
  it("is stable and differs per URL", () => {
    const a = hashUrl("https://example.com/a");
    const b = hashUrl("https://example.com/b");
    expect(a).toBe(hashUrl("https://example.com/a"));
    expect(a).not.toBe(b);
    expect(a.length).toBe(64);
  });
});

describe("stripHtml", () => {
  it("removes tags and decodes entities", () => {
    expect(stripHtml("<p>Hello &amp; <b>world</b></p>")).toBe("Hello & world");
  });

  it("returns null for empty content", () => {
    expect(stripHtml("   ")).toBeNull();
    expect(stripHtml(null)).toBeNull();
  });
});

describe("countWords", () => {
  it("counts whitespace separated words", () => {
    expect(countWords("one two three")).toBe(3);
    expect(countWords("")).toBeNull();
  });
});

describe("normalizeItem", () => {
  const base = {
    title: "React 19 released with new features",
    url: "https://react.dev/blog/react-19",
    publishedAt: "2026-01-05T10:00:00.000Z",
    category: "web",
  };

  it("normalizes a valid item", () => {
    const item = normalizeItem({ ...base, description: "<p>Details</p>" });
    expect(item).not.toBeNull();
    expect(item?.description).toBe("Details");
    expect(item?.canonicalUrl).toBe("https://react.dev/blog/react-19");
    expect(item?.wordCount).toBe(1);
  });

  it("rejects items without a publication date", () => {
    const item = normalizeItem({ ...base, publishedAt: null });
    expect(item).toBeNull();
  });

  it("rejects items with an invalid date", () => {
    const item = normalizeItem({ ...base, publishedAt: "not-a-date" });
    expect(item).toBeNull();
  });

  it("rejects items without a title", () => {
    const item = normalizeItem({ ...base, title: null });
    expect(item).toBeNull();
  });

  it("rejects non-http protocols", () => {
    const item = normalizeItem({ ...base, url: "ftp://example.com/file" });
    expect(item).toBeNull();
  });
});
