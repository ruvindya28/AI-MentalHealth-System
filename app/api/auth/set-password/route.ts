import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getSessionUserId } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { setPasswordSchema } from "@/lib/validation/auth";
import { toUserDTO } from "@/lib/dto/user";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = setPasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectToDatabase();
    const user = await User.findById(userId).select("+passwordHash +googleId");
    if (!user) return jsonError("User not found", 404);

    user.passwordHash = await hashPassword(parsed.data.password);
    await user.save();

    return NextResponse.json(
        {
            user: toUserDTO(user),
            message: "Password created successfully. You can now log in using your email and password.",
        },
        { status: 200 }
    );
}
