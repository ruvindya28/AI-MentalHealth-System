import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getSessionUserId } from "@/lib/auth/session";
import { toUserDTO } from "@/lib/dto/user";
import { jsonError } from "@/lib/http/errors";

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return jsonError("Not authenticated", 401);

    return NextResponse.json({ user: toUserDTO(user) }, { status: 200 });
}
