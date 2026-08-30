import type { UserDocument } from "@/lib/models/User";

export interface UserDTO {
    id: string;
    name: string;
    email: string;
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

    return {
        id: rawUser._id.toString(),
        name: rawUser.name,
        email: rawUser.email,
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
