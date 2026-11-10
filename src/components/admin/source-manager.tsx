"use client";

import { Loader2, Pencil, Plus, RefreshCw, TestTube2 } from "lucide-react";
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
import { CATEGORIES } from "@/lib/categories";
import type { DatabaseSource } from "@/lib/db/types";
import { relativeTimeBn } from "@/lib/utils";

const RELIABILITY_LABELS: Record<string, string> = {
  official: "অফিসিয়াল",
  trusted: "বিশ্বস্ত",
  community: "কমিউনিটি",
};

const TYPE_LABELS: Record<string, string> = {
  rss: "RSS",
  atom: "Atom",
  json_api: "JSON API",
  html_index: "ইন্ডেক্স (ফিড নেই)",
};

export function SourceManager({ initialSources }: { initialSources: DatabaseSource[] }) {
  const [sources, setSources] = React.useState(initialSources);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DatabaseSource | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
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
      const json = (await response.json()) as { error?: string; source?: DatabaseSource };
      if (!response.ok) throw new Error(json.error ?? "সংরক্ষণ ব্যর্থ।");

      const saved = json.source!;
      setSources((items) =>
        editing
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [...items, saved],
      );
      setDialogOpen(false);
      toast.success(editing ? "সোর্স আপডেট হয়েছে।" : "সোর্স যোগ হয়েছে।");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "সংরক্ষণ ব্যর্থ।");
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
      if (!response.ok) throw new Error(json.error ?? "আপডেট ব্যর্থ।");
      setSources((items) =>
        items.map((item) =>
          item.id === source.id ? { ...item, is_active: !item.is_active } : item,
        ),
      );
      toast.success(source.is_active ? "সোর্স নিষ্ক্রিয় করা হয়েছে।" : "সোর্স সক্রিয় করা হয়েছে।");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "আপডেট ব্যর্থ।");
    }
  };

  const testSource = async (source: DatabaseSource) => {
    setBusyId(source.id);
    try {
      const response = await fetch(`/api/admin/sources/${source.id}/test`, {
        method: "POST",
      });
      const json = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok) throw new Error(json.error ?? "টেস্ট ব্যর্থ।");
      if (json.ok) {
        toast.success(json.message ?? "টেস্ট সফল।");
      } else {
        toast.error(json.message ?? "টেস্ট ব্যর্থ।");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "টেস্ট ব্যর্থ।");
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
        status?: string;
      };
      if (!response.ok) throw new Error(json.error ?? "সিঙ্ক ব্যর্থ।");
      toast.success(
        `সিঙ্ক সম্পন্ন — ${json.newArticles ?? 0} টি নতুন নিবন্ধ যোগ হয়েছে।`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "সিঙ্ক ব্যর্থ।");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          {sources.length} টি সোর্স ·{" "}
          {sources.filter((source) => source.is_active).length} টি সক্রিয়
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4" />
          নতুন সোর্স
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-2.5 font-medium">সোর্স</th>
              <th className="px-4 py-2.5 font-medium">ক্যাটাগরি</th>
              <th className="px-4 py-2.5 font-medium">টাইপ</th>
              <th className="px-4 py-2.5 font-medium">নির্ভরযোগ্যতা</th>
              <th className="px-4 py-2.5 font-medium">সর্বশেষ সাফল্য</th>
              <th className="px-4 py-2.5 font-medium">অবস্থা</th>
              <th className="px-4 py-2.5 text-right font-medium">অ্যাকশন</th>
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
                  {CATEGORIES.find((item) => item.id === source.category)?.label ??
                    source.category}
                </td>
                <td className="px-4 py-3 text-xs">
                  {TYPE_LABELS[source.source_type] ?? source.source_type}
                </td>
                <td className="px-4 py-3 text-xs">
                  {RELIABILITY_LABELS[source.reliability] ?? source.reliability}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {source.last_success_at ? relativeTimeBn(source.last_success_at) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={source.is_active}
                    onCheckedChange={() => toggleActive(source)}
                    aria-label={`${source.name} সক্রিয়/নিষ্ক্রিয়`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="টেস্ট"
                      title="ফিড টেস্ট করুন"
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
                      aria-label="সিঙ্ক"
                      title="এখনই সিঙ্ক করুন"
                      disabled={busyId === source.id}
                      onClick={() => syncSource(source)}
                    >
                      <RefreshCw className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="সম্পাদনা"
                      title="সম্পাদনা"
                      onClick={() => openEdit(source)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "সোর্স সম্পাদনা" : "নতুন সোর্স যোগ করুন"}</DialogTitle>
            <DialogDescription>
              ফিড বা API URL যোগ করুন। কোনো machine-readable ফিড না থাকলে{" "}
              <span className="font-medium">ইন্ডেক্স</span> টাইপ বেছে নিন — DevPulse
              স্ক্র্যাপ করে না।
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="source-name">নাম</Label>
              <Input
                id="source-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source-slug">স্লাগ</Label>
              <Input
                id="source-slug"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                placeholder="example-news"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source-feed">ফিড / API URL</Label>
              <Input
                id="source-feed"
                value={form.feed_url}
                onChange={(event) => setForm({ ...form, feed_url: event.target.value })}
                placeholder="https://example.com/feed.xml"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source-site">ওয়েবসাইট URL</Label>
              <Input
                id="source-site"
                value={form.site_url}
                onChange={(event) => setForm({ ...form, site_url: event.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label>ক্যাটাগরি</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>সোর্স টাইপ</Label>
              <Select
                value={form.source_type}
                onValueChange={(value) =>
                  setForm({ ...form, source_type: value as typeof form.source_type })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rss">RSS</SelectItem>
                  <SelectItem value="atom">Atom</SelectItem>
                  <SelectItem value="json_api">JSON API</SelectItem>
                  <SelectItem value="html_index">ইন্ডেক্স (ফিড নেই)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>নির্ভরযোগ্যতা</Label>
              <Select
                value={form.reliability}
                onValueChange={(value) =>
                  setForm({ ...form, reliability: value as typeof form.reliability })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="official">অফিসিয়াল</SelectItem>
                  <SelectItem value="trusted">বিশ্বস্ত</SelectItem>
                  <SelectItem value="community">কমিউনিটি</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source-interval">ফেচ ইন্টারভাল (মিনিট)</Label>
              <Input
                id="source-interval"
                type="number"
                min={5}
                max={1440}
                value={form.fetch_interval_minutes}
                onChange={(event) =>
                  setForm({ ...form, fetch_interval_minutes: Number(event.target.value) })
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="source-notes">নোট</Label>
              <Input
                id="source-notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="যেমন: অফিসিয়াল ফিড, robots.txt মেনে চলা হয়"
              />
            </div>

            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <span className="text-sm">সোর্স সক্রিয় রাখুন</span>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
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
              বাতিল
            </Button>
            <Button onClick={save}>সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
