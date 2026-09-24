"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useAuth } from "@/lib/contexts/auth-context";

function LoginForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const fromPath = searchParams.get("from") || "/dashboard";
    const [error, setError] = useState(() => searchParams.get("error") || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Something went wrong. Please try again.");
                setIsSubmitting(false);
                return;
            }

            setUser(data.user);
            router.push(fromPath);
            router.refresh();
        } catch {
            setError("Couldn't reach the server. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout tagline="Welcome back. Continue your journey toward a calmer mind.">
            <div className="space-y-1 mb-6">
                <h1 className="text-2xl md:text-3xl font-extrabold bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent tracking-tight">
                    Sign In
                </h1>
                <p className="text-sm text-muted-foreground">
                    Please sign in to continue your journey.
                </p>
            </div>

            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-crisis/30 bg-crisis/10 px-3.5 py-2.5 text-sm font-medium text-crisis-foreground dark:text-crisis">
                    <AlertCircle className="h-4 w-4 shrink-0 text-crisis-foreground dark:text-crisis" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-4">
                <GoogleSignInButton text="Sign in with Google" from={fromPath} />

                <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/60" />
                    </div>
                    <span className="relative bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
                        or with email
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-semibold">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-10 h-11 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-semibold">
                                Password
                            </label>
                            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <PasswordInput id="password" value={password} onChange={setPassword} />
                    </div>

                    <Button
                        className="w-full h-11 rounded-xl font-semibold bg-linear-to-r from-primary to-primary/80 shadow-md shadow-primary/20 hover:from-primary/90 hover:to-primary cursor-pointer"
                        size="lg"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                    Sign Up
                </Link>
            </p>
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
