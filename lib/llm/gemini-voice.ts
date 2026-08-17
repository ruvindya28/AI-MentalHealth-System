const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Same model that already powers text replies in lib/llm/gemini.ts — confirmed
// via a live test call to accept inline audio input and transcribe it accurately.
const TRANSCRIBE_MODEL = "gemini-3.5-flash-lite";
const TRANSCRIBE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TRANSCRIBE_MODEL}:generateContent`;

const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const TTS_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`;
const TTS_VOICE_NAME = "Kore";

const AUDIO_TIMEOUT_MS = 15000;

const TRANSCRIBE_PROMPT =
    "Transcribe this audio verbatim as plain text. Output only the transcript, " +
    "with no preamble, labels, or commentary. If there is no discernible speech, output nothing.";

export interface PcmAudio {
    base64: string;
    mimeType: string;
}

/** Returns null on failure (missing key, network error, bad response) — the
 * caller has no local fallback for speech-to-text, so null must become a
 * user-facing "couldn't process" error. An empty string is a valid result
 * meaning Gemini heard no speech, distinct from a failed call. */
export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUDIO_TIMEOUT_MS);

    try {
        const res = await fetch(TRANSCRIBE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: TRANSCRIBE_PROMPT }, { inlineData: { mimeType, data: audioBase64 } }],
                    },
                ],
                generationConfig: {
                    temperature: 0,
                    maxOutputTokens: 500,
                },
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            console.error("Gemini transcription error:", res.status, await res.text().catch(() => ""));
            return null;
        }

        const data = await res.json();
        const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text?.trim() ?? "";
    } catch (error) {
        console.error("Gemini transcription call failed:", error);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

/** Returns null on failure. TTS is an enhancement, not core functionality —
 * callers must degrade to text-only rather than block on this. */
export async function synthesizeSpeech(text: string): Promise<PcmAudio | null> {
    if (!GEMINI_API_KEY) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AUDIO_TIMEOUT_MS);

    try {
        const res = await fetch(TTS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE_NAME } },
                    },
                },
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            console.error("Gemini TTS error:", res.status, await res.text().catch(() => ""));
            return null;
        }

        const data = await res.json();
        const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!inlineData?.data || !inlineData?.mimeType) return null;

        return { base64: inlineData.data, mimeType: inlineData.mimeType };
    } catch (error) {
        console.error("Gemini TTS call failed:", error);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}
