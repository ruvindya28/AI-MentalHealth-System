import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Activity } from "@/lib/models/Activity";
import { getSessionUserId } from "@/lib/auth/session";
import { createActivitySchema } from "@/lib/validation/activity";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    await connectToDatabase();

    const activities = await Activity.find({ userId }).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ activities }, { status: 200 });
}

export async function POST(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = createActivitySchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectToDatabase();

    const activity = await Activity.create({ userId, ...parsed.data });

    return NextResponse.json({ activity }, { status: 201 });
}
