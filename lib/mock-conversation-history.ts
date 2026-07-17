import { subDays, subHours } from "date-fns";
import { EMOTION_ORDER, type Emotion, type CrisisLevel } from "@/lib/mock-emotion-analyzer";

export type SessionType = "chat" | "voice";

export interface ConversationSession {
  id: string;
  date: Date;
  type: SessionType;
  durationMinutes: number;
  messageCount: number;
  dominantEmotion: Emotion;
  crisisLevel: CrisisLevel;
  title: string;
}

const TITLES: Record<Emotion, string> = {
  Calm: "A quiet check-in",
  Hopeful: "Looking ahead to next week",
  Neutral: "Daily routine catch-up",
  Anxious: "Working through some worries",
  Sad: "Sitting with a hard day",
  Angry: "Talking through frustration",
};

function seeded(i: number) {
  return (Math.sin(i * 45.164) + 1) / 2;
}

/** Illustrative mock history — no backend session store exists yet. */
export function getMockConversationHistory(): ConversationSession[] {
  const sessions: ConversationSession[] = [];
  const crisisLevels: CrisisLevel[] = ["none", "none", "none", "low", "none", "medium", "none"];

  for (let i = 0; i < 12; i++) {
    const emotion = EMOTION_ORDER[i % EMOTION_ORDER.length];
    const type: SessionType = i % 3 === 0 ? "voice" : "chat";
    const daysAgo = Math.floor(i * 1.8);
    const date = subHours(subDays(new Date(), daysAgo), Math.round(seeded(i) * 20));

    sessions.push({
      id: `session-${i}`,
      date,
      type,
      durationMinutes: 4 + Math.round(seeded(i + 1) * 18),
      messageCount: type === "chat" ? 6 + Math.round(seeded(i + 2) * 20) : 0,
      dominantEmotion: emotion,
      crisisLevel: crisisLevels[i % crisisLevels.length],
      title: TITLES[emotion],
    });
  }

  return sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
}
