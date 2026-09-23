import { z } from "zod";

export const createSessionSchema = z.object({
    type: z.enum(["chat", "voice"]).default("chat"),
});

export const createMessageSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1, "Message content is required").max(4000),
    emotion: z.enum(["Anxious", "Sad", "Angry", "Hopeful", "Calm", "Neutral", "Unknown"]).optional(),
    confidence: z.number().min(0).max(100).optional(),
    crisisLevel: z.enum(["none", "low", "medium", "high"]).optional(),
    technique: z.string().trim().max(120).optional(),
});

export const generateReplySchema = z.object({
    emotion: z.enum(["Anxious", "Sad", "Angry", "Hopeful", "Calm", "Neutral", "Unknown"]),
    confidence: z.number().min(0).max(100),
    crisisLevel: z.enum(["none", "low", "medium", "high"]),
    userMessage: z.string().trim().max(4000).optional(),
});

export const updateSessionSchema = z.object({
    durationSeconds: z.number().min(0).max(86400).optional(),
    dominantEmotion: z.enum(["Anxious", "Sad", "Angry", "Hopeful", "Calm", "Neutral", "Unknown"]).optional(),
});
