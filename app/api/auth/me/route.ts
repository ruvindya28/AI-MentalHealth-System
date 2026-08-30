import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getSessionUserId } from "@/lib/auth/session";
import { toUserDTO } from "@/lib/dto/user";
import { updateProfileSchema } from "@/lib/validation/auth";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return jsonError("Not authenticated", 401);

    return NextResponse.json({ user: toUserDTO(user) }, { status: 200 });
}

export async function PATCH(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return jsonError("User not found", 404);

    const { name, timezone, preferences } = parsed.data;

    if (name !== undefined) user.name = name;
    if (timezone !== undefined) user.timezone = timezone;
    if (preferences !== undefined) {
        const currentPrefs = (user as unknown as { preferences?: Record<string, unknown> }).preferences || {};
        const updatedPrefs = {
            ...currentPrefs,
            notifications: {
                ...((currentPrefs as { notifications?: Record<string, boolean> }).notifications || {}),
                ...(preferences.notifications || {}),
            },
            privacy: {
                ...((currentPrefs as { privacy?: Record<string, boolean> }).privacy || {}),
                ...(preferences.privacy || {}),
            },
        };
        (user as unknown as { preferences: unknown }).preferences = updatedPrefs;
        user.markModified("preferences");
    }

    await user.save();

    return NextResponse.json(
        { user: toUserDTO(user), message: "Profile updated successfully" },
        { status: 200 }
    );
}

