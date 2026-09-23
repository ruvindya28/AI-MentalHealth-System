import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { TherapySession } from "@/lib/models/TherapySession";
import { getSessionUserId } from "@/lib/auth/session";
import { generateReplySchema } from "@/lib/validation/therapy";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";
import { generateReply as generateFallbackReply } from "@/lib/mock-therapist-responses";
import { generateTherapyReply, type HistoryMessage } from "@/lib/llm/gemini";
import { classifyIntent } from "@/lib/dialogue/intent";

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

    const userMessageText = parsed.data.userMessage || [...session.messages].reverse().find((m) => m.role === "user")?.content;

    // Fast-path: Greetings, pleasantries, closures, and unknown/OOD words are answered instantly
    // (sub-50ms) using the evidence-based dialogue engine, avoiding external LLM network latency.
    const intent = userMessageText ? classifyIntent(userMessageText) : "disclosure";
    const isDirectIntent =
        analysis.emotion === "Neutral" &&
        (intent === "greeting" || intent === "pleasantry" || intent === "closure");
    let reply: { text: string; technique: string };
    if (isCrisis || isDirectIntent) {
        reply = generateFallbackReply(analysis, userMessageText);
    } else {
        // For personal emotional disclosures, call Gemini with a lean sliding window
        const history: HistoryMessage[] = session.messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
        }));
        // Ensure history always ends with the user turn
        const lastMsg = history[history.length - 1];
        if ((!lastMsg || lastMsg.role !== "user") && userMessageText) {
            history.push({ role: "user", content: userMessageText });
        }
        const llmReply = await generateTherapyReply(history, analysis);
        reply = llmReply ?? generateFallbackReply(analysis, userMessageText);
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
