"use client";

import {
  LogOut,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";

export interface UserMenuUser {
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
}

export function UserMenu({ user }: { user: UserMenuUser | null }) {
  const [open, setOpen] = React.useState(false);

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <a href="/login">লগইন</a>
      </Button>
    );
  }

  const initials = (user.fullName ?? user.email ?? "U")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          aria-label="প্রোফাইল মেনু"
        >
          <Avatar>
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials || "U"}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="normal-case">
          <span className="block truncate text-sm font-semibold text-[var(--foreground)]">
            {user.fullName ?? "Developer"}
          </span>
          <span className="block truncate text-xs font-normal text-[var(--muted-foreground)]">
            {user.email ?? "—"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings">
            <UserIcon className="size-4" />
            প্রোফাইল ও পছন্দ
          </a>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <a href="/admin/sources">
              <ShieldCheck className="size-4" />
              সোর্স ম্যানেজমেন্ট
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOut}>
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="size-4" />
              লগআউট
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SettingsShortcut() {
  return (
    <Button asChild variant="ghost" size="icon" aria-label="সেটিংস">
      <a href="/settings">
        <Settings className="size-4" />
      </a>
    </Button>
  );
}
