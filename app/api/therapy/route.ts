import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { TherapySession } from "@/lib/models/TherapySession";
import { getSessionUserId } from "@/lib/auth/session";
import { createSessionSchema } from "@/lib/validation/therapy";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function GET() {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    await connectToDatabase();

    const sessions = await TherapySession.find({ userId }).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ sessions }, { status: 200 });
}

export async function POST(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    // Existing callers (chat page) POST with no body at all — request.json()
    // throws on an empty body, so default to {} and let zod's .default("chat") apply.
    const body = await request.json().catch(() => ({}));
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectToDatabase();

    const session = await TherapySession.create({ userId, type: parsed.data.type, messages: [] });

    return NextResponse.json({ session }, { status: 201 });
}
