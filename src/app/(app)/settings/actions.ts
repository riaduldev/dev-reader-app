"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import {
  clearHistory,
  updatePreferences,
  updateProfile,
} from "@/lib/db/user";
import { z } from "zod";

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
    email_digest: formData.get("email_digest") === "on" || formData.get("email_digest") === "true",
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

export async function clearHistoryAction(): Promise<void> {
  const session = await getSession();
  if (!session.user) return;
  await clearHistory(session.user.id);
  revalidatePath("/history");
  revalidatePath("/settings");
}
