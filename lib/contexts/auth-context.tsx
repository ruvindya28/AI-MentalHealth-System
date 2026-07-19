"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { UserDTO } from "@/lib/dto/user";

interface AuthContextValue {
    user: UserDTO | null;
    setUser: (user: UserDTO | null) => void;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
    initialUser: UserDTO | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
    const [user, setUser] = useState<UserDTO | null>(initialUser);

    const refetch = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            setUser(res.ok ? (await res.json()).user : null);
        } catch {
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, refetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}