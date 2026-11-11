import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth/errors";
import { env, isConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * OAuth / recovery callback.
 *
 * Supabase redirects here with `?code=...` (PKCE) after an OAuth sign-in or a
 * password recovery link. The code is exchanged for a session server-side and
 * the session cookies are written to the response.
 *
 * Only same-site paths are accepted as the continuation target, so a crafted
 * `?next=https://evil.example` cannot be used for an open redirect.
 */
export async function GET(request: NextRequest) {
  const e = env();
  const url = request.nextUrl;
  const next = safeRedirectPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const errorCode = url.searchParams.get("error_code") ?? url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (!isConfigured("supabase") || !e.NEXT_PUBLIC_SUPABASE_URL || !e.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(
      new URL("/login?error=not_configured", url.origin),
    );
  }

  if (errorCode) {
    console.error(
      `[auth] callback received an error: ${errorCode} — ${errorDescription ?? "no description"}`,
    );
    const target = new URL("/login", url.origin);
    target.searchParams.set("error", "oauth_failed");
    target.searchParams.set("next", next);
    return NextResponse.redirect(target);
  }

  if (!code) {
    const target = new URL("/login", url.origin);
    target.searchParams.set("error", "missing_code");
    target.searchParams.set("next", next);
    return NextResponse.redirect(target);
  }

  let response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(
    e.NEXT_PUBLIC_SUPABASE_URL,
    e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(new URL(next, url.origin));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth] failed to exchange the callback code:", error.message);
    const target = new URL("/login", url.origin);
    target.searchParams.set("error", "exchange_failed");
    target.searchParams.set("next", next);
    return NextResponse.redirect(target);
  }

  return response;
}
