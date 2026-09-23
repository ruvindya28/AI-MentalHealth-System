import { Skeleton, CardSkeleton } from "@/components/ui/skeleton-primitives";
import { Container } from "@/components/ui/container";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-44" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-card p-5 h-64 animate-pulse bg-muted/30" />
            <div className="rounded-2xl border bg-card p-5 h-48 animate-pulse bg-muted/30" />
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-5 h-48 animate-pulse bg-muted/30" />
            <div className="rounded-2xl border bg-card p-5 h-36 animate-pulse bg-muted/30" />
          </div>
        </div>
      </Container>
    </div>
  );
}
