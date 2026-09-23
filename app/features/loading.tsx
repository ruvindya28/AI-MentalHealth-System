import { Skeleton } from "@/components/ui/skeleton-primitives";
import { Container } from "@/components/ui/container";

export default function FeaturesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 space-y-12">
        <div className="text-center space-y-3">
          <Skeleton className="h-10 w-72 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 space-y-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-muted/60" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
