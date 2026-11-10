import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/user";
import type { DatabaseUserProfile } from "@/lib/db/types";

export interface SessionUser {
  id: string;
  email: string | null;
  profile: DatabaseUserProfile | null;
}

export interface SessionState {
  configured: boolean;
  user: SessionUser | null;
}

/** Returns the signed-in user (if Supabase is configured and a session exists). */
export async function getSession(): Promise<SessionState> {
  if (!isSupabaseConfigured()) {
    return { configured: false, user: null };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { configured: true, user: null };
    }

    let profile: DatabaseUserProfile | null = null;
    try {
      profile = await getProfile(user.id);
    } catch {
      profile = null;
    }

    return {
      configured: true,
      user: { id: user.id, email: user.email ?? null, profile },
    };
  } catch {
    return { configured: true, user: null };
  }
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.user?.profile?.role === "admin";
}
