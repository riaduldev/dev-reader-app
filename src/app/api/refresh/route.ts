import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { isConfigurationError } from "@/lib/supabase/server";
import { runIngestion } from "@/lib/ingestion/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Manual refresh triggered from the top bar. Requires an authenticated
 * session; the ingestion engine deduplicates by URL so repeated calls are safe.
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session.configured) {
    return NextResponse.json(
      { error: "Supabase is not configured on this deployment." },
      { status: 503 },
    );
  }

  if (!session.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let lookbackHours: number | undefined;
  try {
    const body = (await request.json()) as { lookbackHours?: number };
    if (typeof body.lookbackHours === "number") {
      lookbackHours = Math.min(720, Math.max(1, Math.round(body.lookbackHours)));
    }
  } catch {
    // Ignore empty body.
  }

  try {
    const summary = await runIngestion({
      trigger: "manual",
      lookbackHours,
      runAi: false,
      runSecurity: false,
      runGithub: false,
    });
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refresh failed." },
      { status: isConfigurationError(error) ? 503 : 500 },
    );
  }
}
