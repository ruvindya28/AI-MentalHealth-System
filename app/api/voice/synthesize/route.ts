import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { synthesizeSchema } from "@/lib/validation/voice";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";
import { synthesizeSpeechDetailed } from "@/lib/llm/gemini-voice";
import { pcmToWav } from "@/lib/audio/wav";

export async function POST(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = synthesizeSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const res = await synthesizeSpeechDetailed(parsed.data.text);
    if (!res.audio) {
        if (res.isQuotaExceeded) {
            return jsonError("Google Gemini free tier voice quota reached (10 requests/day). Falling back to Instant voice.", 429);
        }
        return jsonError("Couldn't generate voice audio.", 502);
    }
    const pcm = res.audio;

    const rateMatch = /rate=(\d+)/.exec(pcm.mimeType);
    if (!rateMatch) {
        console.error("Gemini TTS response missing sample rate in mimeType:", pcm.mimeType);
    }
    const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;

    const wav = pcmToWav(Buffer.from(pcm.base64, "base64"), sampleRate);

    return NextResponse.json(
        { audioBase64: wav.toString("base64"), mimeType: "audio/wav" },
        { status: 200 }
    );
}
