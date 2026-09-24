import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/auth/reset-token";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";
import { getAppOrigin } from "@/lib/auth/origin";

const GENERIC_MESSAGE =
    "If an account exists for that email, we've sent a password reset link.";

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { email } = parsed.data;

    await connectToDatabase();

    const user = await User.findOne({ email });

    // Always respond the same way whether or not the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    if (user) {
        const { token, tokenHash } = generateResetToken();
        user.resetPasswordTokenHash = tokenHash;
        user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        await user.save();

        const origin = getAppOrigin(request);
        const resetUrl = `${origin}/reset-password?token=${token}`;

        try {
            await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
        } catch (err) {
            console.error("Failed to send password reset email:", err);
        }
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE }, { status: 200 });
}
