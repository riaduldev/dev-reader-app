import type { Dictionary } from "@/lib/i18n/types";

export const CATEGORY_IDS = [
  "ai",
  "web",
  "opensource",
  "security",
  "cloud",
  "industry",
  "jobs",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type SourceType = "rss" | "atom" | "json_api" | "html_index";

export type SourceReliability = "official" | "trusted" | "community";

export interface CategoryMeta {
  id: CategoryId;
  slug: string;
  /** English label, always available for technical clarity. */
  labelEn: string;
  /** Hue used for badges and accents. */
  hue: number;
  /** Keywords used by the categoriser. */
  terms: string[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "ai",
    slug: "ai",
    labelEn: "AI & Machine Learning",
    hue: 265,
    terms: [
      "openai",
      "chatgpt",
      "claude",
      "anthropic",
      "gemini",
      "llm",
      "large language model",
      "ai agent",
      "agentic",
      "machine learning",
      "deep learning",
      "ai coding",
      "copilot",
      "cursor",
      "hugging face",
      "huggingface",
      "inference",
      "fine-tuning",
      "embeddings",
      "multimodal",
      "diffusion",
      "openai o1",
      "gpt-",
      "mcp",
      "model context protocol",
    ],
  },
  {
    id: "web",
    slug: "web",
    labelEn: "Web Development",
    hue: 200,
    terms: [
      "javascript",
      "typescript",
      "react",
      "react.js",
      "next.js",
      "nextjs",
      "node.js",
      "nodejs",
      "express",
      "css",
      "html",
      "vue",
      "angular",
      "svelte",
      "bun",
      "deno",
      "vite",
      "webpack",
      "browser",
      "chrome",
      "firefox",
      "safari",
      "webassembly",
      "wasm",
      "framework",
      "frontend",
      "front-end",
      "backend",
      "back-end",
      "web performance",
      "http/3",
      "tailwind",
      "rsc",
      "server components",
    ],
  },
  {
    id: "opensource",
    slug: "opensource",
    labelEn: "GitHub & Open Source",
    hue: 150,
    terms: [
      "github",
      "git",
      "open source",
      "open-source",
      "opensource",
      "repository",
      "repo",
      "library",
      "framework",
      "developer tool",
      "devtool",
      "pull request",
      "release",
      "maintainer",
      "fork",
      "npm",
      "package manager",
      "monorepo",
      "cli",
      "sdk",
      "compilers",
      "compiler",
      "rust",
      "go",
      "python",
      "java",
      "kotlin",
      "swift",
    ],
  },
  {
    id: "security",
    slug: "security",
    labelEn: "Cybersecurity",
    hue: 5,
    terms: [
      "cve",
      "cisa",
      "nvd",
      "vulnerabilit",
      "exploit",
      "exploited",
      "breach",
      "ransomware",
      "malware",
      "owasp",
      "application security",
      "appsec",
      "phishing",
      "zero-day",
      "zero day",
      "patch",
      "security advisory",
      "advisory",
      "backdoor",
      "botnet",
      "ddos",
      "sql injection",
      "xss",
      "csrf",
      "authentication bypass",
      "encryption",
      "supply chain",
      "security update",
      "vulnerability",
      "attack",
    ],
  },
  {
    id: "cloud",
    slug: "cloud",
    labelEn: "Cloud & DevOps",
    hue: 30,
    terms: [
      "aws",
      "amazon web services",
      "azure",
      "google cloud",
      "gcp",
      "docker",
      "kubernetes",
      "terraform",
      "ci/cd",
      "cicd",
      "devops",
      "sre",
      "serverless",
      "lambda",
      "cloudflare",
      "vercel",
      "netlify",
      "kubernetes operator",
      "container",
      "helm",
      "istio",
      "observability",
      "prometheus",
      "grafana",
      "datadog",
      "infrastructure",
      "platform engineering",
      "deployment",
    ],
  },
  {
    id: "industry",
    slug: "industry",
    labelEn: "Tech Industry",
    hue: 320,
    terms: [
      "google",
      "microsoft",
      "apple",
      "meta",
      "facebook",
      "nvidia",
      "amazon",
      "netflix",
      "tesla",
      "startup",
      "startups",
      "acquisition",
      "acquires",
      "funding",
      "raises",
      "series a",
      "series b",
      "series c",
      "ipo",
      "layoff",
      "layoffs",
      "valuation",
      "partnership",
      "ceo",
      "tech industry",
      "venture capital",
      "unicorn",
    ],
  },
  {
    id: "jobs",
    slug: "jobs",
    labelEn: "Developer Jobs",
    hue: 95,
    terms: [
      "developer job",
      "software engineer",
      "software engineering",
      "hiring",
      "hiring now",
      "we are hiring",
      "job opening",
      "job openings",
      "career",
      "careers",
      "remote job",
      "remote work",
      "full-stack",
      "fullstack",
      "frontend engineer",
      "backend engineer",
      "senior engineer",
      "staff engineer",
      "internship",
      "job posting",
      "talent",
      "recruiter",
      "apply now",
    ],
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

export function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

/** Localised category label for the active interface language. */
export function categoryLabel(id: string, t: Dictionary): string {
  const category = t.categories[id as CategoryId];
  return category?.label ?? CATEGORY_MAP[id as CategoryId]?.labelEn ?? id;
}

/** Localised category description for the active interface language. */
export function categoryDescription(id: string, t: Dictionary): string {
  return t.categories[id as CategoryId]?.description ?? "";
}

export const APP_NAME = "DevReaderHub";
export const APP_TAGLINE = "আপনার প্রতিদিনের Developer News Hub";
