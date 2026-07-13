"use client";

import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CRISIS_COLORS,
  EMOTION_COLORS,
  type CrisisLevel,
  type Emotion,
} from "@/lib/mock-emotion-analyzer";

interface LiveAnalysisPanelProps {
  latestEmotion: Emotion | null;
  latestConfidence: number | null;
  crisisLevel: CrisisLevel;
  emotionCounts: Partial<Record<Emotion, number>>;
}

const CRISIS_STEPS: CrisisLevel[] = ["none", "low", "medium", "high"];

export function LiveAnalysisPanel({
  latestEmotion,
  latestConfidence,
  crisisLevel,
  emotionCounts,
}: LiveAnalysisPanelProps) {
  const crisisIndex = CRISIS_STEPS.indexOf(crisisLevel);
  const emotionEntries = Object.entries(emotionCounts) as [Emotion, number][];

  return (
    <Card className="border-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Live Analysis</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Preview
          </Badge>
        </div>
        <CardDescription>Detected from your messages this session</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Current Emotion
          </p>
          {latestEmotion ? (
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-lg font-semibold",
                  EMOTION_COLORS[latestEmotion].text
                )}
              >
                {latestEmotion}
              </span>
              <span className="text-sm text-muted-foreground">
                {latestConfidence}% confidence
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Send a message to see live analysis
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Crisis Risk
          </p>
          <div className="flex items-center gap-1.5">
            {CRISIS_STEPS.map((step, i) => (
              <div
                key={step}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  i <= crisisIndex ? CRISIS_COLORS[crisisLevel].bg : "bg-muted"
                )}
              />
            ))}
          </div>
          <p
            className={cn(
              "text-sm font-medium flex items-center gap-1.5",
              CRISIS_COLORS[crisisLevel].text
            )}
          >
            {crisisLevel !== "none" && <AlertTriangle className="w-3.5 h-3.5" />}
            {CRISIS_COLORS[crisisLevel].label}
          </p>
        </div>

        {emotionEntries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              This Session
            </p>
            <div className="space-y-1.5">
              {emotionEntries.map(([emotion, count]) => (
                <div key={emotion} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn("w-2 h-2 rounded-full", EMOTION_COLORS[emotion].bar)}
                  />
                  <span className="flex-1">{emotion}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          This is a heuristic preview, not a clinical diagnosis. Full model
          integration is in progress.
        </p>
      </CardContent>
    </Card>
  );
}
