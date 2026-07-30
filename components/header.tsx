"use client";

import { AudioWaveform, Menu, X, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function Header() {
    const appNavItems = [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/therapy", label: "Chat" },
        { href: "/history", label: "History" },
        { href: "/reports", label: "Reports" },
    ];

    const marketingNavItems = [
        { href: "/features", label: "Features" },
        { href: "/about", label: "About" },
    ];

    const navItems = [...appNavItems, ...marketingNavItems];

    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
            <div className="absolute inset-0 border-b border-border/60" />
            <header className="relative mx-auto max-w-6xl px-4 py-2">
                <div className="flex h-16 items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center space-x-2 transition-opacity hover:opacity-80"
                    >
                        <AudioWaveform className="h-7 w-7 text-primary animate-breathe" />
                        <span className="text-lg font-semibold font-heading bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                            MindCare
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <nav className="hidden lg:flex items-center gap-1">
                            {navItems.map((item) => {
                                const active =
                                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "relative px-3.5 py-2 text-sm font-medium transition-colors rounded-full",
                                            active
                                                ? "text-foreground bg-muted"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="flex items-center gap-2">
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                aria-label="Profile settings"
                            >
                                <Link href="/profile">
                                    <UserRound className="h-4 w-4" />
                                </Link>
                            </Button>
                            <ThemeToggle />
                            <SignInButton className="rounded-full" />

                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full lg:hidden"
                                aria-label="Toggle menu"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {isMenuOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
                {isMenuOpen && (
                    <nav className="lg:hidden border-t border-border/60 flex flex-col gap-1 py-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                )}
            </header>
        </div>
    );
}
