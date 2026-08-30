import { subDays, format, isSameDay } from "date-fns";
import type { EmotionLogEntry } from "@/lib/emotion-log";
import { EMOTION_ORDER, type Emotion } from "@/lib/mock-emotion-analyzer";

export interface EmotionDistributionRow {
  emotion: Emotion;
  count: number;
}

export interface TrendPoint {
  date: Date;
  label: string;
  score: number | null;
  checkInCount?: number;
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

export interface MoodLogItem {
  moodScore: number;
  createdAt: string | Date;
  note?: string;
}

export interface RawTherapySessionItem {
  _id: string;
  type?: string;
  createdAt: string | Date;
  messages: {
    role: "user" | "assistant";
    content: string;
    timestamp: string | Date;
    emotion?: Emotion;
    confidence?: number;
    crisisLevel?: "none" | "low" | "medium" | "high";
  }[];
}

/**
 * Calculates distribution of emotions from real analyzed messages.
 */
export function getEmotionDistribution(
  entries: EmotionLogEntry[]
): EmotionDistributionRow[] {
  const counts = entries.reduce<Partial<Record<Emotion, number>>>((acc, e) => {
    if (e.emotion) {
      acc[e.emotion] = (acc[e.emotion] ?? 0) + 1;
    }
    return acc;
  }, {});
  return EMOTION_ORDER.map((emotion) => ({ emotion, count: counts[emotion] ?? 0 }));
}

/**
 * Calculates 7-day emotional stability trend from 100% REAL user data:
 * Blends real mood check-in scores (/api/mood) and real crisis-free calm moments (/api/therapy).
 * Returns score: null for days where the user recorded no data (NO fake math numbers).
 */
export function getTrend(
  emotionEntries: EmotionLogEntry[],
  moodEntries: MoodLogItem[] = [],
  days = 7
): TrendPoint[] {
  const points: TrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayEmotions = emotionEntries.filter((e) => isSameDay(new Date(e.timestamp), date));
    const dayMoods = moodEntries.filter((m) => isSameDay(new Date(m.createdAt), date));

    const totalCheckIns = dayEmotions.length + dayMoods.length;

    if (totalCheckIns === 0) {
      points.push({
        date,
        label: format(date, "EEE"),
        score: null,
        checkInCount: 0,
      });
      continue;
    }

    let dayScore: number;
    if (dayMoods.length > 0 && dayEmotions.length > 0) {
      const avgMood = dayMoods.reduce((sum, m) => sum + m.moodScore, 0) / dayMoods.length;
      const crisisFree = dayEmotions.filter((e) => e.crisisLevel === "none").length;
      const calmScore = (crisisFree / dayEmotions.length) * 100;
      dayScore = Math.round(avgMood * 0.5 + calmScore * 0.5);
    } else if (dayMoods.length > 0) {
      dayScore = Math.round(dayMoods.reduce((sum, m) => sum + m.moodScore, 0) / dayMoods.length);
    } else {
      const crisisFree = dayEmotions.filter((e) => e.crisisLevel === "none").length;
      dayScore = Math.round((crisisFree / dayEmotions.length) * 100);
    }

    points.push({
      date,
      label: format(date, "EEE"),
      score: Math.min(100, Math.max(0, dayScore)),
      checkInCount: totalCheckIns,
    });
  }

  return points;
}

/**
 * Summarizes real user therapy sessions from MongoDB.
 */
export function getSessionSummaries(
  rawSessions: RawTherapySessionItem[],
  fallbackEntries: EmotionLogEntry[] = []
): SessionSummary[] {
  if (rawSessions && rawSessions.length > 0) {
    return rawSessions.slice(0, 10).map((session) => {
      const messages = session.messages || [];
      const userMessages = messages.filter((m) => m.role === "user");

      const emotionCounts = messages.reduce<Partial<Record<Emotion, number>>>((acc, m) => {
        if (m.emotion) acc[m.emotion] = (acc[m.emotion] ?? 0) + 1;
        return acc;
      }, {});

      const dominantEmotion =
        (Object.entries(emotionCounts) as [Emotion, number][]).reduce<[Emotion, number] | null>(
          (best, entry) => (!best || entry[1] > best[1] ? entry : best),
          null
        )?.[0] ?? "Neutral";

      const first = messages[0] ? new Date(messages[0].timestamp) : new Date(session.createdAt);
      const last = messages.length > 0 ? new Date(messages[messages.length - 1].timestamp) : first;
      const durationMinutes = Math.max(1, Math.round((last.getTime() - first.getTime()) / 60000));

      const firstUserMsg = userMessages[0]?.content;
      const blurb = firstUserMsg
        ? firstUserMsg.length > 90
          ? `${firstUserMsg.slice(0, 90)}...`
          : firstUserMsg
        : "Therapy check-in session";

      return {
        id: session._id,
        date: new Date(session.createdAt),
        durationMinutes,
        dominantEmotion,
        blurb,
      };
    });
  }

  if (fallbackEntries.length > 0) {
    return fallbackEntries.slice(0, 6).map((entry) => ({
      id: entry.id,
      date: entry.timestamp,
      durationMinutes: 5,
      dominantEmotion: entry.emotion,
      blurb: `Logged emotional check-in reflecting ${entry.emotion.toLowerCase()} feelings.`,
    }));
  }

  return [];
}

/**
 * Generates personalized insights purely based on real user activity.
 */
export function getWellnessInsights(
  entries: EmotionLogEntry[],
  moodEntries: MoodLogItem[] = []
): WellnessInsight[] {
  const distribution = getEmotionDistribution(entries);
  const top = distribution.reduce((a, b) => (b.count > a.count ? b : a), distribution[0]);
  const crisisFlagged = entries.filter((e) => e.crisisLevel !== "none").length;

  const totalEntries = entries.length + moodEntries.length;

  if (totalEntries === 0) {
    return [
      {
        id: "getting-started",
        text: "Welcome to your report. Once you start logging moods and conversations, your emotional trends will appear here.",
      },
      {
        id: "tracking-tip",
        text: "Daily check-ins help MindCare identify what routines and thoughts support your emotional well-being.",
      },
      {
        id: "privacy-notice",
        text: "Your conversations and emotional logs are completely confidential and encrypted.",
      },
    ];
  }

  const insights: WellnessInsight[] = [];

  if (top && top.count > 0) {
    insights.push({
      id: "top-emotion",
      text: `${top.emotion} has been your most common check-in feeling recently (${top.count} time${top.count === 1 ? "" : "s"}) — worth noticing what's contributing to it.`,
    });
  }

  if (moodEntries.length > 0) {
    const avgMood = Math.round(moodEntries.reduce((s, m) => s + m.moodScore, 0) / moodEntries.length);
    insights.push({
      id: "avg-mood",
      text: `Your average logged mood is ${avgMood}/100 across ${moodEntries.length} check-in${moodEntries.length === 1 ? "" : "s"}.`,
    });
  }

  insights.push({
    id: "crisis-status",
    text:
      crisisFlagged === 0
        ? "No crisis signals detected in your recent history — keep up whatever's been supporting your peace."
        : `${crisisFlagged} moment${crisisFlagged === 1 ? "" : "s"} were flagged for extra care recently. Consider scheduling a quiet moment or reviewing supportive exercises.`,
  });

  insights.push({
    id: "consistency",
    text: `${totalEntries} total emotional moments logged. Regular check-ins make subtle emotional shifts easier to spot.`,
  });

  return insights;
}
