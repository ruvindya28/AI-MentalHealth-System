import type { CrisisLevel, Emotion } from "@/lib/mock-emotion-analyzer";

export interface EmotionLogEntry {
    id: string;
    timestamp: Date;
    emotion: Emotion;
    confidence: number;
    crisisLevel: CrisisLevel;
}

interface RawMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    emotion?: Emotion;
    confidence?: number;
    crisisLevel?: CrisisLevel;
}

interface RawSession {
    _id: string;
    messages: RawMessage[];
}

/** Flattens persisted therapy session messages into a flat, timestamp-sorted
 * emotion log — only messages that were actually analyzed (user messages)
 * carry an `emotion`, so anything else is skipped. */
export function sessionsToEmotionLog(sessions: RawSession[]): EmotionLogEntry[] {
    const entries: EmotionLogEntry[] = [];

    for (const session of sessions) {
        session.messages.forEach((message, index) => {
            if (!message.emotion) return;
            entries.push({
                id: `${session._id}-${index}`,
                timestamp: new Date(message.timestamp),
                emotion: message.emotion,
                confidence: message.confidence ?? 0,
                crisisLevel: message.crisisLevel ?? "none",
            });
        });
    }

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
