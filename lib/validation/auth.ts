import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    email: z.email("Please enter a valid email address").trim().toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const loginSchema = z.object({
    email: z.email("Please enter a valid email address").trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
});
