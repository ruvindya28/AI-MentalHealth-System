"use client";

import { BrainCircuit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EMOTION_COLORS, type Emotion } from "@/lib/mock-emotion-analyzer";
import type { EmotionLogEntry } from "@/lib/contexts/wellness-context";

interface EmotionTrendsProps {
  entries: EmotionLogEntry[];
}

const EMOTION_ORDER: Emotion[] = [
  "Calm",
  "Hopeful",
  "Neutral",
  "Anxious",
  "Sad",
  "Angry",
];

export function EmotionTrends({ entries }: EmotionTrendsProps) {
  const counts = entries.reduce<Partial<Record<Emotion, number>>>(
    (acc, entry) => {
      acc[entry.emotion] = (acc[entry.emotion] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const rows = EMOTION_ORDER.map((emotion) => ({
    emotion,
    count: counts[emotion] ?? 0,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxCount = rows.length > 0 ? Math.max(...rows.map((r) => r.count)) : 0;

  return (
    <Card className="border-primary/10 h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Emotion Trends</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Preview
          </Badge>
        </div>
        <CardDescription>
          Detected across your conversations this session
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Start a therapy session to see your detected emotions here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.emotion} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span
                    className={cn("font-medium", EMOTION_COLORS[row.emotion].text)}
                  >
                    {row.emotion}
                  </span>
                  <span className="text-muted-foreground">{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      EMOTION_COLORS[row.emotion].bar
                    )}
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
