"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n/client";

export function DeleteAccountCard() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const deleteAccount = async () => {
    setPending(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? t.errors.generic);
      toast.success(t.settings.deleteAccountDone);
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.errors.generic);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          {t.settings.deleteAccount}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.settings.deleteAccountConfirm}</DialogTitle>
          <DialogDescription>
            {t.settings.deleteAccountWarning}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            {t.common.cancel}
          </Button>
          <Button variant="destructive" onClick={deleteAccount} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t.admin.deleteSource}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


