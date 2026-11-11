import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { logAuthFailure } from "@/lib/auth/errors";
import { createServiceSupabaseClient, isConfigurationError } from "@/lib/supabase/server";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/**
 * Deletes the signed-in user's account.
 *
 * The `auth.users` row is removed through the admin API; the personal rows
 * (profile, preferences, bookmarks, reading history, notifications) are
 * removed by the `ON DELETE CASCADE` constraints.
 */
export async function DELETE() {
  const t = await getDictionaryForRequest();
  const session = await getSession();

  if (!session.configured) {
    return NextResponse.json(
      { error: t.authErrors.notConfigured },
      { status: 503 },
    );
  }

  if (!session.user) {
    return NextResponse.json({ error: t.authErrors.invalidCredentials }, { status: 401 });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.auth.admin.deleteUser(session.user.id);
    if (error) {
      logAuthFailure("DELETE /api/account failed", error);
      return NextResponse.json(
        { error: t.errors.generic },
        { status: 500 },
      );
    }
  } catch (error) {
    logAuthFailure("DELETE /api/account threw", error);
    return NextResponse.json(
      { error: t.errors.generic },
      { status: isConfigurationError(error) ? 503 : 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
