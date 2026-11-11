import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server-action level tests for the authentication flows.
 *
 * Supabase, the request headers and the dictionary are mocked so the actions
 * can be exercised without a network or a database.
 */

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const resetPasswordForEmail = vi.fn();
const updateUser = vi.fn();
const signInWithOAuth = vi.fn();
const getAuthSettings = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      signInWithPassword,
      signUp,
      resetPasswordForEmail,
      updateUser,
      signInWithOAuth,
      signOut: vi.fn(),
    },
  }),
  isSupabaseConfigured: () => true,
  isConfigurationError: () => false,
  createServiceSupabaseClient: async () => ({ auth: { admin: {} } }),
  createReadClient: async () => ({}),
}));

vi.mock("@/lib/i18n/server", async () => {
  const { bn } = await import("@/lib/i18n/dictionaries/bn");
  return {
    getDictionaryForRequest: async () => bn,
    getLanguage: async () => "bn",
    dictionaryFor: () => bn,
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => undefined,
    getAll: () => [],
  }),
  headers: async () => new Headers({ host: "localhost:3000" }),
}));

vi.mock("@/lib/auth/settings", () => ({
  getAuthSettings: () => getAuthSettings(),
}));

const {
  loginAction,
  signupAction,
  signInWithOAuthAction,
  requestPasswordResetAction,
} = await import("@/lib/auth/actions");

const emptyState = { error: null, message: null };

beforeEach(() => {
  vi.clearAllMocks();
  getAuthSettings.mockResolvedValue({
    email: true,
    google: false,
    github: false,
    autoconfirm: false,
    signupEnabled: true,
    detected: true,
  });
});

describe("loginAction", () => {
  it("rejects an invalid email address", async () => {
    const result = await loginAction(emptyState, form({ email: "nope" }));
    expect(result.error).toBeTruthy();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("rejects a too short password", async () => {
    const result = await loginAction(emptyState, form({ email: "a@b.co", password: "short" }));
    expect(result.error).toBeTruthy();
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns a friendly message for invalid credentials", async () => {
    signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials", code: "invalid_credentials" },
      data: { user: null },
    });

    const result = await loginAction(
      emptyState,
      form({ email: "user@example.com", password: "password1" }),
    );
    expect(result.error).toContain("ইমেইল বা পাসওয়ার্ড");
    expect(result.error).not.toContain("Invalid login credentials");
  });
});

describe("signupAction", () => {
  it("rejects a weak password", async () => {
    const result = await signupAction(
      emptyState,
      form({
        email: "user@example.com",
        password: "onlyletters",
        full_name: "Test User",
      }),
    );
    expect(result.error).toContain("সংখ্যা");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("rejects a short name", async () => {
    const result = await signupAction(
      emptyState,
      form({
        email: "user@example.com",
        password: "password1",
        full_name: "x",
      }),
    );
    expect(result.error).toBeTruthy();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("asks the user to confirm their email when no session is returned", async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    const result = await signupAction(
      emptyState,
      form({
        email: "user@example.com",
        password: "password1",
        full_name: "Test User",
      }),
    );
    expect(result.error).toBeNull();
    expect(result.message).toContain("ইমেইল যাচাই");
  });

  it("reports an already registered email without leaking the raw error", async () => {
    signUp.mockResolvedValue({
      data: { session: null },
      error: { message: "User already registered", code: "user_already_exists" },
    });
    const result = await signupAction(
      emptyState,
      form({
        email: "user@example.com",
        password: "password1",
        full_name: "Test User",
      }),
    );
    expect(result.error).toContain("আগেই একটি অ্যাকাউন্ট");
    expect(result.error).not.toContain("already registered");
  });
});

describe("signInWithOAuthAction", () => {
  it("rejects an unknown provider", async () => {
    const result = await signInWithOAuthAction(
      emptyState,
      form({ provider: "facebook" }),
    );
    expect(result.error).toBeTruthy();
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it("explains that the provider is not enabled instead of failing silently", async () => {
    const result = await signInWithOAuthAction(
      emptyState,
      form({ provider: "google" }),
    );
    expect(result.error).toContain("Google");
    expect(result.error).toContain("চালু করা হয়নি");
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it("redirects to the provider instead of swallowing the redirect", async () => {
    getAuthSettings.mockResolvedValue({
      email: true,
      google: true,
      github: true,
      autoconfirm: false,
      signupEnabled: true,
      detected: true,
    });
    signInWithOAuth.mockResolvedValue({
      data: { url: "https://provider.example/authorize" },
      error: null,
    });

    await expect(
      signInWithOAuthAction(emptyState, form({ provider: "github" })),
    ).rejects.toThrow();

    expect(signInWithOAuth).toHaveBeenCalledTimes(1);
    const options = signInWithOAuth.mock.calls[0][0].options as {
      redirectTo: string;
    };
    expect(options.redirectTo).toContain("/auth/callback?next=");
  });
});

describe("requestPasswordResetAction", () => {
  it("validates the email address", async () => {
    const result = await requestPasswordResetAction(emptyState, form({ email: "" }));
    expect(result.error).toBeTruthy();
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("always answers with the same neutral message", async () => {
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    const result = await requestPasswordResetAction(
      emptyState,
      form({ email: "someone@example.com" }),
    );
    expect(result.error).toBeNull();
    expect(result.message).toContain("যদি এই ইমেইলে অ্যাকাউন্ট থাকে");
  });
});

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }
  return data;
}
