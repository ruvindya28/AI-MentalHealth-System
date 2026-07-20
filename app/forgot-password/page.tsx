"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            // Always shown as success, even if the email doesn't exist —
            // the API response is intentionally the same either way.
            setIsSent(true);
            toast.success("Reset link sent", {
                description: `Check ${email} for instructions.`,
            });
        } catch {
            toast.error("Couldn't reach the server. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout tagline="Forgot something? That's okay — let's get you back in gently.">
            {isSent ? (
                <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                        <MailCheck className="h-6 w-6 text-success" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold font-heading tracking-tight">
                            Check your email
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            We&apos;ve sent password reset instructions to{" "}
                            <span className="font-medium text-foreground">{email}</span>.
                        </p>
                    </div>
                    <Link href="/login">
                        <Button variant="outline" className="w-full h-11 rounded-xl">
                            Back to Sign In
                        </Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-1 mb-6">
                        <h1 className="text-2xl md:text-3xl font-extrabold bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent tracking-tight">
                            Reset Password
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </p>
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

                        <Button
                            className="w-full h-11 rounded-xl font-semibold bg-linear-to-r from-primary to-primary/80 shadow-md shadow-primary/20 hover:from-primary/90 hover:to-primary"
                            size="lg"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending link...
                                </>
                            ) : (
                                "Send Reset Link"
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
            )}
        </AuthLayout>
    );
}
