import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getSchemaStatus } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** Reports which application tables exist in the database. */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const status = await getSchemaStatus();
  return NextResponse.json(status);
}
