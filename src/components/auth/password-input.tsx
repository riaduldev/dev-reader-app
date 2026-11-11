"use client";

import { Check, Eye, EyeOff, X } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export function passwordRules(t: ReturnType<typeof useT>): PasswordRule[] {
  return [
    { id: "length", label: t.auth.ruleLength, test: (v) => v.length >= 8 },
    { id: "letter", label: t.auth.ruleLetter, test: (v) => /[a-zA-Z]/.test(v) },
    { id: "number", label: t.auth.ruleNumber, test: (v) => /[0-9]/.test(v) },
  ];
}

export function checkPassword(
  value: string,
  rules: PasswordRule[],
): {
  valid: boolean;
  score: number;
  results: Array<PasswordRule & { passed: boolean }>;
} {
  const results = rules.map((rule) => ({ ...rule, passed: rule.test(value) }));
  const passed = results.filter((rule) => rule.passed).length;
  return { valid: passed === results.length, score: passed, results };
}

/** Password field with a visibility toggle and an optional rules checklist. */
export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  showRules = false,
  value,
  onChange,
  invalid = false,
}: {
  id: string;
  name: string;
  autoComplete: string;
  placeholder?: string;
  showRules?: boolean;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const t = useT();
  const [visible, setVisible] = React.useState(false);
  const rules = React.useMemo(() => passwordRules(t), [t]);
  const strength = checkPassword(value, rules);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={showRules ? `${id}-rules` : undefined}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {showRules && (
        <ul id={`${id}-rules`} className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {strength.results.map((rule) => (
            <li
              key={rule.id}
              className={cn(
                "inline-flex items-center gap-1",
                rule.passed
                  ? "text-[var(--success)]"
                  : "text-[var(--muted-foreground)]",
              )}
            >
              {rule.passed ? (
                <Check className="size-3" aria-hidden />
              ) : (
                <X className="size-3" aria-hidden />
              )}
              {rule.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
