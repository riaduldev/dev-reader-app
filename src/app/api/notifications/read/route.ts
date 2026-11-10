import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { markNotificationsRead } from "@/lib/db/user";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    await markNotificationsRead(session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update." },
      { status: 500 },
    );
  }
}
