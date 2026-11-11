import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; href: string };
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted-foreground)]">
          <Icon className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="max-w-md text-sm text-[var(--muted-foreground)]">{description}</p>
          )}
        </div>
        {action && (
          <Button asChild variant="outline" size="sm">
            <a href={action.href}>{action.label}</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <Card className="border-[var(--danger)]/40">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm font-medium text-[var(--danger)]">{title}</p>
        {description && (
          <p className="max-w-md text-sm text-[var(--muted-foreground)]">{description}</p>
        )}
        {action && (
          <Button asChild variant="outline" size="sm">
            <a href={action.href}>{action.label}</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
