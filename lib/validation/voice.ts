import { z } from "zod";

// ~8MB decoded audio ceiling — generous for a client-side-capped ~60s
// recording. No platform-level body size limit exists elsewhere in this
// app, so this is the only guardrail against oversized uploads.
export const MAX_DECODED_AUDIO_BYTES = 8 * 1024 * 1024;
const MAX_AUDIO_BASE64_LEN = Math.ceil((MAX_DECODED_AUDIO_BYTES * 4) / 3) + 1024;

export const transcribeSchema = z.object({
    audioBase64: z.string().min(1).max(MAX_AUDIO_BASE64_LEN, "Recording is too large"),
    mimeType: z.string().trim().min(1).regex(/^audio\//, "Expected an audio mime type").max(100),
});

export const synthesizeSchema = z.object({
    text: z.string().trim().min(1, "Text is required").max(2000),
});
