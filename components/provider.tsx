"use client";

import { ThemeProvider } from "next-themes";
import { WellnessProvider } from "@/lib/contexts/wellness-context";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children:
    React.ReactNode }){
        return(
            <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            >
                <WellnessProvider>
                    {children}
                    <Toaster position="bottom-right" richColors closeButton />
                </WellnessProvider>
            </ThemeProvider>
        )
    }