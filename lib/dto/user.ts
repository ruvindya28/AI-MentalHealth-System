import type { UserDocument } from "@/lib/models/User";

export interface UserDTO {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    imageSource?: "google" | "upload" | "custom" | null;
    emailVerified?: boolean;
    hasPassword?: boolean;
    hasGoogleLinked?: boolean;
    timezone: string;
    createdAt?: string;
    preferences?: {
        notifications?: Record<string, boolean>;
        privacy?: Record<string, boolean>;
    };
}

export function toUserDTO(user: UserDocument): UserDTO {
    const rawUser = user as unknown as {
        _id: { toString(): string };
        name: string;
        email: string;
        image?: string | null;
        imageSource?: "google" | "upload" | "custom" | null;
        emailVerified?: boolean;
        passwordHash?: string | null;
        googleId?: string | null;
        hasPassword?: boolean;
        hasGoogleLinked?: boolean;
        timezone?: string;
        createdAt?: Date | string;
        preferences?: {
            notifications?: Record<string, boolean> | Map<string, boolean>;
            privacy?: Record<string, boolean> | Map<string, boolean>;
        };
    };

    const parseMapOrObj = (val?: Record<string, boolean> | Map<string, boolean>) => {
        if (!val) return undefined;
        if (val instanceof Map) return Object.fromEntries(val);
        if (typeof val === "object") return { ...val };
        return undefined;
    };

    const hasPassword =
        typeof rawUser.hasPassword === "boolean"
            ? rawUser.hasPassword
            : Boolean(rawUser.passwordHash);

    const hasGoogleLinked =
        typeof rawUser.hasGoogleLinked === "boolean"
            ? rawUser.hasGoogleLinked
            : Boolean(rawUser.googleId);

    return {
        id: rawUser._id.toString(),
        name: rawUser.name,
        email: rawUser.email,
        image: rawUser.image ?? null,
        imageSource: rawUser.imageSource ?? null,
        emailVerified: Boolean(rawUser.emailVerified),
        hasPassword,
        hasGoogleLinked,
        timezone: rawUser.timezone || "UTC",
        createdAt: rawUser.createdAt ? new Date(rawUser.createdAt).toISOString() : undefined,
        preferences: rawUser.preferences
            ? {
                  notifications: parseMapOrObj(rawUser.preferences.notifications),
                  privacy: parseMapOrObj(rawUser.preferences.privacy),
              }
            : undefined,
    };
}
