import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import { toUserDTO } from "@/lib/dto/user";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { email, password } = parsed.data;

    await connectToDatabase();

    const user = await User.findOne({ email }).select("+passwordHash +googleId");
    if (!user) {
        return jsonError("Invalid email or password", 401);
    }

    if (!user.passwordHash) {
        return jsonError(
            "This account was registered with Google and does not have a password yet. Please sign in with Google or use 'Forgot password?' to set one.",
            400
        );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        return jsonError("Invalid email or password", 401);
    }

    await createSessionCookie(user._id.toString());

    return NextResponse.json({ user: toUserDTO(user) }, { status: 200 });
}
