import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { TherapySession } from "@/lib/models/TherapySession";
import { getSessionUserId } from "@/lib/auth/session";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";
import { updateSessionSchema } from "@/lib/validation/therapy";

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

    const sessionObj = session.toObject();
    if (sessionObj.messages && Array.isArray(sessionObj.messages)) {
        for (const msg of sessionObj.messages) {
            if (msg.role === "user" && msg.emotion === "Unknown" && (msg.crisisLevel === "high" || msg.crisisLevel === "medium")) {
                msg.emotion = "Sad";
                msg.confidence = msg.confidence || (msg.crisisLevel === "high" ? 95 : 85);
            }
        }
    }

    return NextResponse.json({ session: sessionObj }, { status: 200 });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const { sessionId } = await params;
    if (!isValidObjectId(sessionId)) return jsonError("Session not found", 404);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = updateSessionSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectToDatabase();

    const session = await TherapySession.findById(sessionId);
    if (!session || session.userId.toString() !== userId) {
        return jsonError("Session not found", 404);
    }

    if (parsed.data.durationSeconds !== undefined) {
        session.durationSeconds = parsed.data.durationSeconds;
    }
    if (parsed.data.dominantEmotion !== undefined) {
        session.dominantEmotion = parsed.data.dominantEmotion;
    }

    await session.save();

    return NextResponse.json({ session }, { status: 200 });
}
