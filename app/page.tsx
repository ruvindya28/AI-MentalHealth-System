"use client";

import { Ripple } from "@/components/ui/ripple";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, 
  Waves, 
  Mic, 
  BrainCircuit, 
  Lock, 
  FileText, 
  MessageSquareHeart, 
  HeartPulse, 
  TrendingUp, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { analyzeText, EMOTION_COLORS, CRISIS_COLORS } from "@/lib/mock-emotion-analyzer";

export default function Home() {
  const emotions = [
    { value: 0, label: "😔 Down", color: "from-blue-500/30" },
    { value: 25, label: "😊 Content", color: "from-emerald-500/30" },
    { value: 50, label: "🤗 Happy", color: "from-amber-500/30" },
    { value: 75, label: "😌 Peaceful", color: "from-teal-500/30" },
    { value: 100, label: "✨ Excited", color: "from-purple-500/30" },
  ];

  const features = [
    {
      icon: BrainCircuit,
      title: "Emotion & Crisis Detection",
      description: "Every conversation is analyzed in real time to understand how you feel and flag crisis situations early with supportive care.",
      color: "from-amber-500/20",
      delay: 0.1,
    },
    {
      icon: Mic,
      title: "Text & Voice Sessions",
      description: "Talk to your AI therapy companion by typing or speaking through natural voice calls, whichever feels right for you.",
      color: "from-emerald-500/20",
      delay: 0.2,
    },
    {
      icon: Lock,
      title: "Private & Secure",
      description: "Your conversations are completely confidential, client-encrypted, and securely stored to ensure full peace of mind.",
      color: "from-teal-500/20",
      delay: 0.3,
    },
    {
      icon: FileText,
      title: "Progress Reports",
      description: "Review your ongoing session summaries, emotional trends, and download comprehensive clinical PDF reports anytime.",
      color: "from-purple-500/20",
      delay: 0.4,
    }
  ];

  const howItWorks = [
    {
      icon: MessageSquareHeart,
      title: "1. Start a Session",
      description: "Begin a text or voice therapy session anytime, anywhere with zero pressure.",
    },
    {
      icon: BrainCircuit,
      title: "2. AI Understands You",
      description: "Your emotional state and sentiment nuances are analyzed in real time with empathy.",
    },
    {
      icon: HeartPulse,
      title: "3. Get Real-Time Support",
      description: "Receive evidence-based therapeutic feedback and personalized calming exercises.",
    },
    {
      icon: TrendingUp,
      title: "4. Track Your Growth",
      description: "Review your emotional history, stability metrics, and export PDF reports seamlessly.",
    },
  ];

  const [emotion, setEmotion] = useState(50);
  const [demoText, setDemoText] = useState("");

  const currentEmotion = emotions.find((em) => Math.abs(emotion - em.value) < 15) || emotions[2];
  const demoAnalysis = demoText.trim().length > 3 ? analyzeText(demoText) : null;

  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-4 flex flex-col items-center justify-center">
        {/* Ambient Glows */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className={`absolute w-[600px] h-[600px] rounded-full blur-3xl -top-20 -left-20 transition-all duration-700 ease-in-out bg-gradient-to-r ${currentEmotion.color} to-transparent opacity-40`} />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl bottom-0 right-0" />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-3xl" />
        </div>

        <Ripple className="opacity-25" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative max-w-4xl mx-auto space-y-8 text-center"
        >
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium border border-primary/25 bg-primary/10 text-primary backdrop-blur-md shadow-xs">
            <Waves className="w-4 h-4 animate-pulse" />
            <span>Your Empathetic AI Mental Health Companion</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight leading-[1.15]">
            <span className="bg-gradient-to-r from-primary via-emerald-600 to-teal-500 dark:from-primary dark:via-teal-400 dark:to-emerald-300 bg-clip-text text-transparent">
              Find Peace of Mind
            </span>
            <br />
            <span className="text-foreground">
              With Compassionate AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed font-normal">
            Experience real-time text and voice therapy support, intelligent emotion insights, and confidential guidance tailored to your mental well-being journey.
          </p>

          {/* Interactive Mood Slider Container */}
          <motion.div
            className="w-full max-w-xl mx-auto py-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <div className="p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/60 shadow-xl space-y-6">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-semibold text-foreground/90 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Whatever you&apos;re feeling today, we&apos;re here to listen
                </p>

                {/* Mood Selectors */}
                <div className="flex items-center justify-between px-2 pt-2">
                  {emotions.map((em) => {
                    const isSelected = Math.abs(emotion - em.value) < 15;
                    return (
                      <button
                        key={em.value}
                        type="button"
                        onClick={() => setEmotion(em.value)}
                        className={cn(
                          "flex flex-col items-center transition-all duration-300 cursor-pointer focus:outline-none",
                          isSelected ? "scale-110 opacity-100 font-bold" : "opacity-50 hover:opacity-80 scale-95"
                        )}
                      >
                        <span className="text-2xl sm:text-3xl filter drop-shadow-sm">{em.label.split(" ")[0]}</span>
                        <span className={cn(
                          "text-xs mt-1 transition-colors",
                          isSelected ? "text-primary font-semibold" : "text-muted-foreground"
                        )}>
                          {em.label.split(" ")[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider */}
              <div className="relative px-2">
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${currentEmotion.color} to-transparent blur-xl -z-10 transition-all duration-500`}
                />
                <Slider
                  value={[emotion]}
                  onValueChange={(value) => setEmotion(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="py-3"
                />
              </div>

              <p className="text-xs text-muted-foreground/80 font-medium">
                Slide or tap an emoji to express how you&apos;re feeling right now
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <Button
              asChild
              size="lg"
              className="h-13 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02]"
            >
              <Link href="/signup">
                <span className="font-medium flex items-center gap-2 text-base">
                  Begin Your Journey
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-13 px-8 rounded-full border-border/80 hover:bg-muted/80 font-semibold text-base transition-all duration-300"
            >
              <Link href="/features">
                <span>Explore Features</span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Live AI Interactive Preview Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="border-primary/20 bg-card/70 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-foreground">
                      See Our AI In Action
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Real-time emotion &amp; crisis analysis preview
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border-0">
                  Live Interactive Demo
                </Badge>
              </div>

              <div className="space-y-4 pt-2">
                <textarea
                  value={demoText}
                  onChange={(e) => setDemoText(e.target.value)}
                  placeholder="Type how you're feeling right now... e.g., 'I've been feeling overwhelmed and anxious about work lately...'"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-border/70 bg-background/80 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground/60 transition-all duration-200"
                />

                <AnimatePresence>
                  {demoAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex flex-wrap items-center gap-3"
                    >
                      <span
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border flex items-center gap-1.5",
                          EMOTION_COLORS[demoAnalysis.emotion].bg,
                          EMOTION_COLORS[demoAnalysis.emotion].text,
                          EMOTION_COLORS[demoAnalysis.emotion].border
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full", EMOTION_COLORS[demoAnalysis.emotion].dot)} />
                        Detected: {demoAnalysis.emotion} ({demoAnalysis.confidence}% confidence)
                      </span>
                      <span
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-background border border-border/60",
                          CRISIS_COLORS[demoAnalysis.crisisLevel].text
                        )}
                      >
                        Crisis Risk: {CRISIS_COLORS[demoAnalysis.crisisLevel].label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Interactive heuristic preview. Confidential &amp; private — no input data is stored or transmitted.</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Showcase Section ("How Mind Care Helps You") */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground">
              How Mind Care Helps You
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg font-medium">
              Empathetic AI tools designed to support your emotional health every step of the way.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: feature.delay, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="group relative overflow-hidden border border-border/60 hover:border-primary/40 transition-all duration-300 h-full bg-card/50 backdrop-blur-md rounded-3xl p-2 hover:shadow-xl hover:-translate-y-1">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 flex items-center justify-center mb-2">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 px-4 bg-muted/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto space-y-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg font-medium">
              From your very first message to deep therapeutic progress tracking.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12, duration: 0.5 }}
                viewport={{ once: true }}
                className="relative text-center space-y-4 p-6 rounded-3xl bg-card/60 border border-border/50 backdrop-blur-md shadow-xs"
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-r from-primary/15 via-primary/10 to-teal-500/15 border border-primary/25 shadow-2xl space-y-6"
          >
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground">
                Ready to Start Your Mental Health Journey?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
                Join thousands who find emotional clarity, stress relief, and 24/7 empathetic support with Mind Care.
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300"
              >
                <Link href="/signup">
                  <span className="flex items-center gap-2">
                    Get Started Now
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-full border-border/80 hover:bg-muted font-semibold transition-all duration-300"
              >
                <Link href="/login">
                  <span>Sign In</span>
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% Confidential
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 24/7 Availability
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Voice &amp; Text Capable
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}