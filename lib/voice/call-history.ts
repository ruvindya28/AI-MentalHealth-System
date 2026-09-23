import type { CrisisLevel, Emotion } from "@/lib/mock-emotion-analyzer";

export interface CallRecord {
    id: string;
    startedAt: Date;
    durationSeconds: number;
    mood: Emotion;
    crisisLevel?: CrisisLevel;
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
    type: string;
    messages: RawMessage[];
    durationSeconds?: number;
    dominantEmotion?: Emotion;
}

/**
 * Resolves the primary, substantive emotional tone of a session.
 * Prioritizes meaningful disclosures (Sad, Anxious, Angry, Hopeful, Calm)
 * over superficial pleasantries ("Neutral") or audio artifacts ("Unknown").
 */
const CRISIS_SEVERITY: Record<CrisisLevel, number> = { none: 0, low: 1, medium: 2, high: 3 };

/**
 * Resolves the primary, substantive emotional tone of a session.
 * Prioritizes meaningful disclosures (Sad, Anxious, Angry, Hopeful, Calm)
 * and acute crisis states over superficial pleasantries ("Neutral") or audio artifacts ("Unknown").
 */
export function resolveSessionMood(messages: RawMessage[] | undefined | null): Emotion {
    if (!messages?.length) return "Neutral";
    // 1. Check if any message flagged a crisis
    const hasAcuteCrisis = messages.some(
        (m) => m.crisisLevel === "high" || m.crisisLevel === "medium"
    );

    // 2. Gather all user messages with detected emotions
    const userEmotions = messages
        .filter((m) => m.role === "user" && m.emotion)
        .map((m) => ({ emotion: m.emotion!, confidence: m.confidence ?? 50 }));

    // 3. Identify substantive emotions (excluding Neutral and Unknown)
    const substantive = userEmotions.filter(
        (e) => e.emotion !== "Neutral" && e.emotion !== "Unknown"
    );

    if (substantive.length > 0) {
        // Tally confidence-weighted scores so the dominant emotional theme wins
        const scores: Partial<Record<Emotion, number>> = {};
        for (const item of substantive) {
            scores[item.emotion] = (scores[item.emotion] ?? 0) + (item.confidence || 50);
        }
        const sorted = (Object.entries(scores) as [Emotion, number][]).sort(
            (a, b) => b[1] - a[1]
        );
        return sorted[0][0];
    }

    // If an acute crisis was expressed without another substantive emotion, it represents acute depressive distress
    if (hasAcuteCrisis) {
        return "Sad";
    }

    if (userEmotions.length === 0) {
        const anyMsg = messages.find((m) => m.emotion);
        return anyMsg?.emotion ?? "Neutral";
    }

    // 4. If no substantive emotions exist, check if Neutral was detected
    const hasNeutral = userEmotions.some((e) => e.emotion === "Neutral");
    if (hasNeutral) {
        return "Neutral";
    }

    // 5. Fall back to the most recent user emotion
    return userEmotions[userEmotions.length - 1].emotion;
}

/** Turns persisted voice sessions into CallRecord[] for the dashboard call
 * history widget. Uses persisted durationSeconds when available, falling
 * back to message timestamp spread. Resolves the genuine substantive mood
 * and tracks crisis level rather than defaulting to trailing pleasantries. */
export function sessionsToCallRecords(sessions: RawSession[]): CallRecord[] {
    return sessions
        .filter((s) => s.type === "voice" && (s.messages?.length ?? 0) > 0)
        .map((s) => {
            const messages = s.messages ?? [];
            const times = messages.map((m) => new Date(m.timestamp).getTime());
            const startedAt = new Date(Math.min(...times));
            const spreadDuration = Math.max(
                0,
                Math.round((Math.max(...times) - startedAt.getTime()) / 1000)
            );
            const durationSeconds =
                typeof s.durationSeconds === "number" && s.durationSeconds > 0
                    ? s.durationSeconds
                    : spreadDuration > 0
                      ? spreadDuration
                      : 15; // default reasonable minimum for completed turns

            const mood = s.dominantEmotion ?? resolveSessionMood(messages);

            const crisisLevel = messages.reduce<CrisisLevel>((worst, m) => {
                if (m.crisisLevel && CRISIS_SEVERITY[m.crisisLevel] > CRISIS_SEVERITY[worst]) {
                    return m.crisisLevel;
                }
                return worst;
            }, "none");

            return { id: s._id, startedAt, durationSeconds, mood, crisisLevel };
        })
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}
