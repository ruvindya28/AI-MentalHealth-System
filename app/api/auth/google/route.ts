import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { getAppOrigin } from "@/lib/auth/origin";

export const OAUTH_STATE_COOKIE = "mindcare_oauth_state";

export async function GET(request: Request) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return NextResponse.redirect(
            new URL("/login?error=Google+Sign-In+is+not+configured+yet", request.url)
        );
    }

    const { searchParams } = new URL(request.url);
    const fromPath = searchParams.get("from") || "/dashboard";

    const stateToken = crypto.randomBytes(32).toString("hex");
    const cookiePayload = JSON.stringify({ state: stateToken, from: fromPath });

    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, cookiePayload, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10, // 10 minutes
    });

    const redirectUri = `${getAppOrigin(request)}/api/auth/google/callback`;

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("state", stateToken);
    googleAuthUrl.searchParams.set("access_type", "online");
    googleAuthUrl.searchParams.set("prompt", "select_account");

    return NextResponse.redirect(googleAuthUrl.toString());
}
