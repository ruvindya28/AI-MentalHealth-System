const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const TRANSCRIBE_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
] as const;

const TRANSCRIBE_TIMEOUT_MS = 7000;
const TTS_TIMEOUT_MS = 15000;

const TTS_MODELS = [
    "gemini-3.8-flash-tts",
    "gemini-3.8-flash-lite-tts",
    "gemini-3.1-flash-tts-preview",
] as const;

const TTS_VOICE_NAME = "Kore";

const VOICE_SAFETY_SETTINGS = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
];

const TRANSCRIBE_PROMPT =
    "Transcribe this audio verbatim as plain text. Output only the transcript, " +
    "with no preamble, labels, or commentary. If there is no discernible speech, output nothing.";

export interface PcmAudio {
    base64: string;
    mimeType: string;
}

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;

    // Sanitize MIME type — Google Gemini's inlineData parser rejects codec parameters like ';codecs=opus'
    const cleanMimeType = (mimeType.split(";")[0] || "audio/webm").trim().toLowerCase();

    for (const model of TRANSCRIBE_MODELS) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS);

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY,
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { inlineData: { mimeType: cleanMimeType, data: audioBase64 } },
                                { text: TRANSCRIBE_PROMPT },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0,
                        maxOutputTokens: 300,
                    },
                    safetySettings: VOICE_SAFETY_SETTINGS,
                }),
                signal: controller.signal,
            });

            if (res.ok) {
                const data = await res.json();
                const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                const transcript = text?.trim() ?? "";
                console.log(`[Gemini Voice] Model ${model} transcribed: "${transcript}"`);
                return transcript;
            }

            const errorText = await res.text().catch(() => "");
            console.warn(`Gemini transcription model ${model} failed (${res.status}):`, errorText);
            // Cascade to next fallback model
        } catch (error) {
            console.warn(`Gemini transcription call to ${model} failed:`, error);
        } finally {
            clearTimeout(timeout);
        }
    }

    console.error("All Gemini transcription fallback models failed.");
    return null;
}

interface TTSFetchResult {
    audio: PcmAudio | null;
    isQuotaExceeded?: boolean;
}

async function requestTTS(model: string, text: string): Promise<TTSFetchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY!,
            },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: TTS_VOICE_NAME,
                            },
                        },
                    },
                },
                safetySettings: VOICE_SAFETY_SETTINGS,
            }),
            signal: controller.signal,
        });

        if (!res.ok) {
            const errorText = await res.text().catch(() => "");
            console.warn(`[Gemini TTS] Model ${model} returned ${res.status}:`, errorText);
            return { audio: null, isQuotaExceeded: res.status === 429 };
        }

        const data = await res.json();
        const candidate = data?.candidates?.[0];
        if (candidate?.finishReason === "SAFETY" || data?.promptFeedback?.blockReason === "SAFETY") {
            console.warn(`[Gemini TTS] Model ${model} audio generation blocked by Gemini safety filter (finishReason=${candidate?.finishReason})`);
        }
        const part = data?.candidates?.[0]?.content?.parts?.[0];
        const inlineData = part?.inline_data || part?.inlineData;
        const b64 = inlineData?.data;
        const mime = inlineData?.mime_type || inlineData?.mimeType;

        if (!b64 || !mime) {
            console.warn(`[Gemini TTS] Model ${model} returned no inline audio data`);
            return { audio: null };
        }

        console.log(`[Gemini TTS] Model ${model} successfully synthesized speech`);
        return { audio: { base64: b64, mimeType: mime } };
    } catch (error) {
        console.warn(`[Gemini TTS] Model ${model} failed:`, error);
        return { audio: null };
    } finally {
        clearTimeout(timeout);
    }
}

export interface DetailedTTSResult {
    audio: PcmAudio | null;
    isQuotaExceeded?: boolean;
}

/** Returns audio on success, or status info if failed. */
export async function synthesizeSpeechDetailed(text: string): Promise<DetailedTTSResult> {
    if (!GEMINI_API_KEY) return { audio: null };

    for (const model of TTS_MODELS) {
        const res = await requestTTS(model, text);
        if (res.audio) return res;
        if (res.isQuotaExceeded) return res;
    }

    return { audio: null };
}

export async function synthesizeSpeech(text: string): Promise<PcmAudio | null> {
    const res = await synthesizeSpeechDetailed(text);
    return res.audio;
}
