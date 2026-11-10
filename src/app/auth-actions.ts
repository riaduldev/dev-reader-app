"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { AuthFormState } from "@/lib/auth/types";

const loginSchema = z.object({
  email: z.email({ error: "সঠিক একটি ইমেইল দিন।" }).trim(),
  password: z.string().min(8, { error: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" }),
});

const signupSchema = loginSchema.extend({
  full_name: z
    .string()
    .trim()
    .min(2, { error: "পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে।" })
    .max(120),
});

function safeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase কনফিগার করা নেই। .env.local ফাইলে NEXT_PUBLIC_SUPABASE_URL ও NEXT_PUBLIC_SUPABASE_ANON_KEY যোগ করুন।",
      message: null,
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((issue) => issue.message).join(" "),
      message: null,
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return {
        error:
          error.message.toLowerCase().includes("invalid")
            ? "ইমেইল বা পাসওয়ার্ড সঠিক নয়।"
            : error.message,
        message: null,
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "লগইন ব্যর্থ।",
      message: null,
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase কনফিগার করা নেই। .env.local ফাইলে Supabase ভ্যারিয়েবলগুলো যোগ করুন।",
      message: null,
    };
  }

  const parsed = signupSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    full_name: formData.get("full_name") ?? "",
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((issue) => issue.message).join(" "),
      message: null,
    };
  }

  if (!/[0-9]/.test(parsed.data.password) || !/[a-zA-Z]/.test(parsed.data.password)) {
    return {
      error: "পাসওয়ার্ডে কমপক্ষে একটি সংখ্যা ও একটি অক্ষর থাকতে হবে।",
      message: null,
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { full_name: parsed.data.full_name } },
    });
    if (error) {
      return { error: error.message, message: null };
    }
    if (!data.session) {
      return {
        error: null,
        message:
          "অ্যাকাউন্ট তৈরি হয়েছে। ইমেইল যাচাই করার পর সাইন ইন করুন।",
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "সাইন আপ ব্যর্থ।",
      message: null,
    };
  }

  redirect(safeNext(formData.get("next")));
}
