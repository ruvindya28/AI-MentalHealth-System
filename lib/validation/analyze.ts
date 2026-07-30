import { z } from "zod";

export const analyzeTextSchema = z.object({
    text: z.string().trim().min(1, "Text is required").max(4000),
});
