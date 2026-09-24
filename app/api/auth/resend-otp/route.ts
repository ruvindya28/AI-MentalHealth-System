import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getSessionUserId } from "@/lib/auth/session";
import { generateOtp, OTP_TTL_MS } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email/send-otp-email";
import { resendOtpSchema } from "@/lib/validation/auth";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const parsed = resendOtpSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const sessionUserId = await getSessionUserId();
    const { email } = parsed.data;

    await connectToDatabase();

    let user;
    if (sessionUserId) {
        user = await User.findById(sessionUserId).select("+otpExpires +otpCodeHash");
    } else if (email) {
        user = await User.findOne({ email }).select("+otpExpires +otpCodeHash");
    }

    if (user) {
        // Check cooldown
        if (user.otpExpires) {
            const timeUntilExpiry = new Date(user.otpExpires).getTime() - Date.now();
            const timeSinceGeneration = OTP_TTL_MS - timeUntilExpiry;
            if (timeSinceGeneration < RESEND_COOLDOWN_MS) {
                const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceGeneration) / 1000);
                return jsonError(`Please wait ${waitSeconds} seconds before requesting a new code.`, 429);
            }
        }

        const { code, codeHash, expiresAt } = generateOtp();
        user.otpCodeHash = codeHash;
        user.otpExpires = expiresAt;
        await user.save();

        try {
            await sendOtpEmail({
                to: user.email,
                name: user.name,
                code,
            });
        } catch (err) {
            console.error("Failed to resend OTP email:", err);
            return jsonError("Failed to deliver verification email. Please check your address or try again.", 500);
        }
    }

    return NextResponse.json(
        { ok: true, message: "A new verification code has been sent if the account exists." },
        { status: 200 }
    );
}
