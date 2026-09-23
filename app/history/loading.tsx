import { Skeleton } from "@/components/ui/skeleton-primitives";
import { Container } from "@/components/ui/container";

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-56 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* Session groups */}
        {Array.from({ length: 3 }).map((_, g) => (
          <div key={g} className="space-y-3">
            <Skeleton className="h-4 w-28" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-card p-4 space-y-2 animate-pulse">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </Container>
    </div>
  );
}
