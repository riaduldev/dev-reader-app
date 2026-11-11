"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applyTheme,
  useThemePreference,
  type ThemePreference,
} from "@/components/theme/theme-store";
import { useT } from "@/lib/i18n/client";

export function ThemePicker() {
  const t = useT();
  const stored = useThemePreference();
  const [local, setLocal] = React.useState<ThemePreference | null>(null);
  const theme = local ?? stored;

  const change = (value: string) => {
    const next = value as ThemePreference;
    setLocal(next);
    applyTheme(next);
    toast.success(t.common.themeChanged);
  };

  return (
    <Select value={theme} onValueChange={change}>
      <SelectTrigger className="w-full sm:w-56" aria-label={t.common.theme}>
        <SelectValue>
          {theme === "dark"
            ? t.common.themeDark
            : theme === "light"
              ? t.common.themeLight
              : t.common.themeSystem}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">{t.common.themeDark}</SelectItem>
        <SelectItem value="light">{t.common.themeLight}</SelectItem>
        <SelectItem value="system">{t.common.themeSystem}</SelectItem>
      </SelectContent>
    </Select>
  );
}
