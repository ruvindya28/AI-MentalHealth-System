import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { TherapySession } from "@/lib/models/TherapySession";
import { getSessionUserId } from "@/lib/auth/session";
import { jsonError } from "@/lib/http/errors";

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    await connectToDatabase();

    const sessions = await TherapySession.find({ userId }).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ sessions }, { status: 200 });
}

export async function POST() {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    await connectToDatabase();

    const session = await TherapySession.create({ userId, type: "chat", messages: [] });

    return NextResponse.json({ session }, { status: 201 });
}
