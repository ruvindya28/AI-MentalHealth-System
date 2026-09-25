import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton-primitives";

export default function VoiceStudioLoading() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <Container className="space-y-6">
        <div className="flex items-center justify-between pb-5 border-b">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-44 rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Skeleton className="h-[600px] w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        </div>
      </Container>
    </div>
  );
}
