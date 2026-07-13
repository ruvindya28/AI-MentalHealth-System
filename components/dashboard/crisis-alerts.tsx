"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CRISIS_COLORS } from "@/lib/mock-emotion-analyzer";
import type { EmotionLogEntry } from "@/lib/contexts/wellness-context";

interface CrisisAlertsProps {
  entries: EmotionLogEntry[];
}

export function CrisisAlerts({ entries }: CrisisAlertsProps) {
  const flagged = entries.filter((entry) => entry.crisisLevel !== "none");

  return (
    <Card className="border-primary/10 h-full">
      <CardHeader>
        <CardTitle>Crisis Alerts</CardTitle>
        <CardDescription>Moments flagged for extra support</CardDescription>
      </CardHeader>
      <CardContent>
        {flagged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              No crisis signals detected. We&apos;ll flag anything concerning
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {flagged.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle
                    className={cn("w-4 h-4", CRISIS_COLORS[entry.crisisLevel].text)}
                  />
                  <p className="text-sm">
                    {format(entry.timestamp, "MMM d, h:mm a")}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    CRISIS_COLORS[entry.crisisLevel].text
                  )}
                >
                  {CRISIS_COLORS[entry.crisisLevel].label}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
