#!/usr/bin/env node
/**
 * Applies the Supabase migrations to a project.
 *
 * Usage:
 *   npm run db:migrate
 *
 * The connection string is read (in this order) from:
 *   1. the DATABASE_URL / SUPABASE_DB_URL environment variable,
 *   2. the .env.local file in the project root.
 *
 * Example (Supabase Dashboard → Project Settings → Database → Connection string):
 *   postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres
 *
 * The script is idempotent: every statement in the migration files is written
 * so that re-running them neither fails nor duplicates objects.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import postgres from "postgres";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

async function loadEnvFile() {
  try {
    const raw = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // No .env.local — the environment variable can still provide the URL.
  }
}

function resolveConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    ""
  ).trim();
}

async function main() {
  await loadEnvFile();

  const connectionString = resolveConnectionString();
  if (!connectionString) {
    console.error(
      [
        "",
        "✖ ডেটাবেসের connection string পাওয়া যায়নি।",
        "",
        "নিচের কোনো একটি উপায়ে connection string দিন:",
        "",
        "  1) Supabase Dashboard → Project Settings → Database → Connection string",
        "     (URI, পাসওয়ার্ডসহ) — এটি .env.local ফাইলে রাখুন:",
        "       DATABASE_URL=postgresql://postgres:<PASSWORD>@db.<ref>.supabase.co:5432/postgres",
        "",
        "  2) অথবা পরিবেশের variable হিসেবে:",
        "       DATABASE_URL=... npm run db:migrate",
        "",
        "  3) অথবা SQL Editor-এ migration ফাইল দুটি সরাসরি চালান:",
        "       supabase/migrations/0001_init.sql",
        "       supabase/migrations/0002_auth_onboarding.sql",
        "",
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  let sql;
  try {
    sql = postgres(connectionString, {
      max: 1,
      connect_timeout: 20,
      ssl: "require",
      idle_timeout: 5,
    });
  } catch (error) {
    console.error("✖ connection string পড়া যায়নি:", error.message);
    process.exitCode = 1;
    return;
  }

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("✖ কোনো migration ফাইল পাওয়া যায়নি।");
    process.exitCode = 1;
    return;
  }

  console.log(`→ ${files.length} টি migration ফাইল পাওয়া গেছে:\n`);

  try {
    for (const file of files) {
      const statement = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      process.stdout.write(`  • ${file} … `);
      await sql.unsafe(statement);
      console.log("সফল");
    }

    const rows = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `;

    console.log(
      `\n✔ schema প্রয়োগ সম্পন্ন। public schema-এ টেবিল: ${rows
        .map((row) => row.table_name)
        .join(", ")}`,
    );
  } catch (error) {
    console.error("\n✖ migration ব্যর্থ:", error.message);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();
