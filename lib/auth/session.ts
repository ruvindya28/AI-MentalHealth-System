import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";

export const SESSION_COOKIE_NAME = "mindcare_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches JWT expiry

export async function createSessionCookie(userId: string): Promise<void> {
    const token = signSessionToken({ sub: userId });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
    });
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    return payload?.sub ?? null;
}
