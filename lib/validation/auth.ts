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
    image: z.string().trim().max(2000).optional().nullable(),
    imageSource: z.enum(["google", "upload", "custom"]).optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
    preferences: z
        .object({
            notifications: z.record(z.string(), z.boolean()).optional(),
            privacy: z.record(z.string(), z.boolean()).optional(),
        })
        .optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required").optional(),
    newPassword: passwordSchema,
});

export const setPasswordSchema = z.object({
    password: passwordSchema,
});

export const verifyOtpSchema = z.object({
    email: z.string().email("Please enter a valid email address").trim().toLowerCase().optional(),
    code: z.string().trim().regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

export const resendOtpSchema = z.object({
    email: z.string().email("Please enter a valid email address").trim().toLowerCase().optional(),
});

