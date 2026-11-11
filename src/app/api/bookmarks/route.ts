import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { isConfigurationError } from "@/lib/supabase/server";
import { getDictionaryForRequest } from "@/lib/i18n/server";
import { toggleBookmark } from "@/lib/db/user";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const t = await getDictionaryForRequest();
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json(
      { error: t.empty.signInRequiredTitle },
      { status: 401 },
    );
  }

  let articleId: string | null = null;
  try {
    const body = (await request.json()) as { articleId?: string };
    articleId = body.articleId ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!articleId) {
    return NextResponse.json({ error: "articleId is required." }, { status: 400 });
  }

  try {
    const result = await toggleBookmark(session.user.id, articleId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update bookmark." },
      { status: isConfigurationError(error) ? 503 : 500 },
    );
  }
}
