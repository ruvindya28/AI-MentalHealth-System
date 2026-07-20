import crypto from "crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString("hex");
    return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}
