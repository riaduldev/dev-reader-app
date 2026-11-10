"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  applyTheme,
  useThemePreference,
  type ThemePreference,
} from "@/components/theme/theme-store";
import { cn } from "@/lib/utils";

export { THEME_STORAGE_KEY, applyTheme } from "@/components/theme/theme-store";
export type { ThemePreference } from "@/components/theme/theme-store";

export function ThemeToggle({ className }: { className?: string }) {
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
      aria-label="থিম পরিবর্তন করুন"
      title="থিম পরিবর্তন করুন"
    >
      {theme === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
