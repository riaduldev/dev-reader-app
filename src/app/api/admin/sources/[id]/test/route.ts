import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getSourceById } from "@/lib/db/sources";
import { testSource } from "@/lib/ingestion/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const result = await testSource(source);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to test source." },
      { status: 500 },
    );
  }
}
