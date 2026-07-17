"use client";

import { cn } from "@/lib/utils";
import { EMOTION_COLORS } from "@/lib/mock-emotion-analyzer";
import type { EmotionDistributionRow } from "@/lib/mock-report-data";

interface EmotionDistributionBarsProps {
  rows: EmotionDistributionRow[];
  className?: string;
}

export function EmotionDistributionBars({ rows, className }: EmotionDistributionBarsProps) {
  const visible = rows.filter((r) => r.count > 0);
  const maxCount = Math.max(1, ...visible.map((r) => r.count));

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No emotion data logged yet.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {visible.map((row) => (
        <div key={row.emotion} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <span className={cn("h-2 w-2 rounded-full", EMOTION_COLORS[row.emotion].dot)} />
              {row.emotion}
            </span>
            <span className="text-muted-foreground">{row.count}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", EMOTION_COLORS[row.emotion].bar)}
              style={{ width: `${(row.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
