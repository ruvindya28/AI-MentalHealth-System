"use client"

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { LiveAnalysisPanel } from "@/components/therapy/live-analysis-panel";
import {
  analyzeText,
  EMOTION_COLORS,
  type CrisisLevel,
  type Emotion,
  type EmotionAnalysis,
} from "@/lib/mock-emotion-analyzer";
import { generateReply } from "@/lib/mock-therapist-responses";

const glowAnimation: Variants = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    technique?: string;
    goal?: string;
    emotion?: Emotion;
    confidence?: number;
    crisisLevel?: CrisisLevel;
  };
}

const SUGGESTED_PROMPTS = [
  "I've been feeling anxious about work lately",
  "I'm not sure how to explain how I feel today",
  "I had a really good day and want to talk about it",
];

export default function TherapyPage() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isChatPaused] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestEmotion, setLatestEmotion] = useState<Emotion | null>(null);
  const [latestConfidence, setLatestConfidence] = useState<number | null>(null);
  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("none");
  const [persistedSessionId, setPersistedSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  useEffect(() => {
    if (!isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const emotionCounts = messages.reduce<Partial<Record<Emotion, number>>>(
    (acc, msg) => {
      const emotion = msg.metadata?.emotion;
      if (emotion) {
        acc[emotion] = (acc[emotion] ?? 0) + 1;
      }
      return acc;
    },
    {}
  );

  const persistMessage = async (
    sessionId: string,
    msg: {
      role: "user" | "assistant";
      content: string;
      emotion?: Emotion;
      confidence?: number;
      crisisLevel?: CrisisLevel;
      technique?: string;
    }
  ) => {
    try {
      await fetch(`/api/therapy/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const analyzeMessage = async (text: string): Promise<EmotionAnalysis> => {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Analyze request failed");
      return (await res.json()) as EmotionAnalysis;
    } catch (error) {
      console.error("Error analyzing message, falling back to local heuristic:", error);
      return analyzeText(text);
    }
  };

  const ensureSession = async (): Promise<string | null> => {
    if (persistedSessionId) return persistedSessionId;
    try {
      const res = await fetch("/api/therapy", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");
      const { session } = (await res.json()) as { session: { _id: string } };
      setPersistedSessionId(session._id);
      // Cosmetic URL update only — router.replace() to a new dynamic segment
      // remounts this page and wipes in-progress chat state, so this bypasses
      // the Next.js router entirely.
      window.history.replaceState(null, "", `/therapy/${session._id}`);
      return session._id;
    } catch (error) {
      console.error("Error creating therapy session:", error);
      return null;
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping || isChatPaused) return;

    const analysis = await analyzeMessage(trimmed);

    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
      metadata: {
        emotion: analysis.emotion,
        confidence: analysis.confidence,
        crisisLevel: analysis.crisisLevel,
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setLatestEmotion(analysis.emotion);
    setLatestConfidence(analysis.confidence);
    setCrisisLevel(analysis.crisisLevel);
    setMessage("");
    setIsTyping(true);

    const sessionId = await ensureSession();
    if (sessionId) {
      persistMessage(sessionId, {
        role: "user",
        content: trimmed,
        emotion: analysis.emotion,
        confidence: analysis.confidence,
        crisisLevel: analysis.crisisLevel,
      });
    }

    setTimeout(() => {
      const reply = generateReply(analysis);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply.text,
          timestamp: new Date(),
          metadata: { technique: reply.technique },
        },
      ]);
      setIsTyping(false);

      if (sessionId) {
        persistMessage(sessionId, {
          role: "assistant",
          content: reply.text,
          technique: reply.technique,
        });
      }
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
  };

  return (
   <div className="relative max-w-7xl mx-auto px-4">
    <div className="flex h-[calc(100vh-4rem)] mt-20 gap-6">
        <div className="flex-1 flex flex-col overflow-hidden bg-card rounded-2xl border shadow-sm">
            <div className="flex items-center gap-2 p-4 border-b">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-5 h-5" /></div>
                <div>
                  <h2 className="font-semibold font-heading">AI Therapist</h2>
                  <p className="text-sm text-muted-foreground">{messages.length} messages</p>
                </div>
            </div>

            {(crisisLevel === "medium" || crisisLevel === "high") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mx-4 mt-4 p-4 rounded-2xl border border-crisis/30 bg-crisis/10 flex items-start gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-crisis/20">
                  <Heart className="w-4 h-4 text-crisis-foreground dark:text-crisis" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-crisis-foreground dark:text-crisis">
                    We hear that things feel heavy right now
                  </p>
                  <p className="text-sm text-foreground/80">
                    You&apos;re not alone in this. If you&apos;re in immediate danger,
                    please reach out to your local emergency number or a crisis
                    helpline — support is available right now.
                  </p>
                </div>
              </motion.div>
            )}

         {messages.length === 0 ? (
            // Welcome screen with suggested questions
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="relative inline-flex flex-col items-center">
                    <motion.div
                      className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                      initial="initial"
                      animate="animate"
                      variants={glowAnimation}
                    />
                      <div className="relative flex items-center gap-2 text-2xl font-semibold">
                      <div className="relative">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <motion.div
                          className="absolute inset-0 text-primary"
                          initial="initial"
                          animate="animate"
                          variants={glowAnimation}
                        >
                          <Sparkles className="w-6 h-6" />
                        </motion.div>
                      </div>
                      <span className="font-heading bg-linear-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                        AI Therapist
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2">
                      How can I assist you today?
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-colors duration-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
    </div>
    </div>
    ):(
      <div className="flex-1 overflow-y-auto scroll-smooth">
              <div className="max-w-3xl mx-auto">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.timestamp.toISOString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "px-6 py-8",
                        msg.role === "assistant"
                          ? "bg-muted/30"
                          : "bg-background"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="w-8 h-8 shrink-0 mt-1">
                          {msg.role === "assistant" ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                              <Bot className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2 overflow-hidden min-h-[2rem]">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">
                              {msg.role === "assistant"
                                ? "AI Therapist"
                                : "You"}
                            </p>
                            {msg.metadata?.technique && (
                              <Badge variant="secondary" className="text-xs">
                                {msg.metadata.technique}
                              </Badge>
                            )}
                            {msg.metadata?.emotion && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs border",
                                  EMOTION_COLORS[msg.metadata.emotion].bg,
                                  EMOTION_COLORS[msg.metadata.emotion].border
                                )}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full", EMOTION_COLORS[msg.metadata.emotion].dot)} />
                                {msg.metadata.emotion} · {msg.metadata.confidence}%
                              </Badge>
                            )}
                          </div>
                          <div className="prose prose-sm dark:prose-invert leading-relaxed">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.metadata?.goal && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Goal: {msg.metadata.goal}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 py-8 flex gap-4 bg-muted/30"
                  >
                    <div className="w-8 h-8 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-sm">AI Therapist</p>
                      <div className="flex items-center gap-1 py-1" aria-label="AI Therapist is typing">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

                 {/* Input area */}
          <div className="border-t bg-background/50 backdrop-blur supports-backdrop-filter:bg-background/50 p-4">
            <form
              onSubmit={handleSubmit}
              className="max-w-3xl mx-auto flex gap-4 items-end relative"
            >
              <div className="flex-1 relative group">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    isChatPaused
                      ? "Complete the activity to continue..."
                      : "Ask me anything..."
                  }
                  className={cn(
                    "w-full resize-none rounded-2xl border bg-background",
                    "p-3 pr-12 min-h-12 max-h-50",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "transition-all duration-200",
                    "placeholder:text-muted-foreground/70",
                    (isTyping || isChatPaused) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  rows={1}
                  disabled={isTyping || isChatPaused}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(message);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "absolute right-1.5 bottom-3.5 h-9 w-9",
                    "rounded-xl transition-all duration-200",
                    "bg-primary hover:bg-primary/90",
                    "shadow-sm shadow-primary/20",
                    (isTyping || isChatPaused || !message.trim()) &&
                      "opacity-50 cursor-not-allowed",
                    "group-hover:scale-105 group-focus-within:scale-105"
                  )}
                  disabled={isTyping || isChatPaused || !message.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Press <kbd className="px-2 py-0.5 rounded bg-muted">Enter ↵</kbd>{" "}
              to send,
              <kbd className="px-2 py-0.5 rounded bg-muted ml-1">
                Shift + Enter
              </kbd>{" "}
              for new line
            </div>
          </div>
                </div>

                <div className="hidden lg:flex w-80 shrink-0 flex-col gap-4 py-4 overflow-y-auto">
                  <LiveAnalysisPanel
                    latestEmotion={latestEmotion}
                    latestConfidence={latestConfidence}
                    crisisLevel={crisisLevel}
                    emotionCounts={emotionCounts}
                  />
                </div>

        </div>
    </div>

  );
}
