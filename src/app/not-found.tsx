import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-5xl font-semibold tracking-tight">404</p>
          <div className="space-y-1">
            <p className="font-medium">পেজটি পাওয়া যায়নি</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              আপনি যে পেজটি খুঁজছেন সেটি সরানো হয়েছে বা কখনো ছিল না।
            </p>
          </div>
          <Button asChild>
            <Link href="/">ড্যাশবোর্ডে ফিরে যান</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
