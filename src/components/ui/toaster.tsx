"use client";

import * as React from "react";
import { Toaster } from "sonner";

/** Toast host that follows the DevReaderHub theme instead of the OS preference. */
export function AppToaster() {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    const apply = () => {
      setTheme(
        document.documentElement.classList.contains("light") ? "light" : "dark",
      );
    };
    apply();
    window.addEventListener("devreaderhub-theme-change", apply);
    return () => window.removeEventListener("devreaderhub-theme-change", apply);
  }, []);

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)]",
        },
      }}
    />
  );
}
