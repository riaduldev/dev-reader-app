import { NextResponse } from "next/server";

import { listArticles } from "@/lib/db/articles";
import { isConfigurationError } from "@/lib/supabase/server";
import { describeDbError, isMissingSchemaError } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** Global search across stored articles. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(20, Number(url.searchParams.get("limit") ?? 8) || 8);

  if (query.length < 2) {
    return NextResponse.json({ results: [], query });
  }

  try {
    const { items } = await listArticles({ q: query, pageSize: limit, sort: "latest" });
    return NextResponse.json({
      query,
      results: items.map((article) => ({
        id: article.id,
        title: article.title,
        url: article.url,
        category: article.category,
        published_at: article.published_at,
        importance: article.importance,
        summary: article.ai_summary_bn ?? article.description,
        source: article.sources?.name ?? null,
      })),
    });
  } catch (error) {
    const status = isConfigurationError(error)
      ? 503
      : isMissingSchemaError(error)
        ? 503
        : 500;
    return NextResponse.json(
      {
        error: isMissingSchemaError(error)
          ? describeDbError(error)
          : error instanceof Error
            ? error.message
            : "Search failed.",
      },
      { status },
    );
  }
}
