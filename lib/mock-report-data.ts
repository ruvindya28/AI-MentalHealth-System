import { subDays, format, isSameDay } from "date-fns";
import type { EmotionLogEntry } from "@/lib/contexts/wellness-context";
import { EMOTION_ORDER, type Emotion } from "@/lib/mock-emotion-analyzer";

export interface EmotionDistributionRow {
  emotion: Emotion;
  count: number;
}

export interface TrendPoint {
  date: Date;
  label: string;
  score: number;
}

export interface SessionSummary {
  id: string;
  date: Date;
  durationMinutes: number;
  dominantEmotion: Emotion;
  blurb: string;
}

export interface WellnessInsight {
  id: string;
  text: string;
}

const SEED_BLURBS: Record<Emotion, string> = {
  Calm: "A steady, grounded conversation — you talked through your day without much tension.",
  Hopeful: "You shared some good news and what you're looking forward to this week.",
  Neutral: "A check-in style conversation, mostly reflecting on routine and daily plans.",
  Anxious: "You worked through some worries about an upcoming deadline together.",
  Sad: "A gentler session focused on sitting with a difficult feeling without rushing past it.",
  Angry: "You talked through some frustration and looked at a few ways to release it.",
};

/** Deterministic pseudo-random in [0,1) so this stays stable across renders. */
function seeded(i: number) {
  return (Math.sin(i * 78.233) + 1) / 2;
}

export function getEmotionDistribution(
  entries: EmotionLogEntry[]
): EmotionDistributionRow[] {
  const counts = entries.reduce<Partial<Record<Emotion, number>>>((acc, e) => {
    acc[e.emotion] = (acc[e.emotion] ?? 0) + 1;
    return acc;
  }, {});
  return EMOTION_ORDER.map((emotion) => ({ emotion, count: counts[emotion] ?? 0 }));
}

export function getTrend(entries: EmotionLogEntry[], days = 7): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayEntries = entries.filter((e) => isSameDay(e.timestamp, date));
    let score: number;
    if (dayEntries.length > 0) {
      const crisisFree = dayEntries.filter((e) => e.crisisLevel === "none").length;
      score = Math.round((crisisFree / dayEntries.length) * 100);
    } else {
      // Illustrative fallback so the chart isn't empty before any real data exists.
      score = Math.round(58 + seeded(i + days) * 30);
    }
    points.push({ date, label: format(date, "EEE"), score });
  }
  return points;
}

export function getSessionSummaries(entries: EmotionLogEntry[]): SessionSummary[] {
  if (entries.length > 0) {
    return entries.slice(0, 6).map((entry, i) => ({
      id: entry.id,
      date: entry.timestamp,
      durationMinutes: 4 + Math.round(seeded(i) * 12),
      dominantEmotion: entry.emotion,
      blurb: SEED_BLURBS[entry.emotion],
    }));
  }
  // Illustrative seed sessions for a fresh account with no history yet.
  return EMOTION_ORDER.slice(0, 4).map((emotion, i) => ({
    id: `seed-${i}`,
    date: subDays(new Date(), i * 2 + 1),
    durationMinutes: 6 + Math.round(seeded(i) * 10),
    dominantEmotion: emotion,
    blurb: SEED_BLURBS[emotion],
  }));
}

export function getWellnessInsights(entries: EmotionLogEntry[]): WellnessInsight[] {
  const distribution = getEmotionDistribution(entries);
  const top = distribution.reduce((a, b) => (b.count > a.count ? b : a), distribution[0]);
  const crisisFlagged = entries.filter((e) => e.crisisLevel !== "none").length;

  const insights: WellnessInsight[] = [];
  if (top.count > 0) {
    insights.push({
      id: "top-emotion",
      text: `${top.emotion} has been your most common check-in feeling recently — worth noticing what's contributing to it.`,
    });
  } else {
    insights.push({
      id: "getting-started",
      text: "Once you start logging moods and conversations, your patterns will show up here.",
    });
  }
  insights.push({
    id: "crisis-free",
    text:
      crisisFlagged === 0
        ? "No crisis signals in your recent history — keep up whatever's been working for you."
        : `${crisisFlagged} moment${crisisFlagged === 1 ? "" : "s"} were flagged for extra support recently. Check the Crisis Alerts on your dashboard for details.`,
  });
  insights.push({
    id: "consistency",
    text: "Regular check-ins, even short ones, tend to make trends easier to spot over time.",
  });
  return insights;
}
