import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { deleteSource, listSources, setSourceActive, upsertSource } from "@/lib/db/sources";
import { CATEGORY_IDS } from "@/lib/categories";

export const dynamic = "force-dynamic";

const sourceSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and dashes."),
  name: z.string().trim().min(2).max(120),
  feed_url: z
    .string()
    .trim()
    .url()
    .nullable()
    .optional()
    .or(z.literal("")),
  site_url: z.string().trim().url().nullable().optional().or(z.literal("")),
  category: z.enum(CATEGORY_IDS),
  source_type: z.enum(["rss", "atom", "json_api", "html_index"]),
  reliability: z.enum(["official", "trusted", "community"]),
  is_active: z.boolean().default(true),
  fetch_interval_minutes: z.number().int().min(5).max(1440).default(60),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const sources = await listSources();
    return NextResponse.json({ sources });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load sources." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = sourceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
      { status: 400 },
    );
  }

  try {
    const source = await upsertSource({
      ...parsed.data,
      feed_url: parsed.data.feed_url ? parsed.data.feed_url : null,
      site_url: parsed.data.site_url ? parsed.data.site_url : null,
    });
    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save source." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = z
    .object({ id: z.string().uuid(), is_active: z.boolean() })
    .safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "id and is_active are required." }, { status: 400 });
  }

  try {
    await setSourceActive(parsed.data.id, parsed.data.is_active);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update source." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  try {
    await deleteSource(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete source." },
      { status: 500 },
    );
  }
}
