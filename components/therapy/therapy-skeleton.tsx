import { Skeleton } from "@/components/ui/skeleton-primitives";
import { Bot, Plus, Send } from "lucide-react";

export function TherapySkeleton() {
  return (
    <div className="relative max-w-7xl mx-auto px-4 pb-12 sm:pb-16">
      <div className="flex h-[calc(100vh-8.5rem)] min-h-150 mt-20 pt-3 mb-6 sm:mb-8 gap-0 overflow-hidden">
        <div className="flex flex-1 rounded-2xl border shadow-sm overflow-hidden bg-card">
          {/* ── Left sidebar skeleton ── */}
          <aside className="relative hidden md:flex flex-col shrink-0 border-r bg-card/60 w-64 h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b shrink-0">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>

            {/* New chat button placeholder */}
            <div className="p-2 border-b shrink-0">
              <div className="h-9 w-full rounded-xl bg-primary/10 border border-primary/20 flex items-center px-3 gap-2">
                <Plus className="w-4 h-4 text-primary/40" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            </div>

            {/* Session items */}
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-transparent bg-muted/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-3 w-36" />
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Skeleton className="h-4 w-14 rounded-full" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Center chat area skeleton ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-card">
            {/* Chat top bar */}
            <div className="flex items-center gap-2 p-4 border-b shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary/50 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="h-8 w-24 rounded-full border flex items-center justify-center gap-1.5 px-3">
                <Plus className="w-3.5 h-3.5 text-muted-foreground/40" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>

            {/* Chat conversation skeleton */}
            <div className="flex-1 p-6 space-y-6 overflow-hidden">
              {/* Assistant Message */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border bg-muted/20 p-4 space-y-2.5">
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>

              {/* User Message */}
              <div className="flex items-start justify-end gap-4 ml-auto max-w-xl">
                <div className="space-y-2 flex-1 flex flex-col items-end">
                  <Skeleton className="h-4 w-16" />
                  <div className="rounded-2xl rounded-tr-sm bg-primary/15 p-4 space-y-2.5 w-full">
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-muted/60 shrink-0 mt-0.5" />
              </div>

              {/* Assistant Message 2 */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border bg-muted/20 p-4 space-y-2.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Chat bottom input bar */}
            <div className="p-4 border-t bg-card shrink-0">
              <div className="relative flex items-center">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <div className="absolute right-2 bottom-4 h-9 w-9 rounded-xl bg-primary/30 flex items-center justify-center">
                  <Send className="w-4 h-4 text-primary-foreground/40" />
                </div>
              </div>
              <div className="mt-2 flex justify-center">
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>

          {/* ── Right panel: Live Analysis skeleton ── */}
          <div className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col gap-4 p-4 border-l overflow-y-auto bg-card/50">
            <div className="rounded-2xl border border-primary/10 bg-card p-5 space-y-5">
              {/* Header */}
              <div className="space-y-1.5 pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>

              {/* Current Emotion */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Crisis Risk */}
              <div className="space-y-2 pt-2 border-t">
                <Skeleton className="h-3 w-20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>

              {/* This Session Breakdown */}
              <div className="space-y-2 pt-2 border-t">
                <Skeleton className="h-3 w-24" />
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-3.5 w-6" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3.5 w-14" />
                    <Skeleton className="h-3.5 w-6" />
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="pt-2 border-t">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5 mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
