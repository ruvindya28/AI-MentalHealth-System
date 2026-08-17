import type { Emotion } from "@/lib/mock-emotion-analyzer";

export interface CallRecord {
    id: string;
    startedAt: Date;
    durationSeconds: number;
    mood: Emotion;
}

interface RawMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    emotion?: Emotion;
}

interface RawSession {
    _id: string;
    type: string;
    messages: RawMessage[];
}

/** Turns persisted voice sessions into CallRecord[] for the dashboard call
 * history widget. Duration is derived from the spread between the first and
 * last message timestamp; mood is the most recently detected emotion in the
 * session (defaults to "Neutral" if none — analyzeText() always returns an
 * emotion rather than leaving it undefined, so this is a defensive
 * fallback, not a realistically-hit path). */
export function sessionsToCallRecords(sessions: RawSession[]): CallRecord[] {
    return sessions
        .filter((s) => s.type === "voice" && s.messages.length > 0)
        .map((s) => {
            const times = s.messages.map((m) => new Date(m.timestamp).getTime());
            const startedAt = new Date(Math.min(...times));
            const durationSeconds = Math.max(
                0,
                Math.round((Math.max(...times) - startedAt.getTime()) / 1000)
            );
            const lastEmotion = [...s.messages].reverse().find((m) => m.emotion)?.emotion;
            return { id: s._id, startedAt, durationSeconds, mood: lastEmotion ?? "Neutral" };
        })
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}
