import { CATEGORIES, type CategoryId } from "@/lib/categories";

export interface ClassificationResult {
  category: CategoryId;
  matchedTerms: string[];
  confidence: "high" | "medium" | "low";
}

export interface ClassifyInput {
  title: string;
  description?: string | null;
  sourceCategory?: string | null;
}

function countMatches(haystack: string, terms: string[]): string[] {
  return terms.filter((term) => haystack.includes(term));
}

/**
 * Terms that are unambiguous on their own. A single hit on one of these terms
 * is enough to move an article to that category, even when the source belongs
 * to a different category.
 */
const STRONG_TERMS = [
  "cve-",
  "cisa",
  "nvd",
  "vulnerabilit",
  "exploited",
  "ransomware",
  "breach",
  "owasp",
  "hiring",
  "job opening",
  "job opening",
  "remote job",
  "we are hiring",
  "apply now",
  "openai",
  "chatgpt",
  "anthropic",
  "claude",
  "gemini",
  "llm",
  "kubernetes",
  "docker",
  "terraform",
  "next.js",
  "node.js",
  "typescript",
  "javascript",
  "tailwind",
  "svelte",
  "vue",
  "angular",
];

/**
 * Assigns an article to a category.
 *
 * Rules (documented in docs/ingestion.md):
 *  1. The source's declared category wins unless the text clearly matches a
 *     different category with at least two distinct keyword hits (or a single
 *     unambiguous "strong" keyword such as `CVE-` or `hiring`).
 *  2. Otherwise the category with the most keyword hits wins.
 *  3. Ties are broken by the fixed category order in `CATEGORIES`.
 *  4. With no hits at all the article falls back to the source category, or to
 *     "industry" (general tech) when the source has no category either.
 */
export function classifyArticle(input: ClassifyInput): ClassificationResult {
  const haystack = `${input.title} ${input.description ?? ""}`.toLowerCase();

  const scores = CATEGORIES.map((category) => ({
    category: category.id,
    terms: countMatches(haystack, category.terms),
  }));

  const sourceCategory = input.sourceCategory as CategoryId | undefined;
  const sourceEntry = scores.find((entry) => entry.category === sourceCategory);
  const sourceHits = sourceEntry?.terms.length ?? 0;

  let best = scores[0];
  let bestHits = best.terms.length;
  for (const entry of scores) {
    if (entry.terms.length > bestHits) {
      best = entry;
      bestHits = entry.terms.length;
    }
  }

  const bestIsStrong = best.terms.some((term) => STRONG_TERMS.includes(term));

  if (sourceCategory && sourceHits >= 2 && bestHits <= sourceHits) {
    return {
      category: sourceCategory,
      matchedTerms: sourceEntry?.terms ?? [],
      confidence: sourceHits >= 3 ? "high" : "medium",
    };
  }

  if (bestHits >= 2) {
    const runnerUp = scores
      .filter((entry) => entry.category !== best.category)
      .reduce((max, entry) => Math.max(max, entry.terms.length), 0);

    const confidence =
      bestHits >= 3 && bestHits > runnerUp
        ? "high"
        : bestHits >= 2
          ? "medium"
          : "low";

    return { category: best.category, matchedTerms: best.terms, confidence };
  }

  if (bestHits === 1 && bestIsStrong) {
    return { category: best.category, matchedTerms: best.terms, confidence: "medium" };
  }

  if (sourceCategory) {
    return {
      category: sourceCategory,
      matchedTerms: sourceEntry?.terms ?? [],
      confidence: "low",
    };
  }

  return { category: "industry", matchedTerms: [], confidence: "low" };
}

/** Job postings are filtered for the developer-jobs category. */
export function looksLikeJobPosting(title: string, description?: string | null): boolean {
  const haystack = `${title} ${description ?? ""}`.toLowerCase();
  const jobTerms = [
    "hiring",
    "we are hiring",
    "job opening",
    "apply now",
    "remote job",
    "position available",
    "join our team",
    "career opportunity",
    "now hiring",
  ];
  return jobTerms.some((term) => haystack.includes(term));
}
