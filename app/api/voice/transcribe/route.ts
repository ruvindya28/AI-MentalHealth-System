import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { transcribeSchema, MAX_DECODED_AUDIO_BYTES } from "@/lib/validation/voice";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";
import { transcribeAudio } from "@/lib/llm/gemini-voice";

export async function POST(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = transcribeSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const decodedSize = Buffer.byteLength(parsed.data.audioBase64, "base64");
    if (decodedSize > MAX_DECODED_AUDIO_BYTES) {
        return jsonError("Recording is too large", 413);
    }

    const transcript = await transcribeAudio(parsed.data.audioBase64, parsed.data.mimeType);
    if (transcript === null) return jsonError("Couldn't transcribe audio. Please try again.", 502);

    return NextResponse.json({ transcript }, { status: 200 });
}
