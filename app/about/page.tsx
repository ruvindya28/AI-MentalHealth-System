"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Heart, Target, Sparkles } from "lucide-react";

const missions = [
  {
    icon: <Heart className="w-8 h-8 text-primary" />,
    title: "Our Mission",
    description:
      "To make emotionally-aware mental health support available to everyone, everywhere — a calm, judgment-free space to be heard, day or night.",
  },
  {
    icon: <Target className="w-8 h-8 text-primary" />,
    title: "Our Vision",
    description:
      "A world where reaching out for support is easy, private, and personal — powered by AI that listens, understands, and responds with genuine care.",
  },
  {
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    title: "Our Values",
    description:
      "Privacy, empathy, and trust guide everything we build, so every conversation feels safe, supportive, and truly yours.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-20 space-y-4"
      >
        <h1 className="text-4xl font-bold font-heading bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          About MindCare
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We&apos;re building a calmer way to access emotional support — combining
          empathetic AI conversation with real emotion and crisis awareness.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {missions.map((mission, index) => (
          <motion.div
            key={mission.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-8 text-center h-full hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  {mission.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold font-heading mb-3">{mission.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{mission.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 md:p-10 bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10">
          <h2 className="text-2xl font-semibold font-heading mb-3">Not a replacement for care — a companion alongside it</h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            MindCare is designed to support your everyday emotional wellbeing: a space to
            check in, talk things through, and track how you&apos;re feeling over time. It is
            not a substitute for professional mental health treatment. If you&apos;re in
            crisis, please reach out to a local emergency service or crisis line.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
