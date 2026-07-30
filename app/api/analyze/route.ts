import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { analyzeTextSchema } from "@/lib/validation/analyze";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";
import { analyzeText as analyzeTextFallback, type CrisisLevel, type Emotion } from "@/lib/mock-emotion-analyzer";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000";
const ML_SERVICE_TIMEOUT_MS = 5000;

const KNOWN_EMOTIONS: readonly Emotion[] = ["Anxious", "Sad", "Angry", "Hopeful", "Calm", "Neutral"];

interface MlServiceResponse {
    emotion: string;
    emotionConfidence: number;
    mentalHealthStatus: string;
    crisisFlag: boolean;
    keywordFlag: boolean;
}

interface AnalysisResult {
    emotion: Emotion;
    confidence: number;
    crisisLevel: CrisisLevel;
}

const ONGOING_CONCERN_STATUSES = new Set(["Depression", "Stress", "Bipolar", "Personality disorder"]);

function toCrisisLevel(result: MlServiceResponse): CrisisLevel {
    if (!result.crisisFlag) {
        return ONGOING_CONCERN_STATUSES.has(result.mentalHealthStatus) ? "low" : "none";
    }
    const mlAndKeywordAgree = result.mentalHealthStatus === "Suicidal" && result.keywordFlag;
    return mlAndKeywordAgree ? "high" : "medium";
}

async function callMlService(text: string): Promise<AnalysisResult | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ML_SERVICE_TIMEOUT_MS);

    try {
        const res = await fetch(`${ML_SERVICE_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
            signal: controller.signal,
        });
        if (!res.ok) return null;

        const data = (await res.json()) as MlServiceResponse;
        const emotion = KNOWN_EMOTIONS.includes(data.emotion as Emotion)
            ? (data.emotion as Emotion)
            : "Neutral";

        return {
            emotion,
            confidence: Math.round(data.emotionConfidence),
            crisisLevel: toCrisisLevel(data),
        };
    } catch (error) {
        console.error("ML service call failed:", error);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export async function POST(request: Request) {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Not authenticated", 401);

    const body = await request.json().catch(() => null);
    if (!body) return jsonError("Invalid request body", 400);

    const parsed = analyzeTextSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const result = (await callMlService(parsed.data.text)) ?? {
        ...analyzeTextFallback(parsed.data.text),
    };

    return NextResponse.json(result, { status: 200 });
}
