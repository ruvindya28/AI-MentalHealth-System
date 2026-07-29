import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { MoodEntry } from "@/lib/models/MoodEntry";
import { getSessionUserId } from "@/lib/auth/session";
import { createMoodEntrySchema } from "@/lib/validation/mood";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    await connectToDatabase();

    const entries = await MoodEntry.find({ userId }).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ entries }, { status: 200 });
}

export async function POST(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = createMoodEntrySchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectToDatabase();

    const entry = await MoodEntry.create({ userId, ...parsed.data });

    return NextResponse.json({ entry }, { status: 201 });
}
