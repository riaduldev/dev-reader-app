import { CATEGORIES, type CategoryId } from "@/lib/categories";

/**
 * Technology tags offered during onboarding and in the settings page.
 * They are plain technical terms so they can be matched against article
 * titles, descriptions and AI tags later on.
 */
export const TECHNOLOGY_OPTIONS: string[] = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Vue",
  "Angular",
  "Svelte",
  "CSS",
  "Tailwind CSS",
  "Bun",
  "Deno",
  "Rust",
  "Go",
  "Python",
  "Java",
  "PostgreSQL",
  "Supabase",
  "GraphQL",
  "Docker",
  "Kubernetes",
  "Terraform",
  "AWS",
  "Azure",
  "Google Cloud",
  "CI/CD",
  "LLM",
  "AI Agents",
  "OpenAI",
  "Machine Learning",
  "GitHub",
  "DevOps",
  "Security",
  "Testing",
  "Performance",
];

export function isCategoryIdList(value: unknown): value is CategoryId[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === "string" &&
        (CATEGORIES as Array<{ id: string }>).some((category) => category.id === entry),
    )
  );
}

export function sanitizeTechnologies(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(TECHNOLOGY_OPTIONS.map((tech) => tech.toLowerCase()));
  const cleaned = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && allowed.has(entry.toLowerCase()))
    .map((entry) => {
      const match = TECHNOLOGY_OPTIONS.find(
        (tech) => tech.toLowerCase() === entry.toLowerCase(),
      );
      return match ?? entry;
    });
  return Array.from(new Set(cleaned)).slice(0, TECHNOLOGY_OPTIONS.length);
}
