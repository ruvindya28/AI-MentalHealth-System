import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { signupSchema } from "@/lib/validation/auth";
import { toUserDTO } from "@/lib/dto/user";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { name, email, password } = parsed.data;

    await connectToDatabase();

    const existing = await User.findOne({ email }).select("+passwordHash +googleId").lean();
    if (existing) {
        if (existing.googleId && !existing.passwordHash) {
            return jsonError(
                "An account with this email was registered via Google. Please sign in with Google or reset your password to set an account password.",
                409
            );
        }
        return jsonError("An account with this email already exists. Please sign in instead.", 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
        name,
        email,
        passwordHash,
        emailVerified: false,
    });

    await createSessionCookie(user._id.toString());

    return NextResponse.json({ user: toUserDTO(user) }, { status: 201 });
}
