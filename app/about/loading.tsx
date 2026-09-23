import { Skeleton } from "@/components/ui/skeleton-primitives";
import { Container } from "@/components/ui/container";

export default function AboutLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 space-y-10">
        <div className="space-y-3">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 space-y-2 animate-pulse">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
