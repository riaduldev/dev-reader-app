import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env, isConfigured } from "@/lib/env";

/**
 * Shown when required credentials are missing. It documents exactly what has to
 * be configured instead of rendering an empty dashboard.
 */
export function SetupNotice({ compact = false }: { compact?: boolean }) {
  const missing: string[] = [];
  if (!isConfigured("supabase")) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!isConfigured("supabaseAdmin")) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!isConfigured("openai")) {
    missing.push("OPENAI_API_KEY");
  }

  if (missing.length === 0) return null;

  return (
    <Card className="border-[var(--warning)]/40 bg-[var(--warning-soft)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--warning)]">
          <AlertTriangle className="size-4" />
          সেটআপ প্রয়োজন — কিছু কনফিগারেশন অনুপস্থিত
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
        <p>
          DevPulse-এর ডেটা স্তরগুলো Supabase PostgreSQL-এ থাকে, আর AI বিশ্লেষণের জন্য
          OpenAI API প্রয়োজন। নিচের ভ্যারিয়েবলগুলো <code>.env.local</code> ফাইলে যোগ করে
          ডেভেলপমেন্ট সার্ভার রিস্টার্ট করুন:
        </p>
        <ul className="list-inside list-disc space-y-1 font-mono text-xs">
          {missing.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
        {!compact && (
          <p className="text-xs">
            ডেটাবেস সিডিং: <code className="font-mono">supabase/migrations/0001_init.sql</code>{" "}
            ফাইলটি Supabase SQL Editor-এ চালান। বিস্তারিত নির্দেশনা{" "}
            <code className="font-mono">README.md</code> ফাইলে আছে।
          </p>
        )}
        <p className="text-xs opacity-70">
          বর্তমান মোড:{" "}
          <span className="font-mono">
            {env().NEXT_PUBLIC_SUPABASE_URL ? "database configured" : "no database"}
          </span>{" "}
          — কোনো ডেমো বা কাল্ট্রাভ ডেটা দেখানো হচ্ছে না।
        </p>
      </CardContent>
    </Card>
  );
}
