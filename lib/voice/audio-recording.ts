export const MAX_RECORDING_MS = 60_000;

// Preference order: audio/webm;codecs=opus is what Chrome/Edge's MediaRecorder
// produces by default; audio/mp4 (AAC) is preferred when available since AAC
// is unambiguously supported by Gemini's documented audio formats. Falls
// through to whatever the browser actually supports.
const MIME_PREFERENCE = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
];

export function pickRecordingMimeType(): string | undefined {
    if (typeof MediaRecorder === "undefined") return undefined;
    return MIME_PREFERENCE.find((type) => MediaRecorder.isTypeSupported(type));
}

/** Reads a Blob into a base64 string (no data: prefix). */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.slice(result.indexOf(",") + 1));
        };
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read recording"));
        reader.readAsDataURL(blob);
    });
}
