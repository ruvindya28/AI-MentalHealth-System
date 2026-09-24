"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, KeyRound, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/lib/contexts/auth-context";
import { toast } from "sonner";

function SetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, setUser, refetch } = useAuth();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fromPath = searchParams.get("from") || "/dashboard";

    // If user already has a password, direct them to dashboard unless they explicitly came to reset
    useEffect(() => {
        if (user && user.hasPassword && !searchParams.get("force")) {
            router.replace(fromPath);
        }
    }, [user, router, fromPath, searchParams]);

    const handleSkip = () => {
        router.push(fromPath);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Failed to set password. Please try again.");
                setIsSubmitting(false);
                return;
            }

            if (data.user) {
                setUser(data.user);
            } else {
                await refetch();
            }

            toast.success("Password created successfully", {
                description: "You can now log in using either Google or your email and password.",
            });

            router.push(fromPath);
            router.refresh();
        } catch {
            setError("Couldn't reach the server. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout tagline="Your account is ready. Add a password for complete flexibility.">
            <div className="space-y-1 mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
                    <KeyRound className="w-3.5 h-3.5" />
                    Account Security
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent tracking-tight">
                    Set Up a Password
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    You signed in with Google. You can optionally create a password to log in directly with your email anytime.
                </p>
            </div>

            {user && (
                <div className="mb-5 p-3 rounded-xl border border-border/70 bg-muted/40 flex items-center gap-3">
                    <UserAvatar
                        src={user.image}
                        name={user.name}
                        className="w-10 h-10 ring-2 ring-primary/20 shrink-0"
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-semibold">
                        Create Password
                    </label>
                    <PasswordInput
                        id="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="At least 8 characters"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold">
                        Confirm Password
                    </label>
                    <PasswordInput
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Re-enter password"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-crisis/30 bg-crisis/10 px-3.5 py-2.5 text-sm font-medium text-crisis-foreground dark:text-crisis">
                        <AlertCircle className="h-4 w-4 shrink-0 text-crisis-foreground dark:text-crisis" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-2 pt-2">
                    <Button
                        className="w-full h-11 rounded-xl font-semibold bg-linear-to-r from-primary to-primary/80 shadow-md shadow-primary/20 hover:from-primary/90 hover:to-primary cursor-pointer"
                        size="lg"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving password...
                            </>
                        ) : (
                            "Create Password"
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground text-sm cursor-pointer"
                    >
                        Skip for now & continue
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <SetPasswordForm />
        </Suspense>
    );
}
