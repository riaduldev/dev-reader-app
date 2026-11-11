#!/usr/bin/env node
/**
 * Derives the DevReaderHub app icons from the original brand artwork.
 *
 * Source of truth: `public/dev-reader-hub.jpg` (never modified).
 * Outputs:
 *   public/devreaderhub-logo.png  – the mark on a transparent background
 *   public/icon-192.png           – manifest icon (dark badge)
 *   public/icon-512.png           – manifest icon (dark badge)
 *   src/app/icon.png              – browser tab icon (Next.js file convention)
 *   src/app/apple-icon.png        – Apple touch icon (Next.js file convention)
 *
 * The mark is never stretched: the artwork is cropped to its bounding box and
 * scaled proportionally.
 *
 * Requires `sharp` (not a project dependency):
 *   npm i -D sharp && node scripts/build-brand-assets.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public", "dev-reader-hub.jpg");

/** Finds the bounding box of the coloured (non background) artwork. */
async function findMarkBounds() {
  const { data, info } = await sharp(SOURCE)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      // The artwork is a saturated blue/cyan mark; the paper background and the
      // soft drop shadow are near-neutral and must not widen the bounding box.
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const isMark = max - min > 45 && b > r;
      if (!isMark) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/** Converts the near-white background into transparency (with soft edges). */
async function toTransparentMark(bounds) {
  const padding = 6;
  const left = Math.max(0, bounds.left - padding);
  const top = Math.max(0, bounds.top - padding);
  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;

  const { data, info } = await sharp(SOURCE)
    .removeAlpha()
    .extract({ left, top, width, height })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0, p = 0; i < data.length; i += info.channels, p += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;

    // Only the saturated blue/cyan mark is kept. The paper background and the
    // soft grey drop shadow are neutral and become fully transparent, so the
    // logo reads cleanly on both the dark and the light theme.
    let alpha = 0;
    if (saturation > 12) {
      alpha = Math.min(255, Math.round(((saturation - 12) / 33) * 255));
    }

    rgba[p] = r;
    rgba[p + 1] = g;
    rgba[p + 2] = b;
    rgba[p + 3] = alpha;
  }

  const square = Math.max(info.width, info.height);
  const margin = Math.round(square * 0.04);
  const canvas = Buffer.alloc(square * square * 4);
  const inner = square - margin * 2;

  const mark = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const placed = await sharp(mark)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  void canvas;
  return sharp({
    create: { width: square, height: square, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: placed, top: margin, left: margin }])
    .png()
    .toBuffer();
}

async function badge(logoBuffer, size) {
  const padding = Math.round(size * 0.14);
  const inner = size - padding * 2;
  const mark = await sharp(logoBuffer)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const background = await sharp({
    create: { width: size, height: size, channels: 4, background: "#0b0c10" },
  })
    .png()
    .toBuffer();

  return sharp(background)
    .composite([{ input: mark, top: padding, left: padding }])
    .png()
    .toBuffer();
}

async function main() {
  const original = await readFile(SOURCE);

  const bounds = await findMarkBounds();
  console.log(
    `mark bounding box: ${bounds.width}x${bounds.height} at (${bounds.left}, ${bounds.top})`,
  );

  const logo = await toTransparentMark(bounds);
  await writeFile(path.join(ROOT, "public", "devreaderhub-logo.png"), logo);
  console.log("wrote public/devreaderhub-logo.png");

  const targets = [
    ["src/app/icon.png", 512],
    ["src/app/apple-icon.png", 180],
    ["public/icon-192.png", 192],
    ["public/icon-512.png", 512],
  ];

  for (const [file, size] of targets) {
    const buffer = await badge(logo, size);
    await writeFile(path.join(ROOT, file), buffer);
    console.log(`wrote ${file} (${size}x${size})`);
  }

  const after = await readFile(SOURCE);
  if (!original.equals(after)) {
    throw new Error("The original artwork must not be modified.");
  }
  console.log("original artwork untouched ✔");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
