import OpenAI from "openai";
import { z } from "zod";

import { env, isConfigured } from "@/lib/env";
import { CATEGORY_MAP, type CategoryId } from "@/lib/categories";

/**
 * The strict contract every AI analysis must satisfy.
 * It mirrors the JSON shape requested from the OpenAI API.
 */
export const aiAnalysisSchema = z.object({
  summary_bn: z.string().min(10),
  why_it_matters: z.string().min(5),
  developer_impact: z.string().min(5),
  practical_action: z.string().min(5),
  importance_score: z.number().int().min(1).max(5),
  tags: z.array(z.string()).max(12),
  confidence: z.enum(["low", "medium", "high"]),
  fact_status: z.enum(["confirmed", "reported", "unverified"]),
});

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;

export interface AnalyzeInput {
  title: string;
  description?: string | null;
  content?: string | null;
  category: string;
  sourceName: string;
  sourceReliability?: string | null;
  publishedAt: string;
  url: string;
}

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

const SYSTEM_PROMPT = `You are DevPulse, an editor that analyses developer technology news for a Bangla-speaking audience.

Rules:
- Write every prose field in natural Bangla (বাংলা) while keeping technical terms (React, Next.js, TypeScript, LLM, CVE, Kubernetes, API …) in English.
- Never invent facts, CVE identifiers, version numbers, quotes or links. Use only what the provided article states.
- "summary_bn": 1–2 short sentences describing what happened.
- "why_it_matters": why a developer should care.
- "developer_impact": concrete impact on developers (skills, tooling, breaking changes).
- "practical_action": one actionable suggestion (what to learn, test or migrate).
- "importance_score": 1 (trivial) to 5 (must-know for every developer).
- "tags": up to 12 short technical tags, English.
- "confidence": your confidence in the summary, based only on the provided text.
- "fact_status": "confirmed" when the source itself states the facts, "reported" when the article reports a claim from another party, "unverified" when the article is speculative or unconfirmed.`;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!isConfigured("openai")) {
    throw new AiError(
      "OpenAI is not configured. Set OPENAI_API_KEY to enable AI analysis.",
    );
  }
  if (!client) {
    const e = env();
    client = new OpenAI({
      apiKey: e.OPENAI_API_KEY,
      ...(e.OPENAI_BASE_URL ? { baseURL: e.OPENAI_BASE_URL } : {}),
    });
  }
  return client;
}

function buildUserPrompt(input: AnalyzeInput): string {
  const categoryLabel = CATEGORY_MAP[input.category as CategoryId]?.labelEn ?? input.category;
  const body = (input.description ?? input.content ?? "").slice(0, 6000);

  return [
    `Category: ${categoryLabel}`,
    `Source: ${input.sourceName} (reliability: ${input.sourceReliability ?? "unknown"})`,
    `Published: ${input.publishedAt}`,
    `URL: ${input.url}`,
    `Title: ${input.title}`,
    "",
    "Article text:",
    body || "(no description available)",
  ].join("\n");
}

/**
 * Analyses a single article. Returns `null` when the model output does not
 * satisfy the schema — the article is left unprocessed and retried later
 * rather than storing a fabricated analysis.
 */
export async function analyzeArticle(input: AnalyzeInput): Promise<AiAnalysis | null> {
  const openai = getClient();
  const e = env();

  const completion = await openai.chat.completions.create({
    model: e.OPENAI_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "devpulse_article_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary_bn: { type: "string" },
            why_it_matters: { type: "string" },
            developer_impact: { type: "string" },
            practical_action: { type: "string" },
            importance_score: { type: "integer", minimum: 1, maximum: 5 },
            tags: { type: "array", items: { type: "string" } },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            fact_status: { type: "string", enum: ["confirmed", "reported", "unverified"] },
          },
          required: [
            "summary_bn",
            "why_it_matters",
            "developer_impact",
            "practical_action",
            "importance_score",
            "tags",
            "confidence",
            "fact_status",
          ],
        },
      },
    },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new AiError("The model returned an empty response.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new AiError("The model returned invalid JSON.");
  }

  const parsed = aiAnalysisSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new AiError(
      `The model response did not match the analysis schema: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")} ${issue.message}`)
        .join("; ")}`,
    );
  }

  return parsed.data;
}
