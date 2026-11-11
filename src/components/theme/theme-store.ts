"use client";

import * as React from "react";

export const THEME_STORAGE_KEY = "devreaderhub-theme";

export type ThemePreference = "dark" | "light" | "system";

const listeners = new Set<() => void>();

export function notifyThemeChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // Storage may be unavailable (private mode).
  }
  return "dark";
}

/**
 * Reads the theme preference without a hydration mismatch: the server snapshot
 * is always "dark" and the client snapshot reads localStorage.
 */
export function useThemePreference(): ThemePreference {
  return React.useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    () => "dark" as ThemePreference,
  );
}

/**
 * Applies a theme to the document. Dark is the default; the choice is stored
 * in localStorage and re-applied before first paint by the inline script in
 * the root layout.
 */
export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable (private mode) — the theme still applies.
  }

  notifyThemeChange();
}
