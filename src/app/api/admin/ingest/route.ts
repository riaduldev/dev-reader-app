import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { runIngestion } from "@/lib/ingestion/engine";
import { isConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Runs a full ingestion cycle from the admin UI. */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let lookbackHours: number | undefined;
  try {
    const body = (await request.json()) as { lookbackHours?: number };
    if (typeof body.lookbackHours === "number") {
      lookbackHours = Math.min(720, Math.max(1, Math.round(body.lookbackHours)));
    }
  } catch {
    // Empty body is fine — the default lookback window is used.
  }

  try {
    const summary = await runIngestion({
      trigger: "admin",
      lookbackHours,
      runAi: isConfigured("openai"),
      runSecurity: true,
      runGithub: true,
    });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion failed." },
      { status: 500 },
    );
  }
}
