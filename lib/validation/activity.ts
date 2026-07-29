import { z } from "zod";

export const createActivitySchema = z.object({
    type: z.string().trim().min(1, "Activity type is required").max(60),
    name: z.string().trim().min(1, "Name is required").max(120),
    durationMinutes: z.number().min(0).max(1440).optional(),
    description: z.string().trim().max(1000).optional(),
});
