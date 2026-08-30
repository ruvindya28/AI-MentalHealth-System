import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getSessionUserId } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validation/auth";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectToDatabase();
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) return jsonError("User not found", 404);

    const isMatch = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!isMatch) {
        return jsonError("Current password does not match", 400);
    }

    user.passwordHash = await hashPassword(parsed.data.newPassword);
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
}
