"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";

const features = [
  {
    icon: <Bot className="w-8 h-8 text-primary" />,
    title: "AI Therapy Chat",
    description:
      "24/7 access to an empathetic AI conversation partner, ready to listen and respond whenever you need to talk something through.",
  },
  {
    icon: <Mic className="w-8 h-8 text-primary" />,
    title: "Voice Sessions",
    description:
      "Prefer talking to typing? Start a voice session and speak freely — the same understanding, a more natural conversation.",
  },
  {
    icon: <Brain className="w-8 h-8 text-primary" />,
    title: "Emotion Detection",
    description:
      "Every message is gently analyzed to understand how you're feeling, so responses stay attuned to your emotional state.",
  },
  {
    icon: <Activity className="w-8 h-8 text-primary" />,
    title: "Crisis Detection",
    description:
      "Conversations are monitored for signs of distress, with supportive guidance and emergency resources surfaced when it matters most.",
  },
  {
    icon: <LineChart className="w-8 h-8 text-primary" />,
    title: "Mood & Wellness Tracking",
    description:
      "Log how you feel and watch your emotional trends unfold over time, with a wellness score that reflects your overall journey.",
  },
  {
    icon: <History className="w-8 h-8 text-primary" />,
    title: "Conversation History",
    description:
      "Every session is saved to a searchable timeline, so you can revisit past conversations and notice patterns as they emerge.",
  },
  {
    icon: <Shield className="w-8 h-8 text-primary" />,
    title: "Private by Design",
    description:
      "Your conversations stay yours — encrypted, confidential, and never shared without your say.",
  },
  {
    icon: <Heart className="w-8 h-8 text-primary" />,
    title: "Guided Wellness Activities",
    description:
      "Breathing exercises, calming soundscapes, and mindful mini-games to help you reset in the moment.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16 space-y-4"
      >
        <h1 className="text-4xl font-bold font-heading bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Platform Features
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Everything MindCare offers to help you feel understood, supported, and in
          tune with your own emotional wellbeing.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
          >
            <Card className="p-6 h-full hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold font-heading mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center mt-20"
      >
        <h2 className="text-2xl font-semibold font-heading mb-3">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-8">
          Take the first step toward a calmer, more understood you.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 transition-colors"
        >
          Start Your Journey
          <Heart className="ml-2 w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  );
}
