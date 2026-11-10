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

import { strings } from "@/lib/i18n";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "primary" | "personal" | "admin";
  description?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: strings.nav.overview,
    icon: LayoutDashboard,
    group: "primary",
    description: "ড্যাশবোর্ড",
  },
  {
    href: "/news",
    label: strings.nav.latest,
    icon: Newspaper,
    group: "primary",
    description: "সর্বশেষ সব খবর",
  },
  {
    href: "/category/ai",
    label: strings.nav.ai,
    icon: Bot,
    group: "primary",
    description: "LLM, AI Agents, Machine Learning",
  },
  {
    href: "/category/web",
    label: strings.nav.web,
    icon: Globe,
    group: "primary",
    description: "JavaScript, React, Next.js, Node.js",
  },
  {
    href: "/category/opensource",
    label: strings.nav.opensource,
    icon: Terminal,
    group: "primary",
    description: "GitHub, libraries, developer tools",
  },
  {
    href: "/category/security",
    label: strings.nav.security,
    icon: ShieldCheck,
    group: "primary",
    description: "CVE, CISA, NVD, vulnerabilities",
  },
  {
    href: "/category/cloud",
    label: strings.nav.cloud,
    icon: Cloud,
    group: "primary",
    description: "AWS, Azure, Docker, Kubernetes",
  },
  {
    href: "/category/industry",
    label: strings.nav.industry,
    icon: Building2,
    group: "primary",
    description: "কোম্পানি, উদ্ভাবন ও শিল্প",
  },
  {
    href: "/jobs",
    label: strings.nav.jobs,
    icon: Briefcase,
    group: "primary",
    description: "Remote ও software engineering jobs",
  },
  {
    href: "/saved",
    label: strings.nav.saved,
    icon: Bookmark,
    group: "personal",
    description: "আপনার সংরক্ষিত নিবন্ধ",
  },
  {
    href: "/history",
    label: strings.nav.history,
    icon: History,
    group: "personal",
    description: "যা আপনি পড়েছেন",
  },
  {
    href: "/settings",
    label: strings.nav.settings,
    icon: Settings,
    group: "personal",
    description: "অ্যাকাউন্ট ও পছন্দ",
  },
];

export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin/sources",
  label: strings.nav.sources,
  icon: ShieldCheck,
  group: "admin",
  description: "সোর্স যোগ, টেস্ট ও সিঙ্ক",
};
