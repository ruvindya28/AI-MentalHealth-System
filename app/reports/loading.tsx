import { Skeleton, CardSkeleton } from "@/components/ui/skeleton-primitives";
import { Container } from "@/components/ui/container";

export default function ReportsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-card p-5 h-56 animate-pulse bg-muted/30" />
          <div className="rounded-2xl border bg-card p-5 h-56 animate-pulse bg-muted/30" />
        </div>

        {/* Session list */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 animate-pulse bg-muted/20 h-20" />
          ))}
        </div>
      </Container>
    </div>
  );
}
