import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { TherapySession } from "@/lib/models/TherapySession";
import { getSessionUserId } from "@/lib/auth/session";
import { generateReplySchema } from "@/lib/validation/therapy";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";
import { generateReply as generateFallbackReply } from "@/lib/mock-therapist-responses";
import { generateTherapyReply, type HistoryMessage } from "@/lib/llm/gemini";

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

    const parsed = generateReplySchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectToDatabase();

    const session = await TherapySession.findById(sessionId);
    if (!session || session.userId.toString() !== userId) {
        return jsonError("Session not found", 404);
    }

    const analysis = parsed.data;

    // Medium/high crisis messages always get the fixed, reviewed safety
    // response — never let the LLM improvise a crisis intervention.
    const isCrisis = analysis.crisisLevel === "medium" || analysis.crisisLevel === "high";

    let reply: { text: string; technique: string };
    if (isCrisis) {
        reply = generateFallbackReply(analysis);
    } else {
        const history: HistoryMessage[] = session.messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));
        const llmReply = await generateTherapyReply(history, analysis);
        reply = llmReply ?? generateFallbackReply(analysis);
    }

    session.messages.push({
        role: "assistant",
        content: reply.text,
        technique: reply.technique,
        timestamp: new Date(),
    });
    await session.save();

    return NextResponse.json(reply, { status: 200 });
}
