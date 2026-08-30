import type { EmotionLogEntry } from "@/lib/emotion-log";

/**
 * Illustrative mock wellness score — blends today's mood score, the share of
 * logged moments that were crisis-free, and activity completion. Returns null
 * if the user has not logged any mood or session data yet.
 */
export function computeWellnessScore({
  moodScore,
  emotionLog,
  completionRate,
}: {
  moodScore: number | null;
  emotionLog: EmotionLogEntry[];
  completionRate: number;
}): number | null {
  const hasData = moodScore !== null || emotionLog.length > 0;
  if (!hasData) return null;

  const moodComponent = moodScore ?? 65;
  const crisisFlagged = emotionLog.filter((e) => e.crisisLevel !== "none").length;
  const calmShare =
    emotionLog.length === 0 ? 1 : 1 - crisisFlagged / emotionLog.length;
  const calmComponent = calmShare * 100;

  const score = moodComponent * 0.5 + calmComponent * 0.3 + completionRate * 0.2;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function wellnessScoreLabel(score: number | null): string {
  if (score === null) return "Awaiting check-in";
  if (score >= 80) return "Thriving";
  if (score >= 60) return "Steady";
  if (score >= 40) return "Getting by";
  return "Needs care";
}
