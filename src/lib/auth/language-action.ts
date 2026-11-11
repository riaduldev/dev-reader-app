"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { logAuthFailure } from "@/lib/auth/errors";
import { updatePreferences } from "@/lib/db/user";
import { isLanguage, LANGUAGE_COOKIE, type Language } from "@/lib/i18n";

/**
 * Stores the interface language of a signed-in user in their preferences so
 * the choice follows them on every device. The cookie remains the runtime
 * source of truth for rendering.
 */
export async function setLanguageAction(language: Language): Promise<void> {
  if (!isLanguage(language)) return;

  const session = await getSession();
  if (!session.user) return;

  try {
    await updatePreferences(session.user.id, { language });
  } catch (error) {
    logAuthFailure("setLanguageAction failed", error);
    return;
  }

  revalidatePath("/settings");
}

/** Exposed for the switcher so the cookie name lives in one place. */
export const languageCookieName = LANGUAGE_COOKIE;
