"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { logAuthFailure } from "@/lib/auth/errors";
import { updatePreferences } from "@/lib/db/user";
import { isCategoryIdList, sanitizeTechnologies } from "@/lib/preferences";
import { getDictionaryForRequest } from "@/lib/i18n/server";

export interface PreferenceFormState {
  error: string | null;
}

export async function savePreferencesAction(
  _prev: PreferenceFormState,
  formData: FormData,
): Promise<PreferenceFormState> {
  const t = await getDictionaryForRequest();
  const session = await getSession();
  if (!session.user) {
    return { error: t.empty.signInRequiredTitle };
  }

  const rawCategories = formData.getAll("categories").map(String);
  const rawTechnologies = formData.getAll("technologies").map(String);

  if (!isCategoryIdList(rawCategories)) {
    return { error: t.errors.generic };
  }

  try {
    await updatePreferences(session.user.id, {
      categories: rawCategories,
      technologies: sanitizeTechnologies(rawTechnologies),
      onboarding_completed: true,
    });
  } catch (error) {
    logAuthFailure("savePreferencesAction failed", error);
    return { error: t.errors.generic };
  }

  revalidatePath("/settings");
  revalidatePath("/onboarding");
  redirect("/");
}

export async function skipOnboardingAction(): Promise<void> {
  const session = await getSession();
  if (!session.user) {
    redirect("/login?next=/onboarding");
  }

  try {
    await updatePreferences(session.user.id, { onboarding_completed: true });
  } catch (error) {
    logAuthFailure("skipOnboardingAction failed", error);
  }

  redirect("/");
}
