"use client";

import { Languages } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  LANGUAGE_COOKIE,
  LANGUAGE_LABELS,
  LANGUAGE_STORAGE_KEY,
  getDictionary,
  isLanguage,
  type Language,
} from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/types";
import { setLanguageAction } from "@/lib/auth/language-action";

interface LanguageContextValue {
  language: Language;
  t: Dictionary;
  setLanguage: (language: Language) => void;
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

/** Persists the language in a cookie (server readable) and localStorage. */
export function persistLanguage(language: Language) {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=${oneYear}; samesite=lax`;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage may be unavailable — the cookie is enough.
  }
}

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = React.useState<Language>(initialLanguage);
  const router = useRouter();

  const setLanguage = React.useCallback(
    (next: Language) => {
      if (!isLanguage(next)) return;
      setLanguageState(next);
      persistLanguage(next);
      // Re-render the server components in place — the user stays on the page.
      router.refresh();
    },
    [router],
  );

  const value = React.useMemo<LanguageContextValue>(
    () => ({ language, t: getDictionary(language), setLanguage }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

/** Returns the active dictionary. */
export function useT(): Dictionary {
  const context = React.useContext(LanguageContext);
  if (!context) {
    // Outside the provider (rare) fall back to the default language.
    return getDictionary("bn");
  }
  return context.t;
}

/** Returns the active language and a setter. */
export function useLanguage(): [Language, (language: Language) => void] {
  const context = React.useContext(LanguageContext);
  const [fallback, setFallback] = React.useState<Language>("bn");
  if (!context) return [fallback, setFallback];
  return [context.language, context.setLanguage];
}

/**
 * Language switcher. The label always shows the language the visitor can
 * switch *to*.
 */
export function LanguageSwitcher({
  className,
  signedIn = false,
}: {
  className?: string;
  /** When true the choice is also stored in the user profile. */
  signedIn?: boolean;
}) {
  const t = useT();
  const [language, setLanguage] = useLanguage();
  const target: Language = language === "bn" ? "en" : "bn";

  const switchTo = () => {
    setLanguage(target);
    if (signedIn) {
      void setLanguageAction(target);
    }
    toast.success(t.language.changed);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchTo}
      className={className}
      aria-label={t.language.switchToAria}
      title={t.language.switchToAria}
      data-testid="language-switcher"
    >
      <Languages className="size-4" />
      <span className="text-xs font-medium">
        {LANGUAGE_LABELS[target]}
      </span>
    </Button>
  );
}
