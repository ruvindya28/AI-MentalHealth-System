import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { createSessionCookie } from "@/lib/auth/session";
import { getAppOrigin } from "@/lib/auth/origin";
import { OAUTH_STATE_COOKIE } from "@/app/api/auth/google/route";
import { generateOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email/send-otp-email";

interface GoogleUserInfo {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
}

export async function GET(request: Request) {
    const origin = getAppOrigin(request);
    const { searchParams } = new URL(request.url);

    // 1. Check for error returned directly from Google
    const googleError = searchParams.get("error");
    if (googleError) {
        const errorDesc =
            googleError === "access_denied"
                ? "Google sign-in was cancelled"
                : `Google sign-in error: ${googleError}`;
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDesc)}`);
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // 2. Validate OAuth state cookie to protect against CSRF
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    cookieStore.delete(OAUTH_STATE_COOKIE);

    let fromPath = "/dashboard";
    if (!state || !stateCookie) {
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Missing or invalid OAuth state. Please try again.")}`
        );
    }

    try {
        const parsedState = JSON.parse(stateCookie);
        if (parsedState.state !== state) {
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent("OAuth state mismatch. Please try again.")}`
            );
        }
        if (parsedState.from && parsedState.from.startsWith("/")) {
            fromPath = parsedState.from;
        }
    } catch {
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Corrupt OAuth state. Please try again.")}`
        );
    }

    if (!code) {
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Missing authorization code from Google.")}`
        );
    }

    // 3. Exchange authorization code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Google OAuth credentials are not configured on the server.")}`
        );
    }

    const redirectUri = `${origin}/api/auth/google/callback`;

    let tokenData: { access_token?: string; id_token?: string; error?: string; error_description?: string };
    try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error("Google token exchange error:", tokenData);
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent(
                    tokenData.error_description || "Failed to exchange Google authorization token."
                )}`
            );
        }
    } catch (err) {
        console.error("Google token fetch failure:", err);
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Failed to reach Google token endpoint.")}`
        );
    }

    // 4. Fetch user profile from Google UserInfo endpoint
    let profile: GoogleUserInfo;
    try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!userInfoRes.ok) {
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent("Failed to fetch user profile from Google.")}`
            );
        }

        profile = await userInfoRes.json();
    } catch (err) {
        console.error("Google userinfo fetch failure:", err);
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Failed to retrieve Google profile data.")}`
        );
    }

    if (!profile.email) {
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Google account did not provide an email address.")}`
        );
    }

    const email = profile.email.toLowerCase().trim();
    const isGoogleEmailVerified = Boolean(profile.email_verified);

    await connectToDatabase();

    // 5. Look up existing user by email or googleId
    let user = await User.findOne({
        $or: [{ email }, { googleId: profile.sub }],
    }).select("+passwordHash +googleId +otpCodeHash +otpExpires");

    // 6. Handle edge case: Google email is NOT verified
    if (!isGoogleEmailVerified) {
        const { code: otpCode, codeHash, expiresAt } = generateOtp();

        if (user) {
            user.otpCodeHash = codeHash;
            user.otpExpires = expiresAt;
            await user.save();
        } else {
            user = await User.create({
                name: profile.name || email.split("@")[0],
                email,
                googleId: profile.sub,
                emailVerified: false,
                image: profile.picture || null,
                imageSource: profile.picture ? "google" : null,
                otpCodeHash: codeHash,
                otpExpires: expiresAt,
            });
        }

        try {
            await sendOtpEmail({
                to: email,
                name: user.name,
                code: otpCode,
            });
        } catch (err) {
            console.error("Failed to send unverified Google email OTP:", err);
        }

        await createSessionCookie(user._id.toString());
        return NextResponse.redirect(
            `${origin}/verify-otp?email=${encodeURIComponent(email)}&reason=unverified_google_email`
        );
    }

    // 7. Normal verified email path: link existing account or create new account
    let hadPassword = false;

    if (user) {
        // PRESERVE EXISTING USER: Do NOT create duplicate account.
        // Link googleId if not already set
        if (!user.googleId) {
            user.googleId = profile.sub;
        }

        // Email verified by Google
        user.emailVerified = true;

        // Profile sync (Requirement 5):
        // Only set avatar if user has no image or if existing image was from Google (never overwrite manual upload)
        if (!user.image || user.imageSource === "google") {
            if (profile.picture) {
                user.image = profile.picture;
                user.imageSource = "google";
            }
        }

        // Only update name if not already set
        if (!user.name && profile.name) {
            user.name = profile.name;
        }

        hadPassword = Boolean(user.passwordHash);
        await user.save();
    } else {
        // Brand new user registration via Google
        hadPassword = false;

        user = await User.create({
            name: profile.name || email.split("@")[0],
            email,
            googleId: profile.sub,
            emailVerified: true,
            image: profile.picture || null,
            imageSource: profile.picture ? "google" : null,
            // passwordHash is omitted for now
        });
    }

    // 8. Establish user session
    await createSessionCookie(user._id.toString());

    // 9. Redirect logic:
    // If the user does not have a local password (first Google login / no password set),
    // guide them to /set-password with option to create a password securely.
    // If user already has a password, redirect directly to dashboard or requested fromPath.
    if (!hadPassword) {
        return NextResponse.redirect(`${origin}/set-password?first=true&from=${encodeURIComponent(fromPath)}`);
    }

    return NextResponse.redirect(`${origin}${fromPath}`);
}
