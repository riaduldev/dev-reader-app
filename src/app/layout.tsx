import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { AppToaster } from "@/components/ui/toaster";
import { themeInitScript } from "@/components/theme/theme-script";
import { LanguageProvider } from "@/lib/i18n/client";
import { getDictionaryForRequest, getLanguage } from "@/lib/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "DevReaderHub",
    template: `%s · DevReaderHub`,
  },
  description:
    "DevReaderHub collects developer technology news from reliable sources, organises it by category and adds optional AI-powered Bangla analysis.",
  applicationName: "DevReaderHub",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

/** Social preview metadata follows the interface language. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionaryForRequest();

  return {
    ...baseMetadata,
    openGraph: {
      title: `DevReaderHub — ${t.app.tagline}`,
      description: t.app.description,
      images: ["/dev-reader-hub.jpg"],
      type: "website",
      siteName: "DevReaderHub",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090c" },
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The interface language is stored in a cookie so the server renders the
  // correct locale on the first paint (no flash, no hydration mismatch).
  const language = await getLanguage();

  return (
    <html lang={language} className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh bg-[var(--background)] text-[var(--foreground)] antialiased">
        <LanguageProvider initialLanguage={language}>{children}</LanguageProvider>
        <AppToaster />
      </body>
    </html>
  );
}
