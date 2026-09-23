import {
    analyzeText,
    type CrisisLevel,
    type Emotion,
    type EmotionAnalysis,
} from "@/lib/mock-emotion-analyzer";
import { generateReply, type CannedResponse } from "@/lib/mock-therapist-responses";

export async function analyzeMessage(text: string): Promise<EmotionAnalysis> {
    try {
        const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("Analyze request failed");
        return (await res.json()) as EmotionAnalysis;
    } catch (error) {
        console.error("Error analyzing message, falling back to local heuristic:", error);
        return analyzeText(text);
    }
}

/** Creates a new persisted therapy session of the given type. Returns null
 * on failure — callers should fall back to local-only behavior. */
export async function createTherapySession(type: "chat" | "voice"): Promise<string | null> {
    try {
        const res = await fetch("/api/therapy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type }),
        });
        if (!res.ok) throw new Error("Failed to create session");
        const { session } = (await res.json()) as { session: { _id: string } };
        return session._id;
    } catch (error) {
        console.error("Error creating therapy session:", error);
        return null;
    }
}

export async function persistTherapyMessage(
    sessionId: string,
    msg: {
        role: "user" | "assistant";
        content: string;
        emotion?: Emotion;
        confidence?: number;
        crisisLevel?: CrisisLevel;
        technique?: string;
    }
): Promise<void> {
    try {
        await fetch(`/api/therapy/${sessionId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(msg),
        });
    } catch (error) {
        console.error("Error saving message:", error);
    }
}

export async function fetchTherapyReply(
    sessionId: string,
    analysis: EmotionAnalysis,
    userMessage?: string
): Promise<CannedResponse> {
    try {
        const res = await fetch(`/api/therapy/${sessionId}/reply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...analysis, userMessage }),
        });
        if (!res.ok) throw new Error("Reply request failed");
        return (await res.json()) as CannedResponse;
    } catch (error) {
        console.error("Error generating reply, falling back to local heuristic:", error);
        return generateReply(analysis, userMessage);
    }
}
