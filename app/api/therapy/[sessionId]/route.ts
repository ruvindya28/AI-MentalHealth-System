import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { TherapySession } from "@/lib/models/TherapySession";
import { getSessionUserId } from "@/lib/auth/session";
import { jsonError } from "@/lib/http/errors";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const { sessionId } = await params;
    if (!isValidObjectId(sessionId)) return jsonError("Session not found", 404);

    await connectToDatabase();

    const session = await TherapySession.findById(sessionId);
    if (!session || session.userId.toString() !== userId) {
        return jsonError("Session not found", 404);
    }

    return NextResponse.json({ session }, { status: 200 });
}
