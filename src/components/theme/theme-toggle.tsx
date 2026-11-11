"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  applyTheme,
  useThemePreference,
  type ThemePreference,
} from "@/components/theme/theme-store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export { THEME_STORAGE_KEY, applyTheme } from "@/components/theme/theme-store";
export type { ThemePreference } from "@/components/theme/theme-store";

export function ThemeToggle({ className }: { className?: string }) {
  const t = useT();
  const theme = useThemePreference();

  const toggle = () => {
    const next: ThemePreference = theme === "dark" ? "light" : "dark";
    applyTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn(className)}
      aria-label={t.common.theme}
      title={t.common.theme}
    >
      {theme === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
