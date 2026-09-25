"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Brain,
  Shield,
  Mic,
  Activity,
  Bot,
  LineChart,
  Heart,
  History,
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const mainFeatures = [
  {
    icon: <Bot className="w-7 h-7 text-primary" />,
    title: "AI Chat Therapy",
    badge: "Core Feature",
    description:
      "24/7 empathetic conversational counseling powered by advanced LLMs. Ready to listen, respond, and guide you through CBT exercises whenever you need to talk.",
    gradient: "from-primary/10 via-primary/5 to-transparent",
    border: "border-primary/20",
  },
  {
    icon: <Mic className="w-7 h-7 text-emerald-500" />,
    badge: "Live Voice AI",
    title: "Voice Therapy Studio",
    description:
      "Hands-free spoken voice therapy with instant speech synthesis. Talk out loud in real time with high-fidelity speech recognition and Google Gemini voice support.",
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    border: "border-emerald-500/20",
  },
  {
    icon: <Brain className="w-7 h-7 text-indigo-500" />,
    badge: "Real-time AI",
    title: "Emotion Detection",
    description:
      "Every text and spoken message is analyzed in real time for underlying emotional sentiment, confidence scores, and mood shifts to keep responses deeply attuned.",
    gradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
    border: "border-indigo-500/20",
  },
  {
    icon: <Activity className="w-7 h-7 text-red-500" />,
    badge: "Safety System",
    title: "Crisis Alert & Safety Monitor",
    description:
      "Automatic crisis detection identifies signs of distress, displaying supportive warning banners and immediate access to professional crisis helplines.",
    gradient: "from-red-500/10 via-amber-500/5 to-transparent",
    border: "border-red-500/20",
  },
  {
    icon: <LineChart className="w-7 h-7 text-blue-500" />,
    badge: "Insights",
    title: "Mood & Wellness Analytics",
    description:
      "Log your daily mood score and track longitudinal emotional wellness over time with dynamic trend sparklines, emotion distribution charts, and wellness scores.",
    gradient: "from-blue-500/10 via-cyan-500/5 to-transparent",
    border: "border-blue-500/20",
  },
  {
    icon: <History className="w-7 h-7 text-amber-500" />,
    badge: "Searchable",
    title: "Session History & Transcripts",
    description:
      "Every chat and voice call is automatically saved to an interactive timeline. Revisit complete transcript histories, emotion logs, and therapeutic insights anytime.",
    gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
    border: "border-amber-500/20",
  },
  {
    icon: <Shield className="w-7 h-7 text-emerald-600" />,
    badge: "Encrypted",
    title: "Private by Design",
    description:
      "Your mental health data is strictly private, encrypted, and never shared or sold. You maintain complete control over your history and session logs.",
    gradient: "from-emerald-600/10 via-teal-600/5 to-transparent",
    border: "border-emerald-600/20",
  },
  {
    icon: <Heart className="w-7 h-7 text-pink-500" />,
    badge: "Interactive",
    title: "Guided Wellness Activities",
    description:
      "Interactive breathing patterns, zen gardens, forest journeys, ocean wave syncs, and ambient nature soundscapes to help reset your mind in anxious moments.",
    gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
    border: "border-pink-500/20",
  },
];

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden pt-28 pb-20">
      {/* Background Lighting Effects */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Mental Health Platform
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight">
            Designed to Help You Feel{" "}
            <span className="bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              Understood & Supported
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            MindCare combines real-time emotion detection, intelligent conversational therapy, live voice AI, and crisis monitoring into one safe, accessible wellness platform.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Card
                className={`relative overflow-hidden h-full flex flex-col justify-between border ${feature.border} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} pointer-events-none`} />
                <CardContent className="relative p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-background/80 shadow-xs flex items-center justify-center border border-border/40">
                        {feature.icon}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        {feature.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold font-heading text-foreground">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call To Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent p-8 sm:p-12 shadow-lg">
            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <h2 className="text-3xl font-bold font-heading tracking-tight">
                Ready to Experience MindCare?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Start your journey towards emotional clarity and mental wellness today. Free, private, and available 24/7.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="rounded-full px-8 gap-2 font-semibold shadow-md">
                  <Link href="/signup">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8 font-semibold border-primary/30">
                  <Link href="/about">Learn About Our Mission</Link>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
