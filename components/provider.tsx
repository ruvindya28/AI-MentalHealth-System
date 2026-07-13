"use client";

import { ThemeProvider } from "next-themes";
import { WellnessProvider } from "@/lib/contexts/wellness-context";

export function Providers({ children }: { children:
    React.ReactNode }){
        return(
            <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            >
                <WellnessProvider>{children}</WellnessProvider>
            </ThemeProvider>
        )
    }