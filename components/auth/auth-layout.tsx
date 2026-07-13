"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { AudioWaveform, ShieldCheck, HeartPulse, Lock, Sparkles } from "lucide-react";
import { Ripple } from "@/components/ui/ripple";

interface AuthLayoutProps {
  children: ReactNode;
  tagline: string;
}

const TRUST_POINTS = [
  { icon: Lock, label: "Private & encrypted conversations" },
  { icon: Sparkles, label: "AI-powered emotional support" },
  { icon: HeartPulse, label: "Available anytime, anywhere" },
];

export function AuthLayout({ children, tagline }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row pt-20">
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-primary/15 via-secondary/20 to-background items-center justify-center p-12">
        <Ripple className="opacity-30" />
        <div className="relative z-10 max-w-sm space-y-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-foreground hover:opacity-80 transition-opacity">
            <AudioWaveform className="w-7 h-7 text-primary" />
            MindCare
          </Link>
          <p className="text-xl text-foreground/90 leading-relaxed font-medium">
            {tagline}
          </p>
          <div className="space-y-3">
            {TRUST_POINTS.map((point) => (
              <div key={point.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <point.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground/80">{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start lg:items-center justify-center p-6 sm:p-10 pt-10 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 text-xl font-bold text-foreground mb-8 justify-center">
            <AudioWaveform className="w-6 h-6 text-primary" />
            MindCare
          </div>
          {children}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Your data is encrypted and kept confidential
          </div>
        </div>
      </div>
    </div>
  );
}
