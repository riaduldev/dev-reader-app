"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import { logAuthFailure } from "@/lib/auth/errors";
import {
  clearHistory,
  updatePreferences,
  updateProfile,
} from "@/lib/db/user";
import { isCategoryIdList, sanitizeTechnologies } from "@/lib/preferences";
import type { PreferenceFormState } from "@/components/settings/preference-picker";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getDictionaryForRequest } from "@/lib/i18n/server";

const preferencesSchema = z.object({
  theme: z.enum(["dark", "light", "system"]),
  language: z.enum(["bn", "en"]),
  density: z.enum(["comfortable", "compact"]),
  email_digest: z.boolean(),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
});

export async function updatePreferencesAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session.user) return;

  const parsed = preferencesSchema.safeParse({
    theme: formData.get("theme") ?? "dark",
    language: formData.get("language") ?? "bn",
    density: formData.get("density") ?? "comfortable",
    email_digest:
      formData.get("email_digest") === "on" ||
      formData.get("email_digest") === "true",
  });
  if (!parsed.success) return;

  await updatePreferences(session.user.id, parsed.data);
  revalidatePath("/settings");
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session.user) return;

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
  });
  if (!parsed.success) return;

  await updateProfile(session.user.id, { full_name: parsed.data.full_name });
  revalidatePath("/settings");
}

/** Saves the category / technology selection from the settings page. */
export async function saveSettingsPreferencesAction(
  _prev: PreferenceFormState,
  formData: FormData,
): Promise<PreferenceFormState> {
  const t = await getDictionaryForRequest();
  const session = await getSession();
  if (!session.user) {
    return { error: t.empty.signInRequiredTitle, saved: false };
  }

  const rawCategories = formData.getAll("categories").map(String);
  const rawTechnologies = formData.getAll("technologies").map(String);

  if (!isCategoryIdList(rawCategories)) {
    return { error: t.errors.generic, saved: false };
  }

  try {
    await updatePreferences(session.user.id, {
      categories: rawCategories,
      technologies: sanitizeTechnologies(rawTechnologies),
      onboarding_completed: true,
    });
  } catch (error) {
    logAuthFailure("saveSettingsPreferencesAction failed", error);
    return { error: t.errors.generic, saved: false };
  }

  revalidatePath("/settings");
  return { error: null, saved: true };
}

export async function clearHistoryAction(): Promise<void> {
  const session = await getSession();
  if (!session.user) return;
  await clearHistory(session.user.id);
  revalidatePath("/history");
  revalidatePath("/settings");
}

/**
 * Deletes the signed-in user's account.
 *
 * The Supabase `auth.users` row is removed through the admin API; every
 * personal row (profile, preferences, bookmarks, reading history and
 * notifications) is removed by the `ON DELETE CASCADE` constraints — see
 * `supabase/migrations/0001_init.sql` and `docs/database.md`.
 */
export async function deleteAccountAction(): Promise<void> {
  const session = await getSession();
  if (!session.user) {
    redirect("/login");
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.auth.admin.deleteUser(session.user.id);
    if (error) {
      logAuthFailure("deleteAccountAction failed", error);
      return;
    }
  } catch (error) {
    logAuthFailure("deleteAccountAction threw", error);
    return;
  }

  redirect("/");
}
