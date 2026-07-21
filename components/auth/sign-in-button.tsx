"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { toast } from "sonner";

interface SignInButtonProps {
    className?: string;
}

export function SignInButton({ className }: SignInButtonProps) {
    const { user, setUser } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    if (!user) {
        return (
            <Button asChild className={className}>
                <Link href="/login">Sign In</Link>
            </Button>
        );
    }

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            if (!res.ok) {
                throw new Error("Logout request failed");
            }
            setUser(null);
            router.push("/login");
            router.refresh();
        } catch {
            toast.error("Couldn't sign out. Please try again.");
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <Button
            variant="outline"
            className={className}
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Sign out"
        >
            {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <LogOut className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Sign Out</span>
        </Button>
    );
}
