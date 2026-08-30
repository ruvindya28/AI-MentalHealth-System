import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

export const signupSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    email: z.email("Please enter a valid email address").trim().toLowerCase(),
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: z.email("Please enter a valid email address").trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
    email: z.email("Please enter a valid email address").trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Missing reset token"),
    password: passwordSchema,
});

export const updateProfileSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120).optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
    preferences: z
        .object({
            notifications: z.record(z.string(), z.boolean()).optional(),
            privacy: z.record(z.string(), z.boolean()).optional(),
        })
        .optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
});

