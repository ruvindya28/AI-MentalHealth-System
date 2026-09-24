import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getSessionUserId, createSessionCookie } from "@/lib/auth/session";
import { verifyOtp } from "@/lib/auth/otp";
import { verifyOtpSchema } from "@/lib/validation/auth";
import { toUserDTO } from "@/lib/dto/user";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { email, code } = parsed.data;
    const sessionUserId = await getSessionUserId();

    await connectToDatabase();

    let user;
    if (sessionUserId) {
        user = await User.findById(sessionUserId).select("+otpCodeHash +otpExpires +passwordHash +googleId");
    } else if (email) {
        user = await User.findOne({ email }).select("+otpCodeHash +otpExpires +passwordHash +googleId");
    }

    if (!user) {
        return jsonError("Account not found", 404);
    }

    const isValid = verifyOtp(code, user.otpCodeHash, user.otpExpires);
    if (!isValid) {
        return jsonError("Invalid or expired verification code. Please request a new code.", 400);
    }

    // Mark verified & clear OTP
    user.emailVerified = true;
    user.otpCodeHash = undefined;
    user.otpExpires = undefined;
    await user.save();

    await createSessionCookie(user._id.toString());

    return NextResponse.json(
        {
            user: toUserDTO(user),
            message: "Email verified successfully",
        },
        { status: 200 }
    );
}
