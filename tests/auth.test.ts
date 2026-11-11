import { describe, expect, it, vi } from "vitest";

import { describeAuthError, safeRedirectPath } from "@/lib/auth/errors";
import { checkPassword, passwordRules } from "@/components/auth/password-input";
import { isCategoryIdList, sanitizeTechnologies } from "@/lib/preferences";
import { bn } from "@/lib/i18n/dictionaries/bn";
import { en } from "@/lib/i18n/dictionaries/en";

describe("safeRedirectPath", () => {
  it("keeps internal paths", () => {
    expect(safeRedirectPath("/saved")).toBe("/saved");
    expect(safeRedirectPath("/article/123")).toBe("/article/123");
    expect(safeRedirectPath("/settings?tab=profile")).toBe("/settings?tab=profile");
  });

  it("falls back for external or protocol-relative targets", () => {
    expect(safeRedirectPath("https://evil.example/steal")).toBe("/");
    expect(safeRedirectPath("//evil.example")).toBe("/");
    expect(safeRedirectPath("/\\evil.example")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
    expect(safeRedirectPath(null)).toBe("/");
  });

  it("supports a custom fallback", () => {
    expect(safeRedirectPath("https://evil.example", "/onboarding")).toBe(
      "/onboarding",
    );
  });
});

describe("describeAuthError", () => {
  it("maps invalid credentials to a friendly message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const message = describeAuthError(
      { message: "Invalid login credentials", code: "invalid_credentials" },
      "test",
      en,
    );
    expect(message).toContain("email or password is incorrect");
    expect(message).not.toContain("Invalid login credentials");
  });

  it("explains an unconfirmed e-mail address", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const message = describeAuthError(
      { message: "Email not confirmed", code: "email_not_confirmed" },
      "test",
      en,
    );
    expect(message).toContain("not been confirmed");
  });

  it("explains a disabled OAuth provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const message = describeAuthError(
      {
        message: "Unsupported provider: provider is not enabled",
        code: "validation_failed",
      },
      "test",
      en,
    );
    expect(message).toContain("not enabled yet");
  });

  it("uses the Bangla dictionary for Bangla users", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const message = describeAuthError(
      { message: "Invalid login credentials", code: "invalid_credentials" },
      "test",
      bn,
    );
    expect(message).toContain("ইমেইল বা পাসওয়ার্ড সঠিক নয়");
  });

  it("never leaks a raw server message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const message = describeAuthError(
      { message: "connection to 10.0.0.5:5432 refused", code: "unexpected" },
      "test",
      en,
    );
    expect(message).not.toContain("10.0.0.5");
  });
});

describe("password rules", () => {
  it("requires length, a letter and a digit", () => {
    const rules = passwordRules(en);
    expect(checkPassword("short1", rules).valid).toBe(false);
    expect(checkPassword("longenough", rules).valid).toBe(false);
    expect(checkPassword("longenough1", rules).valid).toBe(true);
  });

  it("reports each rule separately", () => {
    const rules = passwordRules(bn);
    const result = checkPassword("abcdefgh", rules);
    expect(result.score).toBe(2);
    expect(result.results.find((rule) => rule.id === "number")?.passed).toBe(false);
  });
});

describe("preference sanitising", () => {
  it("keeps only known technologies and removes duplicates", () => {
    const result = sanitizeTechnologies([
      "React",
      "react",
      "Unknown Tech",
      "Next.js",
    ]);
    expect(result).toEqual(["React", "Next.js"]);
  });

  it("ignores non-string values", () => {
    expect(sanitizeTechnologies(["React", 42, null])).toEqual(["React"]);
  });

  it("validates category ids", () => {
    expect(isCategoryIdList(["ai", "web"])).toBe(true);
    expect(isCategoryIdList(["ai", "not-a-category"])).toBe(false);
    expect(isCategoryIdList("ai")).toBe(false);
  });
});
