import { ArticleListSkeleton } from "@/components/news/article-card";
import { Card, CardContent } from "@/components/ui/card";

/** Shared loading skeleton for the dashboard-style pages. */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-7 w-56 rounded-md" />
        <div className="skeleton h-4 w-80 rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4">
            <CardContent className="space-y-2 p-0">
              <div className="skeleton h-3 w-24 rounded-md" />
              <div className="skeleton h-7 w-16 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
      <ArticleListSkeleton count={4} />
    </div>
  );
}
