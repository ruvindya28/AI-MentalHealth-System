import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { TherapySession } from "@/lib/models/TherapySession";
import { getSessionUserId } from "@/lib/auth/session";
import { createMessageSchema } from "@/lib/validation/therapy";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const { sessionId } = await params;
    if (!isValidObjectId(sessionId)) return jsonError("Session not found", 404);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectToDatabase();

    const session = await TherapySession.findById(sessionId);
    if (!session || session.userId.toString() !== userId) {
        return jsonError("Session not found", 404);
    }

    session.messages.push({ ...parsed.data, timestamp: new Date() });
    await session.save();

    return NextResponse.json({ session }, { status: 201 });
}
