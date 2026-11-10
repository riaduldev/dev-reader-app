import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";

export type AdminGuard =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/** Guards admin-only route handlers. */
export async function requireAdmin(): Promise<AdminGuard> {
  const session = await getSession();

  if (!session.configured) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Supabase is not configured on this deployment." },
        { status: 503 },
      ),
    };
  }

  if (!session.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }

  if (session.user.profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin privileges are required for this action." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, userId: session.user.id };
}
