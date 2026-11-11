import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const ALLOWED_FILES = new Set(["0001_init.sql", "0002_auth_onboarding.sql"]);

/**
 * Returns the content of a migration file so the admin UI can offer a
 * copy-to-clipboard button. Only the two known migration files are served.
 */
export async function GET(request: Request) {
  const t = await getDictionaryForRequest();
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const name = new URL(request.url).searchParams.get("file") ?? "0001_init.sql";
  if (!ALLOWED_FILES.has(name)) {
    return NextResponse.json(
      { error: t.errors.generic },
      { status: 400 },
    );
  }

  try {
    const filePath = path.join(process.cwd(), "supabase", "migrations", name);
    const sql = await readFile(filePath, "utf8");
    return NextResponse.json({ file: name, sql });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : t.errors.generic,
      },
      { status: 404 },
    );
  }
}
