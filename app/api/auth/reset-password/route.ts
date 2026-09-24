import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/auth/password";
import { hashResetToken } from "@/lib/auth/reset-token";
import { createSessionCookie } from "@/lib/auth/session";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { toUserDTO } from "@/lib/dto/user";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { token, password } = parsed.data;
    const tokenHash = hashResetToken(token);

    await connectToDatabase();

    const user = await User.findOne({
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires +passwordHash +googleId");

    if (!user) {
        return jsonError("This reset link is invalid or has expired", 400);
    }

    user.passwordHash = await hashPassword(password);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    user.emailVerified = true;
    await user.save();

    await createSessionCookie(user._id.toString());

    return NextResponse.json({ user: toUserDTO(user) }, { status: 200 });
}
