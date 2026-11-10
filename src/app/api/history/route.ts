import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { recordReading } from "@/lib/db/user";
import { isConfigurationError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Records that the signed-in user opened an article. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
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
    await recordReading(session.user.id, articleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record history." },
      { status: isConfigurationError(error) ? 503 : 500 },
    );
  }
}
