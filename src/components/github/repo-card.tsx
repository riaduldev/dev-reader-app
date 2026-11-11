"use client";

import { GitFork, GitPullRequest, Scale, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLanguage, useT } from "@/lib/i18n/client";
import type { GithubRepoView } from "@/lib/db/github";
import { formatNumber, formatRelativeTime } from "@/lib/utils";

export function GithubRepoCard({ repo }: { repo: GithubRepoView }) {
  const t = useT();
  const [language] = useLanguage();

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-semibold transition-colors hover:text-[var(--accent)]"
          >
            {repo.full_name}
          </a>
          {repo.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
              {repo.description}
            </p>
          )}
        </div>
        <Badge variant="info" title={t.github.scoreTitle}>
          {repo.score.toFixed(1)}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5" />
          {formatNumber(repo.stars, language)}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-3.5" />
          {formatNumber(repo.forks, language)}
        </span>
        {repo.language && (
          <span className="inline-flex items-center gap-1">
            <GitPullRequest className="size-3.5" />
            {repo.language}
          </span>
        )}
        {repo.license && (
          <span className="inline-flex items-center gap-1">
            <Scale className="size-3.5" />
            {repo.license}
          </span>
        )}
        {repo.githubPushedAt && (
          <span className="ml-auto">
            {formatRelativeTime(repo.githubPushedAt, language)}
          </span>
        )}
      </div>
    </Card>
  );
}
