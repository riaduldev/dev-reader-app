import Parser, { type Item } from "rss-parser";

import { env } from "@/lib/env";
import { fetchWithRetry } from "@/lib/ingestion/http";
import { classifyArticle } from "@/lib/ingestion/classify";
import { normalizeItem, type NormalizedItem } from "@/lib/ingestion/normalize";

const parser = new Parser({
  timeout: env().INGEST_TIMEOUT_MS,
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["dc:creator", "dcCreator"],
      ["summary", "summary"],
    ],
  },
});

export interface RawFeedItem {
  title: string | null;
  url: string | null;
  description: string | null;
  content: string | null;
  author: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
}

export interface FeedParseResult {
  items: RawFeedItem[];
  feedTitle: string | null;
  warnings: string[];
}

type FeedItem = Item & {
  mediaContent?: { $?: { url?: string }; url?: string };
  mediaThumbnail?: { url?: string };
  dcCreator?: string;
  summary?: string;
  date?: string;
  author?: string;
  links?: Array<{ rel?: string; href?: string }>;
};

function firstLink(item: FeedItem): string | null {
  if (typeof item.link === "string") return item.link;
  if (Array.isArray(item.link)) {
    const links = item.link as Array<Record<string, unknown>>;
    const alternate = links.find(
      (entry) => entry?.rel === "alternate" || entry?.rel === undefined,
    );
    if (alternate && typeof alternate.href === "string") return alternate.href;
  }
  if (Array.isArray(item.links)) {
    const alternate = item.links.find((entry) => entry?.rel === "alternate");
    if (alternate && typeof alternate.href === "string") return alternate.href;
    const first = item.links[0];
    if (first && typeof first.href === "string") return first.href;
  }
  if (typeof item.guid === "string" && /^https?:\/\//i.test(item.guid)) return item.guid;
  return null;
}

function imageFrom(item: FeedItem): string | null {
  const media = item.mediaContent;
  if (media?.$?.url) return media.$.url;
  if (media?.url) return media.url;
  if (item.mediaThumbnail?.url) return item.mediaThumbnail.url;
  const enclosure = item.enclosure;
  if (enclosure?.url && String(enclosure.type ?? "").startsWith("image/")) {
    return enclosure.url;
  }
  return null;
}

function publishedFrom(item: FeedItem): string | null {
  const candidates = [item.isoDate, item.pubDate, item.date];
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const parsed = new Date(candidate);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }
  return null;
}

/** Parses an RSS or Atom document into raw items. */
export async function parseFeedDocument(xml: string): Promise<FeedParseResult> {
  let parsed: { title?: string; items?: Item[] };
  try {
    parsed = (await parser.parseString(xml)) as { title?: string; items?: Item[] };
  } catch (error) {
    throw new Error(
      `Malformed feed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const feedTitle = typeof parsed.title === "string" ? parsed.title : null;
  const warnings: string[] = [];
  const items: RawFeedItem[] = [];

  for (const entry of parsed.items ?? []) {
    const item = entry as FeedItem;
    const url = firstLink(item);
    const title = typeof item.title === "string" ? item.title : null;
    if (!title || !url) {
      warnings.push("Item skipped: missing title or link.");
      continue;
    }
    items.push({
      title,
      url,
      description:
        (typeof item.contentSnippet === "string" ? item.contentSnippet : null) ??
        (typeof item.summary === "string" ? item.summary : null) ??
        (typeof item.content === "string" ? item.content : null) ??
        null,
      content: typeof item.content === "string" ? item.content : null,
      author:
        (typeof item.creator === "string" ? item.creator : null) ??
        (typeof item.dcCreator === "string" ? item.dcCreator : null) ??
        (typeof item.author === "string" ? item.author : null) ??
        null,
      imageUrl: imageFrom(item),
      publishedAt: publishedFrom(item),
    });
  }

  return { items, feedTitle, warnings };
}

/** Downloads and parses a feed. */
export async function fetchFeedItems(url: string): Promise<FeedParseResult> {
  const response = await fetchWithRetry(url, {
    accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
  });
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`Feed returned an empty body: ${url}`);
  }
  return parseFeedDocument(body);
}
/**
 * Converts raw feed items into validated, classified and normalized items.
 * Items without a usable publication date are dropped (the lookback window
 * cannot be applied to them) and counted as skipped.
 */
export function buildNormalizedItems(
  rawItems: RawFeedItem[],
  sourceCategory: string,
): { items: NormalizedItem[]; skipped: number } {
  const items: NormalizedItem[] = [];
  let skipped = 0;

  for (const raw of rawItems) {
    const classification = classifyArticle({
      title: raw.title ?? "",
      description: raw.description,
      sourceCategory,
    });

    const normalized = normalizeItem({
      title: raw.title,
      url: raw.url,
      description: raw.description,
      content: raw.content,
      author: raw.author,
      imageUrl: raw.imageUrl,
      publishedAt: raw.publishedAt,
      category: classification.category,
      matchedTerms: classification.matchedTerms,
    });

    if (!normalized) {
      skipped += 1;
      continue;
    }
    items.push(normalized);
  }

  return { items, skipped };
}
