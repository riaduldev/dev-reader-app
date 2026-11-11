"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { TECHNOLOGY_OPTIONS } from "@/lib/preferences";

export interface PreferenceFormState {
  error: string | null;
  /** True when the selection was saved successfully. */
  saved?: boolean;
}

const INITIAL_STATE: PreferenceFormState = { error: null };

const chipClass =
  "cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] has-[:checked]:border-transparent has-[:checked]:bg-[var(--accent-soft)] has-[:checked]:text-[var(--accent)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]";

/**
 * Category and technology picker.
 *
 * Native checkboxes are used inside the labels, so the control is fully
 * keyboard and screen-reader accessible; the visual chip is the label.
 */
export function PreferencePicker({
  action,
  skipAction,
  initialCategories = [],
  initialTechnologies = [],
  submitLabel,
  skipLabel,
}: {
  action: (
    state: PreferenceFormState,
    formData: FormData,
  ) => Promise<PreferenceFormState>;
  skipAction?: () => void;
  initialCategories?: string[];
  initialTechnologies?: string[];
  submitLabel?: string;
  skipLabel?: string;
}) {
  const t = useT();
  const [state, formAction, pending] = React.useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">{t.onboarding.categoriesTitle}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t.onboarding.categoriesHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <label key={category.id} className={chipClass}>
              <input
                type="checkbox"
                name="categories"
                value={category.id}
                defaultChecked={initialCategories.includes(category.id)}
                className="sr-only"
              />
              {categoryLabel(category.id, t)}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">{t.onboarding.technologiesTitle}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t.onboarding.technologiesHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TECHNOLOGY_OPTIONS.map((technology) => (
            <label key={technology} className={chipClass}>
              <input
                type="checkbox"
                name="technologies"
                value={technology}
                defaultChecked={initialTechnologies.includes(technology)}
                className="sr-only"
              />
              {technology}
            </label>
          ))}
        </div>
      </section>

      {state.error && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? t.common.saving : (submitLabel ?? t.onboarding.save)}
        </Button>
        {skipLabel && skipAction && (
          <Button type="button" variant="ghost" onClick={skipAction} disabled={pending}>
            {skipLabel}
          </Button>
        )}
        <p className="text-xs text-[var(--muted-foreground)]">
          {t.onboarding.categoriesHint}
        </p>
      </div>
    </form>
  );
}
