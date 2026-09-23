import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { analyzeTextSchema } from "@/lib/validation/analyze";
import { jsonError, zodErrorResponse } from "@/lib/http/errors";
import { analyzeText as analyzeTextFallback, type CrisisLevel, type Emotion } from "@/lib/mock-emotion-analyzer";
import { classifyEmotionSemantically } from "@/lib/llm/emotion-classifier";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000";
const ML_SERVICE_TIMEOUT_MS = 5000;

const KNOWN_EMOTIONS: readonly Emotion[] = [
    "Anxious",
    "Sad",
    "Angry",
    "Hopeful",
    "Calm",
    "Neutral",
    "Unknown",
];

interface MlServiceResponse {
    emotion: string;
    emotionConfidence: number;
    mentalHealthStatus: string;
    crisisFlag: boolean;
    keywordFlag: boolean;
    analysisStatus?: string;
}

interface AnalysisResult {
    emotion: Emotion;
    confidence: number;
    crisisLevel: CrisisLevel;
    analysisStatus?: string;
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
            : "Unknown";

        return {
            emotion,
            confidence: Math.round(data.emotionConfidence),
            crisisLevel: toCrisisLevel(data),
            analysisStatus: data.analysisStatus ?? "ok",
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

    const mlResult = await callMlService(parsed.data.text);
    if (mlResult && mlResult.emotion !== "Unknown" && mlResult.analysisStatus === "ok") {
        return NextResponse.json(mlResult, { status: 200 });
    }

    // Semantic Disambiguation: For conversational phrases where the statistical
    // n-gram model is uncertain or diffuse, query Gemini Flash-Lite to categorize
    // into the 6 canonical research emotion classes with full contextual understanding.
    const semanticResult = await classifyEmotionSemantically(parsed.data.text);
    if (semanticResult && semanticResult.emotion !== "Unknown") {
        return NextResponse.json(
            {
                emotion: semanticResult.emotion,
                confidence: semanticResult.confidence,
                crisisLevel: mlResult ? mlResult.crisisLevel : "none",
                analysisStatus: "ok",
            },
            { status: 200 }
        );
    }

    const fallbackResult = analyzeTextFallback(parsed.data.text);
    if (fallbackResult.emotion !== "Unknown" || !mlResult) {
        return NextResponse.json(fallbackResult, { status: 200 });
    }

    return NextResponse.json(mlResult, { status: 200 });
}
