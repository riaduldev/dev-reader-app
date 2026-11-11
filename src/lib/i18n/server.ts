import { cookies } from "next/headers";

import {
  LANGUAGE_COOKIE,
  DICTIONARIES,
  isLanguage,
  type Dictionary,
  type Language,
} from "./index";
import type { Dictionary as DictionaryType } from "./types";

export type { Dictionary, Language };

/**
 * Reads the interface language from the `drh_lang` cookie.
 *
 * The cookie is the single source of truth at render time so server and
 * client always agree (no hydration mismatch, no language flash).
 */
export async function getLanguage(): Promise<Language> {
  try {
    const store = await cookies();
    const value = store.get(LANGUAGE_COOKIE)?.value;
    return isLanguage(value) ? value : "bn";
  } catch {
    return "bn";
  }
}

/** Returns the dictionary for the current request. */
export async function getDictionaryForRequest(): Promise<DictionaryType> {
  const language = await getLanguage();
  return DICTIONARIES[language];
}

