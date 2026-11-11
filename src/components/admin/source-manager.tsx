"use client";

import { Loader2, Pencil, Plus, RefreshCw, TestTube2, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { useLanguage, useT } from "@/lib/i18n/client";
import type { DatabaseSource } from "@/lib/db/types";
import { formatRelativeTime } from "@/lib/utils";

export function SourceManager({ initialSources }: { initialSources: DatabaseSource[] }) {
  const t = useT();
  const [language] = useLanguage();
  const [sources, setSources] = React.useState(initialSources);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DatabaseSource | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<DatabaseSource | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    feed_url: "",
    site_url: "",
    category: "ai",
    source_type: "rss",
    reliability: "official",
    fetch_interval_minutes: 60,
    notes: "",
    is_active: true,
  });

  const typeLabels: Record<string, string> = {
    rss: t.admin.typeRss,
    atom: t.admin.typeAtom,
    json_api: t.admin.typeJson,
    html_index: t.admin.typeIndex,
  };

  const reliabilityLabels: Record<string, string> = {
    official: t.admin.reliabilityOfficial,
    trusted: t.admin.reliabilityTrusted,
    community: t.admin.reliabilityCommunity,
  };

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setForm({
      name: "",
      slug: "",
      feed_url: "",
      site_url: "",
      category: "ai",
      source_type: "rss",
      reliability: "official",
      fetch_interval_minutes: 60,
      notes: "",
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (source: DatabaseSource) => {
    setEditing(source);
    setFormError(null);
    setForm({
      name: source.name,
      slug: source.slug,
      feed_url: source.feed_url ?? "",
      site_url: source.site_url ?? "",
      category: source.category,
      source_type: source.source_type,
      reliability: source.reliability,
      fetch_interval_minutes: source.fetch_interval_minutes,
      notes: source.notes ?? "",
      is_active: source.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setFormError(null);
    try {
      const response = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          ...form,
          feed_url: form.feed_url || null,
          site_url: form.site_url || null,
          fetch_interval_minutes: Number(form.fetch_interval_minutes),
        }),
      });
      const json = (await response.json()) as {
        error?: string;
        source?: DatabaseSource;
      };
      if (!response.ok) throw new Error(json.error ?? t.errors.generic);

      const saved = json.source!;
      setSources((items) =>
        editing
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [...items, saved],
      );
      setDialogOpen(false);
      toast.success(editing ? t.admin.editSource : t.admin.addSource);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t.errors.generic);
    }
  };

  const toggleActive = async (source: DatabaseSource) => {
    try {
      const response = await fetch("/api/admin/sources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: source.id, is_active: !source.is_active }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? t.errors.generic);
      setSources((items) =>
        items.map((item) =>
          item.id === source.id ? { ...item, is_active: !item.is_active } : item,
        ),
      );
      toast.success(t.admin.sourceActive);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    }
  };

  const testSource = async (source: DatabaseSource) => {
    setBusyId(source.id);
    try {
      const response = await fetch(`/api/admin/sources/${source.id}/test`, {
        method: "POST",
      });
      const json = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(json.error ?? t.errors.generic);
      if (json.ok) {
        toast.success(json.message ?? t.common.test);
      } else {
        toast.error(json.message ?? t.errors.generic);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setBusyId(null);
    }
  };

  const syncSource = async (source: DatabaseSource) => {
    setBusyId(source.id);
    try {
      const response = await fetch(`/api/admin/sources/${source.id}/sync`, {
        method: "POST",
      });
      const json = (await response.json()) as {
        error?: string;
        newArticles?: number;
      };
      if (!response.ok) throw new Error(json.error ?? t.errors.generic);
      toast.success(
        `${t.dashboard.refreshDone
          .replace("{ok}", "1")
          .replace("{count}", String(json.newArticles ?? 0))}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setBusyId(null);
    }
  };

  const deleteSource = async () => {
    if (!deleting) return;
    setDeletingId(deleting.id);
    try {
      const response = await fetch(
        `/api/admin/sources?id=${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? t.errors.generic);
      setSources((items) => items.filter((item) => item.id !== deleting.id));
      toast.success(t.admin.deleteSource);
      setDeleting(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          {sources.length} ·{" "}
          {sources.filter((source) => source.is_active).length}{" "}
          {t.admin.sourceActive}
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" />
          {t.admin.addSource}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-2.5 font-medium">{t.admin.sourceName}</th>
              <th className="px-4 py-2.5 font-medium">
                {t.admin.sourceCategory}
              </th>
              <th className="px-4 py-2.5 font-medium">{t.admin.sourceType}</th>
              <th className="px-4 py-2.5 font-medium">
                {t.admin.sourceReliability}
              </th>
              <th className="px-4 py-2.5 font-medium">
                {t.admin.lastSuccess}
              </th>
              <th className="px-4 py-2.5 font-medium">{t.common.source}</th>
              <th className="px-4 py-2.5 text-right font-medium">⋯</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sources.map((source) => (
              <tr key={source.id} className="align-middle">
                <td className="px-4 py-3">
                  <div className="font-medium">{source.name}</div>
                  <div className="max-w-xs truncate font-mono text-xs text-[var(--muted-foreground)]">
                    {source.feed_url ?? source.site_url ?? "—"}
                  </div>
                  {source.last_error && (
                    <div className="mt-1 max-w-sm truncate text-xs text-[var(--danger)]">
                      {source.last_error}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {categoryLabel(source.category, t)}
                </td>
                <td className="px-4 py-3 text-xs">
                  {typeLabels[source.source_type] ?? source.source_type}
                </td>
                <td className="px-4 py-3 text-xs">
                  {reliabilityLabels[source.reliability] ?? source.reliability}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {source.last_success_at
                    ? formatRelativeTime(source.last_success_at, language)
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={source.is_active}
                    onCheckedChange={() => toggleActive(source)}
                    aria-label={source.name}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t.admin.testSource}
                      title={t.admin.testSource}
                      disabled={busyId === source.id}
                      onClick={() => testSource(source)}
                    >
                      {busyId === source.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <TestTube2 className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t.admin.syncSource}
                      title={t.admin.syncSource}
                      disabled={busyId === source.id}
                      onClick={() => syncSource(source)}
                    >
                      <RefreshCw className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t.admin.editSource}
                      title={t.admin.editSource}
                      onClick={() => openEdit(source)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t.admin.deleteSource}
                      title={t.admin.deleteSource}
                      className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                      onClick={() => setDeleting(source)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.admin.deleteConfirm}</DialogTitle>
            <DialogDescription>{t.admin.deleteWarning}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleting(null)}
              disabled={deletingId !== null}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={deletingId !== null}
              onClick={deleteSource}
            >
              {deletingId !== null && <Loader2 className="size-4 animate-spin" />}
              {t.admin.deleteSource}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? t.admin.editSourceTitle : t.admin.newSource}
            </DialogTitle>
            <DialogDescription>{t.admin.sourceDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="source-name">{t.admin.sourceName}</Label>
              <Input
                id="source-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source-slug">{t.admin.sourceSlug}</Label>
              <Input
                id="source-slug"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder={t.admin.sourceSlugPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source-feed">{t.admin.sourceFeed}</Label>
              <Input
                id="source-feed"
                value={form.feed_url}
                onChange={(event) =>
                  setForm({ ...form, feed_url: event.target.value })
                }
                placeholder={t.admin.sourceFeedPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source-site">{t.admin.sourceSite}</Label>
              <Input
                id="source-site"
                value={form.site_url}
                onChange={(event) =>
                  setForm({ ...form, site_url: event.target.value })
                }
                placeholder={t.admin.sourceSitePlaceholder}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t.admin.sourceCategory}</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger aria-label={t.admin.sourceCategory}>
                  <SelectValue>{categoryLabel(form.category, t)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {categoryLabel(category.id, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t.admin.sourceType}</Label>
              <Select
                value={form.source_type}
                onValueChange={(value) =>
                  setForm({ ...form, source_type: value as typeof form.source_type })
                }
              >
                <SelectTrigger aria-label={t.admin.sourceType}>
                  <SelectValue>{typeLabels[form.source_type] ?? form.source_type}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rss">{t.admin.typeRss}</SelectItem>
                  <SelectItem value="atom">{t.admin.typeAtom}</SelectItem>
                  <SelectItem value="json_api">{t.admin.typeJson}</SelectItem>
                  <SelectItem value="html_index">{t.admin.typeIndex}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t.admin.sourceReliability}</Label>
              <Select
                value={form.reliability}
                onValueChange={(value) =>
                  setForm({ ...form, reliability: value as typeof form.reliability })
                }
              >
                <SelectTrigger aria-label={t.admin.sourceReliability}>
                  <SelectValue>
                    {reliabilityLabels[form.reliability] ?? form.reliability}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="official">
                    {t.admin.reliabilityOfficial}
                  </SelectItem>
                  <SelectItem value="trusted">
                    {t.admin.reliabilityTrusted}
                  </SelectItem>
                  <SelectItem value="community">
                    {t.admin.reliabilityCommunity}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source-interval">{t.admin.sourceInterval}</Label>
              <Input
                id="source-interval"
                type="number"
                min={5}
                max={1440}
                value={form.fetch_interval_minutes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    fetch_interval_minutes: Number(event.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="source-notes">{t.admin.sourceNotes}</Label>
              <Input
                id="source-notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder={t.admin.sourceNotesPlaceholder}
              />
            </div>

            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <span className="text-sm">{t.admin.sourceActive}</span>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_active: checked })
                }
              />
            </div>
          </div>

          {formError && (
            <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={save}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
