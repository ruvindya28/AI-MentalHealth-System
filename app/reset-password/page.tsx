"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { useAuth } from "@/lib/contexts/auth-context";

function ResetPasswordForm() {
    const token = useSearchParams().get("token");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { setUser } = useAuth();

    if (!token) {
        return (
            <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-crisis/10">
                    <ShieldAlert className="h-6 w-6 text-crisis-foreground dark:text-crisis" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold font-heading tracking-tight">
                        Missing reset link
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        This page needs a valid reset token. Request a new link to continue.
                    </p>
                </div>
                <Link href="/forgot-password">
                    <Button className="w-full h-11 rounded-xl">Request New Link</Button>
                </Link>
            </div>
        );
    }

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
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Something went wrong. Please try again.");
                setIsSubmitting(false);
                return;
            }

            setUser(data.user);
            router.push("/dashboard");
            router.refresh();
        } catch {
            setError("Couldn't reach the server. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="space-y-1 mb-6">
                <h1 className="text-2xl md:text-3xl font-extrabold bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent tracking-tight">
                    Set a New Password
                </h1>
                <p className="text-sm text-muted-foreground">
                    Choose a new password for your account.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-semibold">
                        New Password
                    </label>
                    <PasswordInput id="password" value={password} onChange={setPassword} />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold">
                        Confirm New Password
                    </label>
                    <PasswordInput
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Confirm password"
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-crisis/30 bg-crisis/10 px-3.5 py-2.5 text-sm font-medium text-crisis-foreground dark:text-crisis">
                        <AlertCircle className="h-4 w-4 shrink-0 text-crisis-foreground dark:text-crisis" />
                        {error}
                    </div>
                )}

                <Button
                    className="w-full h-11 rounded-xl font-semibold bg-linear-to-r from-primary to-primary/80 shadow-md shadow-primary/20 hover:from-primary/90 hover:to-primary"
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating password...
                        </>
                    ) : (
                        "Update Password"
                    )}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
                Remembered your password?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                    Sign In
                </Link>
            </p>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout tagline="Almost there. Set a fresh password and get back to feeling steady.">
            <Suspense fallback={null}>
                <ResetPasswordForm />
            </Suspense>
        </AuthLayout>
    );
}
