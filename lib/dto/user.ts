import type { UserDocument } from "@/lib/models/User";

export interface UserDTO {
    id: string;
    name: string;
    email: string;
    timezone: string;
}

export function toUserDTO(user: UserDocument): UserDTO {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        timezone: user.timezone,
    };
}
