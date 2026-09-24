import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { getSessionUserId } from "@/lib/auth/session";
import { toUserDTO, type UserDTO } from "@/lib/dto/user";

// Server-only: reads the session cookie via next/headers, must not be imported from client components.
export async function getCurrentUser(): Promise<UserDTO | null> {
    const userId = await getSessionUserId();
    if (!userId) return null;

    await connectToDatabase();
    const user = await User.findById(userId).select("+passwordHash +googleId");
    return user ? toUserDTO(user) : null;
}