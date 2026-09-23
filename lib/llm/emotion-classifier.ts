import type { Emotion } from "@/lib/mock-emotion-analyzer";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CLASSIFIER_TIMEOUT_MS = 3500;

export interface SemanticEmotionResult {
    emotion: Emotion;
    confidence: number;
}

const CANONICAL_EMOTIONS: readonly Emotion[] = [
    "Angry",
    "Anxious",
    "Calm",
    "Hopeful",
    "Neutral",
    "Sad",
    "Unknown",
];

const EMOTION_SYSTEM_PROMPT = `You are a clinical emotion classification system for a mental health therapy platform.
Your task is to classify the primary emotional state expressed by the user into exactly ONE of the following 6 canonical classes:
- "Angry": Frustration, irritation, hostility, resentment, rage.
- "Anxious": Worry, stress, panic, tension, fear, nervousness, unease.
- "Calm": Peaceful, relaxed, composed, grounded, caring, loving protection of family/loved ones, quiet contentment.
- "Hopeful": Optimistic, looking forward, grateful, determined, improving, striving for betterment.
- "Neutral": Everyday facts, routine statements, casual remarks, questions without clear emotional valence.
- "Sad": Sorrow, grief, loneliness, feeling down, depression, despair, loss.

Important rules:
1. Statements expressing loving protection, care, or wanting to keep oneself or family safe (e.g. "I want to protect my family members", "I want to protect myself", "keeping my kids safe") reflect protective composure and care: classify as "Calm" or "Hopeful", NEVER "Angry".
2. Positive wellness states ("I am doing well", "feeling okay", "things are fine") should be classified as "Calm" or "Hopeful".
3. Only classify as "Angry" if there is actual frustration, bitterness, or aggression.
4. If the text is completely non-linguistic gibberish or an arbitrary isolated object with no emotional context (e.g. "laptop", "chair table"), classify as "Unknown".

Return a JSON object with:
- "emotion": One of the canonical classes above.
- "confidence": Integer percentage between 60 and 98 reflecting certainty.`;

/**
 * Rapidly classifies ambiguous or conversational user text into one of the
 * 6 research-defined canonical emotion classes using Gemini 3.5 Flash-Lite.
 * Returns null on timeout or network error so caller can gracefully fallback.
 */
export async function classifyEmotionSemantically(
    text: string
): Promise<SemanticEmotionResult | null> {
    if (!GEMINI_API_KEY || !text.trim()) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);

    try {
        const res = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            signal: controller.signal,
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: EMOTION_SYSTEM_PROMPT }],
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: text.trim() }],
                    },
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 64,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            emotion: {
                                type: "string",
                                enum: [
                                    "Angry",
                                    "Anxious",
                                    "Calm",
                                    "Hopeful",
                                    "Neutral",
                                    "Sad",
                                    "Unknown",
                                ],
                            },
                            confidence: {
                                type: "integer",
                            },
                        },
                        required: ["emotion", "confidence"],
                    },
                },
            }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) return null;

        const parsed = JSON.parse(candidate);
        const emotion = CANONICAL_EMOTIONS.includes(parsed.emotion)
            ? (parsed.emotion as Emotion)
            : "Unknown";
        const confidence = typeof parsed.confidence === "number"
            ? Math.min(Math.max(parsed.confidence, 50), 98)
            : 75;

        return { emotion, confidence };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}
