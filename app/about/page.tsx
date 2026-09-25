"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Target, Sparkles, ShieldCheck, Lock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const missions = [
  {
    icon: <Heart className="w-7 h-7 text-primary" />,
    title: "Our Mission",
    description:
      "To make emotionally-aware, accessible mental health support available to everyone, everywhere — creating a calm, judgment-free space to express feelings day or night.",
    border: "border-primary/20",
    bgColor: "bg-primary/10",
  },
  {
    icon: <Target className="w-7 h-7 text-emerald-500" />,
    title: "Our Vision",
    description:
      "A world where seeking emotional support is frictionless, private, and personal — powered by empathetic AI that listens, understands emotion, and responds with genuine care.",
    border: "border-emerald-500/20",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: <Sparkles className="w-7 h-7 text-accent-foreground" />,
    title: "Our Core Values",
    description:
      "Privacy, empathy, and scientific integrity guide everything we build. Every conversation is protected, ensuring a safe space for personal reflection and growth.",
    border: "border-accent/30",
    bgColor: "bg-accent/20",
  },
];

const pillars = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
    title: "Empathic AI Counseling",
    description: "Trained on evidence-based cognitive behavioral techniques to support active listening and structured reflection.",
  },
  {
    icon: <Lock className="w-5 h-5 text-primary" />,
    title: "Confidentiality & Privacy",
    description: "End-to-end user privacy controls. Your conversations stay strictly yours and are never sold or publicly shared.",
  },
  {
    icon: <Users className="w-5 h-5 text-primary" />,
    title: "Accessible 24/7",
    description: "No scheduling wait times or barriers. Immediate support via voice or text whenever you feel overwhelmed.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden pt-28 pb-20">
      {/* Background Ambient Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Heart className="w-3.5 h-3.5 fill-primary" /> About MindCare
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight">
            Empathetic Technology for{" "}
            <span className="bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              Everyday Emotional Wellbeing
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            We are dedicated to bridging the gap in mental health support by providing compassionate AI conversation, real-time emotion recognition, and interactive wellness tools.
          </p>
        </motion.div>

        {/* Mission / Vision / Values Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {missions.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card
                className={`p-8 h-full flex flex-col justify-between border ${item.border} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="space-y-4">
                  <div className={`w-14 h-14 rounded-2xl ${item.bgColor} flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold font-heading text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pillars / Key Guarantees Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold font-heading">What Guides Our Platform</h2>
            <p className="text-sm text-muted-foreground">Built around trust, safety, and modern conversational AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="p-6 border-border/60 bg-card/60 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {pillar.icon}
                  </div>
                  <h4 className="font-semibold text-base font-heading">{pillar.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Safety Disclaimer Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 md:p-10 border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl shadow-sm">
            <div className="max-w-3xl space-y-3">
              <h3 className="text-xl font-bold font-heading text-foreground">
                A Supportive Companion Alongside Professional Care
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                MindCare is designed to assist your daily emotional wellbeing — providing a safe space to check in, speak out loud, and track your mood trends. It is not a substitute for clinical psychiatric treatment or professional medical care. If you are experiencing a crisis, please reach out to emergency services or call a local crisis helpline.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* CTA Footer Card */}
        <div className="text-center pt-4">
          <Button asChild size="lg" className="rounded-full px-8 gap-2 font-semibold shadow-md">
            <Link href="/signup">
              Start Using MindCare Free <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
