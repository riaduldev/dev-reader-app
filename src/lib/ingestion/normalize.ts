import { createHash } from "node:crypto";

import { z } from "zod";

/** Normalized representation of a collected item, independent of feed type. */
export const normalizedItemSchema = z.object({
  title: z.string().min(3),
  url: z.string().url(),
  canonicalUrl: z.string().url(),
  urlHash: z.string().min(8),
  description: z.string().nullable(),
  content: z.string().nullable(),
  author: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  publishedAt: z.date(),
  category: z.string(),
  matchedTerms: z.array(z.string()).default([]),
  wordCount: z.number().int().nonnegative().nullable(),
});

export type NormalizedItem = z.infer<typeof normalizedItemSchema>;

/** Strips HTML tags and collapses whitespace. */
export function stripHtml(value: string | null | undefined): string | null {
  if (!value) return null;
  const withoutTags = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  return withoutTags.length > 0 ? withoutTags : null;
}

const TRACKING_PARAMS = [
  /^utm_/i,
  /^ref$/i,
  /^ref_src$/i,
  /^source$/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^mc_cid$/i,
  /^mc_eid$/i,
  /^_hsenc$/i,
  /^_hsmi$/i,
  /^icid$/i,
  /^cmpid$/i,
  /^spm$/i,
];

/**
 * Canonicalizes a URL so the same article shared by several feeds is only
 * stored once: https, no tracking parameters, no fragment, no trailing slash.
 */
export function canonicalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    url.hash = "";
    url.protocol = "https:";
    url.hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    for (const key of Array.from(url.searchParams.keys())) {
      if (TRACKING_PARAMS.some((pattern) => pattern.test(key))) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    let result = url.toString();
    if (result.endsWith("/") && url.pathname !== "/") {
      result = result.slice(0, -1);
    }
    return result;
  } catch {
    return rawUrl.trim();
  }
}

export function hashUrl(canonicalUrl: string): string {
  return createHash("sha256").update(canonicalUrl).digest("hex");
}

export function countWords(text: string | null | undefined): number | null {
  if (!text) return null;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length > 0 ? words.length : null;
}

/**
 * Validates and normalizes a raw feed item.
 * Returns `null` when the item cannot be trusted (missing title/url/date).
 */
export function normalizeItem(input: {
  title?: string | null;
  url?: string | null;
  link?: string | null;
  description?: string | null;
  content?: string | null;
  author?: string | null;
  imageUrl?: string | null;
  publishedAt?: string | Date | null;
  category: string;
  matchedTerms?: string[];
}): NormalizedItem | null {
  const title = stripHtml(input.title ?? "");
  const rawUrl = input.url ?? input.link ?? null;

  if (!title || title.length < 3 || !rawUrl) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return null;
  }

  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return null;

  const canonicalUrl = canonicalizeUrl(rawUrl);
  const description = stripHtml(input.description);
  const content = stripHtml(input.content);

  const parsed = normalizedItemSchema.safeParse({
    title,
    url: canonicalUrl,
    canonicalUrl,
    urlHash: hashUrl(canonicalUrl),
    description,
    content: content && content !== description ? content : null,
    author: stripHtml(input.author),
    imageUrl: input.imageUrl ?? null,
    publishedAt,
    category: input.category,
    matchedTerms: input.matchedTerms ?? [],
    wordCount: countWords(description ?? content),
  });

  return parsed.success ? parsed.data : null;
}
