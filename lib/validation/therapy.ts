import { z } from "zod";

export const createMessageSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1, "Message content is required").max(4000),
    emotion: z.enum(["Anxious", "Sad", "Angry", "Hopeful", "Calm", "Neutral"]).optional(),
    confidence: z.number().min(0).max(100).optional(),
    crisisLevel: z.enum(["none", "low", "medium", "high"]).optional(),
    technique: z.string().trim().max(120).optional(),
});

export const generateReplySchema = z.object({
    emotion: z.enum(["Anxious", "Sad", "Angry", "Hopeful", "Calm", "Neutral"]),
    confidence: z.number().min(0).max(100),
    crisisLevel: z.enum(["none", "low", "medium", "high"]),
});
