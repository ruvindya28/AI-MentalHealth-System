"use client"

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {Lock ,Mail } from "lucide-react";
import Link from "next/link";


export default function LoginPage(){
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    return(
        <div className="min-h-screen w-full flex items-center bg-gradient-to-r from-primary/10 via-background to-secondary/30">
            <Container className="flex flex-col items-center justify-center w-full">
                <Card className="w-full md:w-5/12 max-w-2xl p-8 md:p-10 rounded-3xl shadow-2xl border border-primary/10 bg-card/90 backdrop-blur-lg mt-12">
                    <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-1 tracking-tight">Sign Up</h1>
                    <p className="text-base text-muted-foreground font-medium">
                        Create your account to start your journey with us.
                    </p>
                    <div>
                        <form className="space-y-3">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label htmlFor="name" className="block text-base font-semibold mb-1">
                                        Full Name
                                    </label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)} required
                                        className="py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary focus:outline-none focus:ring-2 focus:ring-primarytext-white placeholder:text-muted-foreground w-full"
                                    />
                                </div>
                            </div>
                           <div>
                            </div>
                            <div>
                            <label htmlFor="email" className="block text-base font-semibold mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)} required
                                    className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary focus:outline-none focus:ring-2 focus:ring-primarytext-white placeholder:text-muted-foreground"
                                />
                            </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-base font-semibold mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)} required
                                        className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary focus:outline-none focus:ring-2 focus:ring-primarytext-white placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-base font-semibold mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)} required
                                        className="pl-12 py-2 text-base rounded-xl bg-card bg-opacity-80 border border-primary focus:outline-none focus:ring-2 focus:ring-primarytext-white placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                    <Button className="w-full py-2 text-base rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 shadow-md hover:from-primary/80 hover:to-primary"
                    size="lg"
                    type="button">
                        Sign Up
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="text-muted-foreground">Already have an account?</span>
                        <Link href="/signup" className="text-primary font-medium underline">Sign In</Link>
                        <span className="text-muted-foreground">.</span>
                        <Link href="/forgot-password" className="text-primary underline">Forgot Password?</Link>
                    </div>
                    </Card>
                    </Container>
        </div>
    )
}
