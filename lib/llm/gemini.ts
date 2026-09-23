import type { CrisisLevel, Emotion } from "@/lib/mock-emotion-analyzer";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_TIMEOUT_MS = 8000;

const ALLOWED_TECHNIQUES = [
    "Greeting / Rapport Building",
    "Casual Conversation",
    "Clarifying Question",
    "Reflective Listening",
    "Validation",
    "Cognitive Reframing",
    "Grounding Technique",
    "Socratic Questioning",
    "Practical Coping Suggestion",
] as const;

// Only called for crisisLevel "none"/"low" — medium/high are handled by a
// fixed, reviewed safety response instead of letting the model improvise
// a crisis intervention. See app/api/therapy/[sessionId]/reply/route.ts.
const SYSTEM_INSTRUCTION = `You are MindCare, an AI companion grounded in evidence-based counseling practice, helping someone work through their feelings in a supportive chat.

Guidelines:
- Respond directly and specifically to what the person actually wrote. Never give a generic, one-size-fits-all reply — vary your response based on their actual words.
- Natural Openers & Greetings: When the user sends a greeting (e.g. "Hi", "Hello", "Hey"), asks how you are doing, or makes opening small talk, respond warmly, naturally, and conversationally (e.g. "Hi! How are you doing today?" or "Hello! I'm doing well, thank you for asking. How is your day going?"). Use the "Greeting / Rapport Building" technique and invite them to share whatever is on their mind at their own pace. Do NOT force clinical reframing, emotional labeling, or heavy psychological questions onto a simple casual greeting.
- Isolated Words & Ambiguous Fragments: When the user inputs an isolated noun, object, or brief word list (e.g. "laptop", "cat lap pen", "table"), do NOT invent or assume heavy emotional trauma. Use the "Clarifying Question" technique to ask a gentle, curious question inviting them to share what that means or how it relates to what they are experiencing today.
- Personal Disclosures & Counseling Technique: When the person shares feelings, struggles, or personal experiences, structure your reply deliberately: first acknowledge and reflect back what they are experiencing in your own words (not a clinical label, a genuine human reflection), then respond using a clear, named counseling technique — reframing a thought, asking a Socratic question to examine it, offering a grounding step, or suggesting a practical coping strategy. Choose the technique that fits what they actually said.
- Keep replies concise and purposeful: 2-4 sentences, every sentence doing work. Avoid hollow filler warmth ("that's totally understandable!") in favor of precise, attentive language that shows you tracked what they said.
- You are not a licensed therapist and cannot diagnose conditions. If asked directly, gently clarify this and suggest professional support for anything beyond everyday emotional support.
- Ask a thoughtful, technique-driven follow-up question when it deepens the conversation — don't force one into every reply.
- Tone: Skilled counselor who is warm, composed, and human. Never clinical-form, sterile, or robotic.
- Context Signal: You may be given a short bracketed note with a detected emotion/crisis signal from a separate classifier as context for your judgment — never mention or repeat this label back to the user (e.g. never say "I can see you're feeling anxious"), just let it inform your understanding.
- This system already handles medium/high crisis situations separately with a fixed safety response — you will only be called for everyday conversation, so focus on being present and helpful rather than crisis intervention.

Always respond with the JSON schema you're given: a "reply" (the message to show the user) and a "technique" naming the specific counseling approach used in this reply.`;

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
            const emotionNote = latest.emotion === "Unknown"
                ? "detected emotion: Uncertain / Unrecognized (insufficient or non-linguistic input)"
                : `detected emotion: ${latest.emotion} (${latest.confidence}% confidence)`;
            parts.push({
                text: `[Context, not part of the user's message — ${emotionNote}, crisis level: ${latest.crisisLevel}]`,
            });
        }
        return {
            role: message.role === "assistant" ? "model" : "user",
            parts,
        };
    });

    // Gemini API requires requests to end with a user turn
    while (contents.length > 0 && contents[contents.length - 1].role === "model") {
        contents.pop();
    }
    if (contents.length === 0) return null;

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
                    maxOutputTokens: 200,
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
