import {
  Bot,
  Bookmark,
  Briefcase,
  Building2,
  Cloud,
  Globe,
  History,
  LayoutDashboard,
  Newspaper,
  Settings,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/types";

export interface NavItem {
  href: string;
  /** Key inside `dictionary.nav` used for the label. */
  labelKey: keyof Dictionary["nav"];
  icon: LucideIcon;
  group: "primary" | "personal" | "admin";
  descriptionKey?: keyof Dictionary["nav"];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "overview", icon: LayoutDashboard, group: "primary" },
  { href: "/news", labelKey: "latest", icon: Newspaper, group: "primary" },
  { href: "/category/ai", labelKey: "ai", icon: Bot, group: "primary" },
  { href: "/category/web", labelKey: "web", icon: Globe, group: "primary" },
  {
    href: "/category/opensource",
    labelKey: "opensource",
    icon: Terminal,
    group: "primary",
  },
  {
    href: "/category/security",
    labelKey: "security",
    icon: ShieldCheck,
    group: "primary",
  },
  { href: "/category/cloud", labelKey: "cloud", icon: Cloud, group: "primary" },
  {
    href: "/category/industry",
    labelKey: "industry",
    icon: Building2,
    group: "primary",
  },
  { href: "/jobs", labelKey: "jobs", icon: Briefcase, group: "primary" },
  { href: "/saved", labelKey: "saved", icon: Bookmark, group: "personal" },
  { href: "/history", labelKey: "history", icon: History, group: "personal" },
  { href: "/settings", labelKey: "settings", icon: Settings, group: "personal" },
];

export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin/sources",
  labelKey: "sources",
  icon: ShieldCheck,
  group: "admin",
};
