"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, User, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { useAuth } from "@/lib/contexts/auth-context";

export default function SignupPage(){
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { setUser } = useAuth();

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
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
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

    return(
        <AuthLayout tagline="Start your journey. Personalized, private support whenever you need it.">
            <div className="space-y-1 mb-6">
                <h1 className="text-2xl md:text-3xl font-extrabold bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent tracking-tight">
                    Create Your Account
                </h1>
                <p className="text-sm text-muted-foreground">
                    Start your journey with us, it&apos;s free.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-sm font-semibold">
                        Full Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="pl-10 h-11 rounded-xl"
                        />
                    </div>
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-sm font-semibold">
                            Password
                        </label>
                        <PasswordInput id="password" value={password} onChange={setPassword} />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold">
                            Confirm Password
                        </label>
                        <PasswordInput
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            placeholder="Confirm password"
                        />
                    </div>
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
                            Creating account...
                        </>
                    ) : (
                        "Sign Up"
                    )}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                    Sign In
                </Link>
            </p>
        </AuthLayout>
    )
}
