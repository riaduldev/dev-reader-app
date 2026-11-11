import { type CategoryId } from "@/lib/categories";
import type { Dictionary } from "@/lib/i18n/types";

export interface ImportanceInput {
  title: string;
  description?: string | null;
  category: string;
  sourceReliability?: string | null;
  matchedTerms?: string[];
}

/**
 * Deterministic pre-analysis importance (1–5).
 *
 * It runs during ingestion so the AI step only has to analyse articles that
 * look worth analysing (cost control). After the AI analysis completes, the
 * stored `importance` value is replaced by the model's own score.
 */
export function scoreImportance(input: ImportanceInput): number {
  const text = `${input.title} ${input.description ?? ""}`.toLowerCase();

  const categoryBase: Record<CategoryId, number> = {
    security: 3,
    ai: 3,
    industry: 2,
    web: 2,
    cloud: 2,
    opensource: 2,
    jobs: 1,
  };
  const category = (input.category in categoryBase
    ? input.category
    : "industry") as CategoryId;
  let score = categoryBase[category];

  const highImpactTerms = [
    "launches",
    "launched",
    "acquires",
    "acquisition",
    "vulnerability",
    "cve-",
    "zero-day",
    "ransomware",
    "breach",
    "deprecated",
    "deprecation",
    "breaking change",
    "general availability",
    "ga release",
    "open sources",
    "open-sources",
    "shuts down",
    "shutdown",
    "outage",
    "postmortem",
    "critical",
    "announces",
    "unveils",
    "major update",
  ];
  for (const term of highImpactTerms) {
    if (text.includes(term)) {
      score += 1;
      break;
    }
  }

  if ((input.matchedTerms?.length ?? 0) >= 3) {
    score += 0.5;
  }
  if (input.sourceReliability === "official") {
    score += 0.5;
  }

  return Math.min(5, Math.max(1, Math.round(score)));
}

/** Localised importance label. */
export function importanceLabel(
  score: number | null | undefined,
  t: Dictionary,
): string {
  if (!score) return t.common.empty;
  const labels = t.article.importanceLabels as Record<string, string>;
  return labels[String(score)] ?? t.common.empty;
}

