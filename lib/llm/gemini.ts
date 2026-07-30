import type { CrisisLevel, Emotion } from "@/lib/mock-emotion-analyzer";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_TIMEOUT_MS = 10000;

const ALLOWED_TECHNIQUES = [
    "Active Listening",
    "Validation",
    "Grounding Technique",
    "Positive Reinforcement",
    "Open-Ended Inquiry",
    "Practical Coping Suggestion",
] as const;

// Only called for crisisLevel "none"/"low" — medium/high are handled by a
// fixed, reviewed safety response instead of letting the model improvise
// a crisis intervention. See app/api/therapy/[sessionId]/reply/route.ts.
const SYSTEM_INSTRUCTION = `You are MindCare, a warm, empathetic AI companion for someone working through their feelings in a supportive chat.

Guidelines:
- Respond directly and specifically to what the person actually wrote. Never give a generic, one-size-fits-all reply — vary your response based on their actual words.
- Keep replies conversational and concise: 2-4 sentences.
- You are not a licensed therapist and cannot diagnose conditions. If asked directly, gently clarify this and suggest professional support for anything beyond everyday emotional support.
- Validate feelings before offering suggestions. Ask a thoughtful follow-up question when it fits naturally — don't force one into every reply.
- If it fits, offer 1-2 concrete, relevant ideas rather than vague advice.
- Use a supportive, human, non-clinical tone. Avoid therapy jargon unless you explain it naturally.
- You may be given a short bracketed note with a detected emotion/crisis signal from a separate classifier as context for your judgment — never mention or repeat this label back to the user (e.g. never say "I can see you're feeling anxious"), just let it inform your understanding.
- This system already handles medium/high crisis situations separately with a fixed safety response — you will only be called for everyday conversation, so focus on being present and helpful rather than crisis intervention.

Always respond with the JSON schema you're given: a "reply" (the message to show the user) and a "technique" describing the counseling approach used in this reply.`;

export interface TherapyReply {
    text: string;
    technique: string;
}

export interface HistoryMessage {
    role: "user" | "assistant";
    content: string;
}

interface LatestAnalysis {
    emotion: Emotion;
    confidence: number;
    crisisLevel: CrisisLevel;
}

/** Returns null on any failure (missing key, network error, bad response) so
 * the caller can fall back to the local canned reply — never throws. */
export async function generateTherapyReply(
    history: HistoryMessage[],
    latest: LatestAnalysis
): Promise<TherapyReply | null> {
    if (!GEMINI_API_KEY || history.length === 0) return null;

    const contents = history.map((message, index) => {
        const isLatestUserTurn = index === history.length - 1 && message.role === "user";
        const parts: { text: string }[] = [{ text: message.content }];
        if (isLatestUserTurn) {
            parts.push({
                text: `[Context, not part of the user's message — detected emotion: ${latest.emotion} (${latest.confidence}% confidence), crisis level: ${latest.crisisLevel}]`,
            });
        }
        return {
            role: message.role === "assistant" ? "model" : "user",
            parts,
        };
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            reply: { type: "STRING" },
                            technique: { type: "STRING", enum: [...ALLOWED_TECHNIQUES] },
                        },
                        required: ["reply", "technique"],
                    },
                    maxOutputTokens: 300,
                    temperature: 0.7,
                },
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            console.error("Gemini API error:", res.status, await res.text().catch(() => ""));
            return null;
        }

        const data = await res.json();
        const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) return null;

        const parsed = JSON.parse(rawText) as { reply?: string; technique?: string };
        if (!parsed.reply) return null;

        return {
            text: parsed.reply,
            technique: parsed.technique ?? "Active Listening",
        };
    } catch (error) {
        console.error("Gemini call failed:", error);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}
