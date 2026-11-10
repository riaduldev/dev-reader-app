import { NextResponse } from "next/server";

import { env, isConfigured } from "@/lib/env";
import { runIngestion } from "@/lib/ingestion/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized: a valid CRON_SECRET bearer token is required." },
    { status: 401 },
  );
}

/**
 * Scheduled ingestion endpoint (Vercel Cron).
 *
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when the
 * environment variable is set. Manual calls must send the same header.
 */
export async function POST(request: Request) {
  const secret = env().CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token !== secret) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const lookbackParam = url.searchParams.get("lookbackHours");
  const lookbackHours = lookbackParam ? Number(lookbackParam) : undefined;

  try {
    const summary = await runIngestion({
      trigger: "cron",
      lookbackHours: Number.isFinite(lookbackHours) ? lookbackHours : undefined,
      runAi: isConfigured("openai"),
      runSecurity: true,
      runGithub: true,
    });

    return NextResponse.json(summary, { status: summary.status === "failed" ? 500 : 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Ingestion failed.",
      },
      { status: 500 },
    );
  }
}
