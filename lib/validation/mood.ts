import { z } from "zod";

export const createMoodEntrySchema = z.object({
    moodScore: z.number().min(0).max(100),
    note: z.string().trim().max(1000).optional(),
});
