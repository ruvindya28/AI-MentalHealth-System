"use client";

import { Container } from "@/components/ui/container";
import { VoiceSessionCard } from "@/components/voice/voice-session-card";
import { CallHistory } from "@/components/voice/call-history";
import { sessionsToCallRecords, type CallRecord } from "@/lib/voice/call-history";
import { motion } from "framer-motion";
import { MessageCircle, ArrowLeft, HeartPulse, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface RawTherapySession {
  _id: string;
  type: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    emotion?: any;
    confidence?: number;
    crisisLevel?: any;
  }[];
}

export default function VoiceStudioPage() {
  const router = useRouter();
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);

  const fetchCallHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/therapy?full=true", { cache: "no-store" });
      if (!res.ok) return;
      const { sessions } = (await res.json()) as { sessions: RawTherapySession[] };
      setCallHistory(sessionsToCallRecords(sessions));
    } catch (error) {
      console.error("Error loading voice call history:", error);
    }
  }, []);

  useEffect(() => {
    fetchCallHistory();
  }, [fetchCallHistory]);

  const handleCallEnd = () => {
    fetchCallHistory();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-24 pb-16">
      {/* Background ambient lighting glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <Container className="relative z-10 space-y-6">
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-9 w-9 shrink-0"
              onClick={() => router.back()}
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-heading bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
                  Voice Therapy Studio
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Voice AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Talk out loud in real time with your supportive AI therapist
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="outline"
              className="rounded-full gap-2 text-xs sm:text-sm font-medium border-primary/20 hover:border-primary/50"
            >
              <Link href="/therapy/new">
                <MessageCircle className="w-4 h-4 text-primary" />
                Switch to Chat Therapy
              </Link>
            </Button>
          </div>
        </div>

        {/* Feature Overview Grid: Voice Session on Left, Session History on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Voice Session Card (Larger, Focus Feature) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-8 w-full"
          >
            <VoiceSessionCard
              onCallEnd={handleCallEnd}
              className="shadow-xl shadow-primary/5 border-primary/20 rounded-3xl"
            />
          </motion.div>

          {/* Right Column: Compact Session History */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-4 w-full space-y-6"
          >
            <CallHistory calls={callHistory} className="shadow-xl shadow-primary/5 border-primary/20 rounded-3xl" />

            {/* Voice Session Benefits & Guidance Footer */}
            <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border border-primary/10 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Private & Safe Space</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Voice therapy offers a hands-free, conversational way to express thoughts and emotions. Speak naturally at your own pace — your session is confidential and protected.
              </p>
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-accent-foreground" /> Emotion Recognition Active
                </span>
                <span className="font-medium text-foreground">100% Confidential</span>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
