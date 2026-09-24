import crypto from "crypto";

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function generateOtp(): { code: string; codeHash: string; expiresAt: Date } {
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    return { code, codeHash, expiresAt };
}

export function hashOtp(code: string): string {
    return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export function verifyOtp(inputCode: string, codeHash?: string | null, expiresAt?: Date | null): boolean {
    if (!codeHash || !expiresAt) return false;
    if (new Date() > new Date(expiresAt)) return false;
    const computedHash = hashOtp(inputCode);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(codeHash));
}
