import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { TherapySession } from "@/lib/models/TherapySession";
import { getSessionUserId } from "@/lib/auth/session";
import { createSessionSchema } from "@/lib/validation/therapy";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";

export async function GET(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const wantFull = searchParams.get("full") === "true";
    const typeFilter = searchParams.get("type");

    const filter: Record<string, unknown> = { userId };
    if (typeFilter === "chat" || typeFilter === "voice") {
        filter.type = typeFilter;
    }

    const rawSessions = await TherapySession.find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

    if (wantFull) {
        // Full payload — callers like History and Reports need message content
        return NextResponse.json({ sessions: rawSessions }, { status: 200 });
    }

    // Slim projection for sidebar — avoids shipping full message arrays
    const sessions = rawSessions.map((s) => {
        const SEVERITY: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
        let crisisLevel = "none";
        let preview = "";
        for (const m of s.messages ?? []) {
            if (m.role === "user" && !preview) {
                preview = (m.content ?? "").slice(0, 80);
            }
            const lvl = (m.crisisLevel as string) ?? "none";
            if ((SEVERITY[lvl] ?? 0) > (SEVERITY[crisisLevel] ?? 0)) {
                crisisLevel = lvl;
            }
        }
        return {
            _id: s._id,
            type: s.type,
            createdAt: s.createdAt,
            durationSeconds: s.durationSeconds ?? 0,
            dominantEmotion: s.dominantEmotion ?? null,
            crisisLevel,
            preview,
            messages: [],
        };
    });

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
