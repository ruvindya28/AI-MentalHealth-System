import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

export interface SessionTokenPayload {
    sub: string; // user id
}

function getSecret(): string {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not set. Add it to .env.local (see .env.example).");
    }
    return JWT_SECRET;
}

export function signSessionToken(payload: SessionTokenPayload): string {
    return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
    try {
        return jwt.verify(token, getSecret()) as SessionTokenPayload;
    } catch {
        return null;
    }
}
