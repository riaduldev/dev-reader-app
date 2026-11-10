import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--accent-soft)] text-[var(--accent)]",
        secondary:
          "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-foreground)]",
        outline:
          "border-[var(--border)] text-[var(--muted-foreground)]",
        success:
          "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
        warning:
          "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
        danger:
          "border-transparent bg-[var(--danger-soft)] text-[var(--danger)]",
        info: "border-transparent bg-[var(--info-soft)] text-[var(--info)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
