"use client";

import type { AnchorHTMLAttributes } from "react";
import * as React from "react";

/**
 * An external link to the original article. Opening it records the article in
 * the signed-in user's reading history. Failures are ignored so the link
 * always works.
 */
export function ArticleLink({
  articleId,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { articleId: string }) {
  const handleClick = () => {
    void fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
      keepalive: true,
    }).catch(() => {
      // Ignore — the article stays readable even if tracking fails.
    });
  };

  return (
    <a onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
