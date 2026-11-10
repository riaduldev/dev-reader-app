import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getSourceById } from "@/lib/db/sources";
import { runIngestion } from "@/lib/ingestion/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Manually synchronises a single source. */
export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;

  try {
    const source = await getSourceById(id);
    if (!source) {
      return NextResponse.json({ error: "Source not found." }, { status: 404 });
    }

    const summary = await runIngestion({
      trigger: "admin",
      sourceIds: [source.id],
      runAi: false,
      runSecurity: false,
      runGithub: false,
    });

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync source." },
      { status: 500 },
    );
  }
}
