"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";
import type { UserDTO } from "@/lib/dto/user";

interface ProvidersProps {
    children: React.ReactNode;
    initialUser: UserDTO | null;
}

export function Providers({ children, initialUser }: ProvidersProps){
        return(
            <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            >
                <AuthProvider initialUser={initialUser}>
                    {children}
                    <Toaster position="bottom-right" richColors closeButton />
                </AuthProvider>
            </ThemeProvider>
        )
    }