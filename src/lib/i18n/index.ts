import { bn } from "./dictionaries/bn";
import { en } from "./dictionaries/en";
import type { Dictionary } from "./types";

export type { Dictionary };

export type Language = "bn" | "en";

export const LANGUAGE_LABELS: Record<Language, string> = {
  bn: "বাংলা",
  en: "English",
};

export const LANGUAGE_STORAGE_KEY = "devreaderhub-language";
export const LANGUAGE_COOKIE = "drh_lang";

export const DICTIONARIES: Record<Language, Dictionary> = {
  bn: bn as unknown as Dictionary,
  en,
};

export function isLanguage(value: unknown): value is Language {
  return value === "bn" || value === "en";
}

export function getDictionary(language: Language): Dictionary {
  return DICTIONARIES[language] ?? DICTIONARIES.bn;
}

/** Replaces `{placeholder}` tokens inside a dictionary string. */
export function format(
  template: string,
  values?: Record<string, string | number>,
): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
