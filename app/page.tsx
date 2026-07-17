"use client";

import { Ripple } from "@/components/ui/ripple";
import { useState } from "react";
import {motion, AnimatePresence} from 'framer-motion';
import Link from "next/link";
import { ArrowRight, Waves, Mic, BrainCircuit, Lock, FileText, MessageSquareHeart, HeartPulse, TrendingUp } from "lucide-react";
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

export default function Home(){
  const emotions = [
    {value : 0, label: "😔 Down", color:"from-emotion-sad/50" },
    {value : 25, label: "😊 Content", color:"from-secondary/50" },
    {value : 50, label: "🤗 Happy", color:"from-primary/50" },
    {value : 75, label: "😌 Peaceful", color:"from-accent/50" },
    {value : 100, label: "✨ Excited", color:"from-warning/50" },

  ];

  const features = [
    {
      icon: BrainCircuit,
      title: "Emotion & Crisis Detection",
      description: "Every conversation is analyzed in real time to understand how you feel and flag crisis situations early",
      color: "from-warning/20",
      delay:0.2,
    },
    {
      icon: Mic,
      title: "Text & Voice Sessions",
      description: "Talk to your AI therapist by typing or speaking, whatever feels most comfortable",
      color: "from-accent/20",
      delay:0.4,
    },
    {
      icon: Lock,
      title: "Private & Secure",
      description: "Your conversations are always confidential, encrypted, and securely stored",
      color: "from-success/20",
      delay:0.6,
    },
    {
      icon: FileText,
      title: "Progress Reports",
      description: "Review your conversation history and download PDF mental health reports anytime",
      color: "from-secondary/20",
      delay:0.8,
    }
  ]

  const howItWorks = [
    {
      icon: MessageSquareHeart,
      title: "Start a Session",
      description: "Begin a text or voice therapy session anytime, anywhere",
    },
    {
      icon: BrainCircuit,
      title: "AI Understands You",
      description: "Your emotional state and crisis level are analyzed in real time",
    },
    {
      icon: HeartPulse,
      title: "Get Support",
      description: "Receive a personalized, empathetic response tailored to how you feel",
    },
    {
      icon: TrendingUp,
      title: "Track Your Progress",
      description: "Review your history and download PDF reports from your dashboard",
    },
  ]

  const [emotion, setEmotion] = useState(50);
  const [demoText, setDemoText] = useState("");

  const currentEmotion = emotions.find((em) => Math.abs(emotion - em.value) < 15) || emotions[2];
  const demoAnalysis = demoText.trim().length > 3 ? analyzeText(demoText) : null;

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <section className="relative min-h-[90vh] mt-20 flex flex-col items-center justify-center py-13 px-4">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className={`absolute w-[500px] h-[500px] rounded-full blur-3xl top-0 -left-20 transition-all duration-700 ease-in-out bg-linear-to-r ${currentEmotion.color} to-transparent opacity-40`} />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-secondary/10 blur-3xl bottom-0 right-0" />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-2xl" />
          </div>

          <Ripple className="opacity-30" />

          <motion.div 
          initial={{ opacity: 0, y: 20}}
          animate={{ opacity: 1, y: 0}}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative space-y-8 text-center"
         >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm border border-primary/20 bg-primary/40 transition-all duration-300">
          <Waves className="w-4 h-4 animate-wave text-primary" />
          <span className="relative text-foreground/90 dark:text-foreground after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-primary/30 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">
          Your AI Agent Mental Health Companion</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-heading tracking-tight">
            <span className="inline-block bg-linear-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent [text-shadow:_0_1px_0_rgb(0_0_0_/20%)] hover:to-primary transition-all duration-300">
            Find Peace</span>
            <br />
            <span className="inline-block mt-2 bg-linear-to-b from-foreground to-foreground/90 bg-clip-text text-transparent">
            of Mind</span>
            </h1>
            <p className="max-w-[600px] mx-auto text-base md:text-lg text-muted-foreground leading-relaxed tracking-wide">
              Experience a new way of emotional support, our AI companion is here to listen, understand, and guide you through life&apos;s journey.
            </p>

            <motion.div
            className="w-full max-w-[600px] mx-auto space-y-6 py-8"
             initial={{ opacity: 0, y: 20}}
             animate={{ opacity: 1, y: 0}}
             transition={{ delay: 0.3, duration: 0.8}}
          >

            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground/80 font-medium">
              Whatever you&apos;re feeling, we&apos;re here to listen</p>
              <div className="flex items-center justify-between px-2">
                {emotions.map((em) => (
                  <div
                    key={em.value}
                    className={`transition-all duration-500 ease-out cursor-pointer hover:scale-105 ${Math.abs(emotion - em.value) < 15
                        ? "opacity-100 scale-110 transform-gpu"
                        : "opacity-50 scale-100"
                      }`}
                    onClick={() => setEmotion(em.value)}
                  >
                    <div className="text-2xl transform-gpu">
                      {em.label.split(" ")[0]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">
                      {em.label.split(" ")[1]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/*slider*/}
            <div className="relative px-2">
              <div
                className={`absolute inset-0 bg-linear-to-r ${currentEmotion.color} to-transparent blur-2xl -z-10 transition-all duration-500`}
              />
              <Slider
                value={[emotion]}
                onValueChange={(value) => setEmotion(value[0])}
                min={0}
                max={100}
                step={1}
                className="py-4"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground animate-pulse">
                Slide to express how you&apos;re feeling today
              </p>
            </div>
            </motion.div>
            <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20}}
            animate={{ opacity: 1, y: 0}}
            transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Button
              asChild
              size="lg"
              className="relative group h-12 px-8 rounded-full bg-linear-to-r from-primary via-primary/90 to-secondary hover:to-primary shadow-lg shadow-primary/20 transition-all duration-500 hover:shadow-xl hover:shadow-primary/30">
                <Link href="/signup">
                  <span className="relative z-10 font-medium flex items-center gap-2">
                    Begin Your Journey
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
              </Button>
            </motion.div>
         </motion.div>
      </section>
      <section className="relative py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          >
            <Card className="border-primary/10 p-6 md:p-8 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">See our AI in action</h3>
                <Badge variant="secondary" className="text-xs">Preview</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Type how you&apos;re feeling and watch our emotion &amp; crisis
                detection respond in real time.
              </p>
              <textarea
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
                placeholder="e.g. I've been feeling really anxious about work lately..."
                rows={2}
                className="w-full resize-none rounded-xl border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70"
              />
              <AnimatePresence>
                {demoAnalysis && (
                  <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex flex-wrap items-center gap-3"
                  >
                    <span
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium",
                      EMOTION_COLORS[demoAnalysis.emotion].bg,
                      EMOTION_COLORS[demoAnalysis.emotion].text
                    )}
                    >
                      Detected: {demoAnalysis.emotion} · {demoAnalysis.confidence}%
                    </span>
                    <span
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium bg-muted",
                      CRISIS_COLORS[demoAnalysis.crisisLevel].text
                    )}
                    >
                      Crisis risk: {CRISIS_COLORS[demoAnalysis.crisisLevel].label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-xs text-muted-foreground mt-4 border-t pt-3">
                This is a heuristic preview, not a clinical diagnosis. Nothing you
                type here is stored or sent anywhere.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold bg-linear-to-r from-primary/90 to-primary bg-clip-text text-transparent dark:text-primary/90">
            How Mind Care Helps You</h2>
          
          <p className="text-foreground dark:text-foreground/95 max-w-2xl mx-auto font-medium text-lg">
          Experience a new kind of emotional support, powered by empathetic AI</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {features.map((feature, index) => (
              <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: feature.delay, duration: 0.5 }}
              viewport={{ once: true }}
              >
                <Card className="group relative overflow-hidden border border-primary/10 hover:border-primary/20 transition-all duration-300 h-[200px] bg-card/30 dark:bg-card/80 backdrop-blur-sm">
                <div
                className={`absolute inset-0 bg-linear-to-br ${feature.color} to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 dark:group-hover:opacity-30`} />
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors duration-300">
                    <feature.icon className="w-5 h-5 text-primary dark:text-primary/90" /></div>
                    <h3 className="font-semibold tracking-tight text-foreground/90 dark:text-foreground">{feature.title}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="">
                    {feature.description}
                  </p>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-primary/20 dark:via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl font-bold bg-linear-to-r from-primary/90 to-primary bg-clip-text text-transparent dark:text-primary/90">
            How It Works</h2>

          <p className="text-foreground dark:text-foreground/95 max-w-2xl mx-auto font-medium text-lg">
          From your first message to a full picture of your progress</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6 relative">
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-linear-to-r from-primary/10 via-primary/30 to-primary/10" />
            {howItWorks.map((step, index) => (
              <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              className="relative text-center space-y-3"
              >
                <div className="relative mx-auto w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-primary" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-foreground/90 dark:text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[220px] mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}