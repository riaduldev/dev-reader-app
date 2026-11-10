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

export function ThemePicker() {
  const stored = useThemePreference();
  const [local, setLocal] = React.useState<ThemePreference | null>(null);
  const theme = local ?? stored;

  const change = (value: string) => {
    const next = value as ThemePreference;
    setLocal(next);
    applyTheme(next);
    toast.success("থিম আপডেট হয়েছে।");
  };

  return (
    <Select value={theme} onValueChange={change}>
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">ডার্ক (ডিফল্ট)</SelectItem>
        <SelectItem value="light">লাইট</SelectItem>
        <SelectItem value="system">সিস্টেম অনুসরণ করুন</SelectItem>
      </SelectContent>
    </Select>
  );
}
