"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Heart,
  Plus,
  AlertTriangle,
  Mic,
  Copy,
  Check,
  Volume2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { LiveAnalysisPanel } from "@/components/therapy/live-analysis-panel";
import { SessionSidebar } from "@/components/therapy/session-sidebar";
import { TherapySkeleton } from "@/components/therapy/therapy-skeleton";
import {
  EMOTION_COLORS,
  type CrisisLevel,
  type Emotion,
} from "@/lib/mock-emotion-analyzer";
import {
  analyzeMessage,
  createTherapySession,
  persistTherapyMessage,
  fetchTherapyReply,
} from "@/lib/therapy-client";
import { generateReply } from "@/lib/mock-therapist-responses";
import { toast } from "sonner";
import Link from "next/link";

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

const CATEGORIZED_PROMPTS = [
  {
    category: "Anxiety & Overthinking",
    prompt: "I've been feeling anxious and overwhelmed by my thoughts lately.",
    icon: "🧘",
  },
  {
    category: "Emotional Check-in",
    prompt: "I'm not sure how to express how I feel today, can you help me unpack it?",
    icon: "💭",
  },
  {
    category: "Stress Management",
    prompt: "I feel burnt out from work/life pressures and need perspective.",
    icon: "🌿",
  },
  {
    category: "Positive Reflection",
    prompt: "I had a great win today and want to reflect on positive feelings!",
    icon: "✨",
  },
];

interface RawPersistedMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  emotion?: Emotion;
  confidence?: number;
  crisisLevel?: CrisisLevel;
  technique?: string;
}

export default function TherapyPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isChatPaused] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [latestEmotion, setLatestEmotion] = useState<Emotion | null>(null);
  const [latestConfidence, setLatestConfidence] = useState<number | null>(null);
  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("none");
  const [persistedSessionId, setPersistedSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"chat" | "voice">("chat");
  const [restoredSessionId, setRestoredSessionId] = useState<string | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  // Pure derived state during render — no effect needed
  const isRestoring = Boolean(
    params?.sessionId &&
    params.sessionId !== "new" &&
    restoredSessionId !== params.sessionId
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sessionId = params.sessionId;
    if (!sessionId || sessionId === "new") return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/therapy/${sessionId}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const { session } = (await res.json()) as {
          session: { _id: string; type?: "chat" | "voice"; messages: RawPersistedMessage[] };
        };
        if (cancelled) return;

        if (session.type) {
          setSessionType(session.type);
        }

        const restored: Message[] = (session.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          metadata: {
            emotion: m.emotion,
            confidence: m.confidence,
            crisisLevel: m.crisisLevel,
            technique: m.technique,
          },
        }));

        const lastAnalyzed = [...(session.messages || [])].reverse().find((m) => m.emotion);

        setMessages(restored);
        setPersistedSessionId(session._id);
        setRestoredSessionId(session._id);
        if (lastAnalyzed) {
          setLatestEmotion(lastAnalyzed.emotion ?? null);
          setLatestConfidence(lastAnalyzed.confidence ?? null);
          setCrisisLevel(lastAnalyzed.crisisLevel ?? "none");
        }
      } catch (error) {
        console.error("Error restoring therapy session:", error);
        if (!cancelled) {
          setRestoredSessionId(sessionId);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.sessionId]);

  const handleNewChat = () => {
    setMessages([]);
    setLatestEmotion(null);
    setLatestConfidence(null);
    setCrisisLevel("none");
    setPersistedSessionId(null);
    setMessage("");
    router.push("/therapy/new");
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    if (!isTyping && messages.length > 0) {
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

  const ensureSession = async (): Promise<string | null> => {
    if (persistedSessionId) return persistedSessionId;
    const sessionId = await createTherapySession("chat");
    if (sessionId) {
      setPersistedSessionId(sessionId);
      window.history.replaceState(null, "", `/therapy/${sessionId}`);
    }
    return sessionId;
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
      await persistTherapyMessage(sessionId, {
        role: "user",
        content: trimmed,
        emotion: analysis.emotion,
        confidence: analysis.confidence,
        crisisLevel: analysis.crisisLevel,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("therapy-session-updated", {
            detail: {
              sessionId,
              preview: trimmed,
              emotion: analysis.emotion,
              crisisLevel: analysis.crisisLevel,
            },
          })
        );
      }
    }

    const reply = sessionId ? await fetchTherapyReply(sessionId, analysis, trimmed) : generateReply(analysis, trimmed);

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const speakMessage = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98;
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Speech synthesis not supported in this browser");
    }
  };

  if (isRestoring && !persistedSessionId) {
    return <TherapySkeleton />;
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 pb-4">
      <div className="flex h-[calc(100vh-8.5rem)] min-h-[620px] mt-20 pt-3 mb-6 sm:mb-8 gap-0 overflow-hidden">
        <div className="flex flex-1 rounded-3xl border shadow-md overflow-hidden bg-card">
          {/* ── Left sidebar: session history ── */}
          <SessionSidebar />

          {/* ── Main chat area ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-card">
            {/* Top Control Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold font-heading text-base truncate">AI Therapist</h2>
                    {sessionType === "voice" && (
                      <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
                        Voice Session
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {messages.length === 0 ? "Ready for conversation" : `${messages.length} messages in session`}
                  </p>
                </div>
              </div>

              {/* Action buttons in header */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Switch to Voice Studio Button */}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  title="Switch to Voice Therapy Mode"
                >
                  <Link href="/voice">
                    <Mic className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="hidden sm:inline">Voice Mode</span>
                  </Link>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full text-xs"
                  onClick={handleNewChat}
                  disabled={messages.length === 0}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </Button>
              </div>
            </div>

            {/* Crisis Alert Banner */}
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
                  <p className="text-xs text-foreground/80">
                    You&apos;re not alone in this. If you&apos;re in immediate danger,
                    please reach out to your local emergency number or a crisis
                    helpline — support is available right now.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Empty State Welcome Screen */}
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                <div className="max-w-2xl w-full space-y-6 text-center">
                  <div className="space-y-3">
                    <div className="relative inline-flex flex-col items-center">
                      <motion.div
                        className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                        initial="initial"
                        animate="animate"
                        variants={glowAnimation}
                      />
                      <div className="relative flex items-center gap-2.5 text-3xl font-bold font-heading">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          AI Therapy Assistant
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                      Welcome to your safe, non-judgmental space. How are you feeling today? Select a topic below or type your thoughts to begin.
                    </p>
                  </div>

                  {/* Categorized Prompts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                    {CATEGORIZED_PROMPTS.map((item) => (
                      <button
                        key={item.category}
                        type="button"
                        onClick={() => sendMessage(item.prompt)}
                        className="group flex flex-col justify-between p-4 rounded-2xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-left bg-card/60 shadow-xs"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-lg">{item.icon}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <h4 className="text-xs font-semibold font-heading text-foreground group-hover:text-primary transition-colors">
                          {item.category}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          &ldquo;{item.prompt}&rdquo;
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Confidential & Private Session</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Message Thread List */
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto py-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.timestamp.toISOString() + idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={cn(
                          "px-6 py-6 border-b border-border/20 transition-colors",
                          msg.role === "assistant" ? "bg-muted/30" : "bg-background"
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
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm font-heading">
                                {msg.role === "assistant" ? "AI Therapist" : "You"}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {msg.metadata?.technique && (
                                  <Badge variant="secondary" className="text-xs">
                                    {msg.metadata.technique}
                                  </Badge>
                                )}
                                {msg.metadata?.crisisLevel && msg.metadata.crisisLevel !== "none" && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs border gap-1 font-medium",
                                      msg.metadata.crisisLevel === "high"
                                        ? "bg-red-500/10 text-red-600 border-red-500/30 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
                                        : msg.metadata.crisisLevel === "medium"
                                          ? "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                                          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800"
                                    )}
                                  >
                                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                                    {msg.metadata.crisisLevel.toUpperCase()} RISK
                                  </Badge>
                                )}
                                {(() => {
                                  const effectiveEmotion: Emotion | undefined =
                                    (msg.metadata?.emotion === "Unknown" && (msg.metadata?.crisisLevel === "high" || msg.metadata?.crisisLevel === "medium"))
                                      ? "Sad"
                                      : msg.metadata?.emotion;
                                  const effectiveConfidence =
                                    (msg.metadata?.emotion === "Unknown" && (msg.metadata?.crisisLevel === "high" || msg.metadata?.crisisLevel === "medium"))
                                      ? 95
                                      : msg.metadata?.confidence;

                                  if (!effectiveEmotion || effectiveEmotion === "Unknown") {
                                    return null;
                                  }

                                  return (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs border gap-1.5",
                                        EMOTION_COLORS[effectiveEmotion]?.bg || "",
                                        EMOTION_COLORS[effectiveEmotion]?.border || ""
                                      )}
                                    >
                                      <span className={cn("h-1.5 w-1.5 rounded-full", EMOTION_COLORS[effectiveEmotion]?.dot || "")} />
                                      {effectiveEmotion} · {effectiveConfidence}%
                                    </Badge>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="prose prose-sm dark:prose-invert leading-relaxed text-sm">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>

                            {/* Message Actions Bar (Copy & Read Aloud) */}
                            {msg.role === "assistant" && (
                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
                                  onClick={() => copyToClipboard(msg.content, idx)}
                                  title="Copy message"
                                >
                                  {copiedMessageIndex === idx ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
                                  onClick={() => speakMessage(msg.content)}
                                  title="Read message aloud"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-6 py-6 flex gap-4 bg-muted/30 border-b border-border/20"
                    >
                      <div className="w-8 h-8 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-sm font-heading">AI Therapist</p>
                        <div className="flex items-center gap-1.5 py-1" aria-label="AI Therapist is typing">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
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

            {/* Input Bar */}
            <div className="border-t bg-background/80 backdrop-blur p-4 shrink-0">
              <form
                onSubmit={handleSubmit}
                className="max-w-3xl mx-auto flex gap-3 items-end relative"
              >
                <div className="flex-1 relative group">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isChatPaused
                        ? "Complete the activity to continue..."
                        : "Type your message here..."
                    }
                    className={cn(
                      "w-full resize-none rounded-2xl border bg-background",
                      "p-3 pr-12 min-h-12 max-h-48 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50",
                      "transition-all duration-200 shadow-xs",
                      "placeholder:text-muted-foreground/70",
                      (isTyping || isChatPaused) && "opacity-50 cursor-not-allowed"
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
                      "absolute right-2 bottom-2.5 h-8 w-8",
                      "rounded-xl transition-all duration-200",
                      "bg-primary hover:bg-primary/90 text-primary-foreground",
                      "shadow-xs shadow-primary/20",
                      (isTyping || isChatPaused || !message.trim()) && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={isTyping || isChatPaused || !message.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
              <div className="mt-2 text-[11px] text-center text-muted-foreground flex items-center justify-center gap-3">
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter ↵</kbd> to send</span>
                <span>•</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Shift + Enter</kbd> for line break</span>
              </div>
            </div>
          </div>

          {/* ── Right panel: live analysis ── */}
          <div className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col gap-4 p-4 border-l overflow-y-auto bg-card/50">
            <LiveAnalysisPanel
              latestEmotion={latestEmotion}
              latestConfidence={latestConfidence}
              crisisLevel={crisisLevel}
              emotionCounts={emotionCounts}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
