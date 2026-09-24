"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, ShieldCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useAuth } from "@/lib/contexts/auth-context";
import { toast } from "sonner";

function VerifyOtpForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, setUser, refetch } = useAuth();

    const email = searchParams.get("email") || user?.email || "";
    const reason = searchParams.get("reason");

    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(60);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = code.trim();
        if (cleanCode.length !== 6) {
            setError("Please enter the complete 6-digit verification code");
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: cleanCode }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Invalid or expired code. Please try again.");
                setIsSubmitting(false);
                return;
            }

            if (data.user) {
                setUser(data.user);
            } else {
                await refetch();
            }

            toast.success("Email verified successfully");

            if (data.user && !data.user.hasPassword) {
                router.push("/set-password?first=true");
            } else {
                router.push("/dashboard");
            }
            router.refresh();
        } catch {
            setError("Couldn't reach the server. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || isResending) return;
        setIsResending(true);
        setError("");

        try {
            const res = await fetch("/api/auth/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Failed to resend code. Please try again.");
                setIsResending(false);
                return;
            }

            toast.success("Verification code sent", {
                description: `Check ${email} for your new 6-digit code.`,
            });
            setCooldown(60);
        } catch {
            setError("Couldn't reach the server to resend code.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <AuthLayout tagline="Keep your account safe. Verify your email to protect your privacy.">
            <div className="space-y-1 mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Security Verification
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent tracking-tight">
                    Verify Your Email
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    We sent a 6-digit verification code to{" "}
                    <span className="font-semibold text-foreground">{email || "your email address"}</span>.
                </p>
                {reason === "unverified_google_email" && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Your Google account email has not been verified yet. Please enter the OTP code we emailed you.
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label htmlFor="otp-input" className="block text-sm font-semibold">
                        Enter 6-Digit Code
                    </label>
                    <Input
                        id="otp-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="••••••"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="h-14 text-center tracking-[12px] text-2xl font-bold rounded-xl"
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-crisis/30 bg-crisis/10 px-3.5 py-2.5 text-sm font-medium text-crisis-foreground dark:text-crisis">
                        <AlertCircle className="h-4 w-4 shrink-0 text-crisis-foreground dark:text-crisis" />
                        <span>{error}</span>
                    </div>
                )}

                <Button
                    className="w-full h-11 rounded-xl font-semibold bg-linear-to-r from-primary to-primary/80 shadow-md shadow-primary/20 hover:from-primary/90 hover:to-primary cursor-pointer"
                    size="lg"
                    type="submit"
                    disabled={isSubmitting || code.length !== 6}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        "Verify & Continue"
                    )}
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldown > 0 || isResending}
                        className="text-primary hover:underline font-medium disabled:text-muted-foreground disabled:no-underline flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                    </button>

                    <Link href="/login" className="text-muted-foreground hover:text-foreground">
                        Back to Sign In
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={null}>
            <VerifyOtpForm />
        </Suspense>
    );
}
