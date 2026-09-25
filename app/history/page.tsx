"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, isSameDay } from "date-fns";
import {
  Search,
  MessageCircle,
  Phone,
  AlertTriangle,
  History as HistoryIcon,
  Filter,
  Sparkles,
  ChevronRight,
  Clock,
  MessageSquare,
  Mic,
  RotateCcw,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  EMOTION_COLORS,
  EMOTION_ORDER,
  CRISIS_COLORS,
  type Emotion,
  type CrisisLevel,
} from "@/lib/mock-emotion-analyzer";
import { resolveSessionMood } from "@/lib/voice/call-history";
import { Skeleton } from "@/components/ui/skeleton-primitives";

type SessionType = "chat" | "voice";

interface ConversationSession {
  id: string;
  date: Date;
  type: SessionType;
  durationMinutes: number;
  messageCount: number;
  dominantEmotion: Emotion;
  crisisLevel: CrisisLevel;
  title: string;
}

function SessionCardBody({ session }: { session: ConversationSession }) {
  const emotionConfig = EMOTION_COLORS[session.dominantEmotion] ?? EMOTION_COLORS.Neutral;

  return (
    <CardContent className="p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold font-heading text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {session.title}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {format(session.date, "h:mm a")} · {session.durationMinutes} min
          </span>
          {session.type === "chat" && (
            <span>· {session.messageCount} msg{session.messageCount === 1 ? "" : "s"}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "text-xs border font-medium px-2.5 py-0.5 gap-1.5",
              emotionConfig.bg,
              emotionConfig.border,
              emotionConfig.text
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", emotionConfig.dot)} />
            {session.dominantEmotion}
          </Badge>

          {session.crisisLevel !== "none" && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs border font-medium gap-1",
                session.crisisLevel === "high"
                  ? "bg-red-500/10 text-red-600 border-red-500/30 dark:bg-red-950/40 dark:text-red-400"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400"
              )}
            >
              <AlertTriangle className="h-3 w-3 text-red-500" />
              {CRISIS_COLORS[session.crisisLevel]?.label || session.crisisLevel.toUpperCase()}
            </Badge>
          )}

          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 border",
              session.type === "voice"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-primary/15 text-primary border-primary/30"
            )}
          >
            {session.type === "voice" ? "Voice Call" : "Text Chat"}
          </Badge>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
          View Transcript <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </CardContent>
  );
}

interface RawMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  emotion?: Emotion;
  crisisLevel?: CrisisLevel;
}

interface RawSession {
  _id: string;
  type: SessionType;
  messages: RawMessage[];
  createdAt: string;
  durationSeconds?: number;
  dominantEmotion?: Emotion;
}

const CRISIS_SEVERITY: Record<CrisisLevel, number> = { none: 0, low: 1, medium: 2, high: 3 };

function summarizeSession(session: RawSession): ConversationSession {
  const messages = session.messages ?? [];

  const dominantEmotion =
    session.dominantEmotion ?? resolveSessionMood(messages);

  const crisisLevel = messages.reduce<CrisisLevel>((worst, m) => {
    if (m.crisisLevel && CRISIS_SEVERITY[m.crisisLevel] > CRISIS_SEVERITY[worst]) {
      return m.crisisLevel;
    }
    return worst;
  }, "none");

  const first = messages[0] ? new Date(messages[0].timestamp) : new Date(session.createdAt);
  const last = messages.length > 0 ? new Date(messages[messages.length - 1].timestamp) : first;
  const durationMinutes =
    typeof session.durationSeconds === "number" && session.durationSeconds > 0
      ? Math.max(1, Math.round(session.durationSeconds / 60))
      : Math.max(1, Math.round((last.getTime() - first.getTime()) / 60000));

  const firstUserMessage = messages.find((m) => m.role === "user")?.content;
  const title = firstUserMessage
    ? firstUserMessage.length > 60
      ? `${firstUserMessage.slice(0, 60)}…`
      : firstUserMessage
    : "Therapy session";

  return {
    id: session._id,
    date: new Date(session.createdAt),
    type: session.type,
    durationMinutes,
    messageCount: messages.length,
    dominantEmotion,
    crisisLevel,
    title,
  };
}

export default function HistoryPage() {
  const [allSessions, setAllSessions] = useState<ConversationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/therapy?full=true", { cache: "no-store" });
      if (!res.ok) return;
      const { sessions } = (await res.json()) as { sessions: RawSession[] };
      setAllSessions(sessions.map(summarizeSession));
    } catch (error) {
      console.error("Error loading session history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filtered = allSessions.filter((session) => {
    if (query && !session.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (emotionFilter !== "all" && session.dominantEmotion !== emotionFilter) return false;
    if (typeFilter !== "all" && session.type !== (typeFilter as SessionType)) return false;
    return true;
  });

  const groups = filtered.reduce<{ date: Date; sessions: typeof filtered }[]>((acc, session) => {
    const existing = acc.find((g) => isSameDay(g.date, session.date));
    if (existing) {
      existing.sessions.push(session);
    } else {
      acc.push({ date: session.date, sessions: [session] });
    }
    return acc;
  }, []);

  const totalChatCount = allSessions.filter((s) => s.type === "chat").length;
  const totalVoiceCount = allSessions.filter((s) => s.type === "voice").length;

  const hasActiveFilters = query.trim() !== "" || emotionFilter !== "all" || typeFilter !== "all";

  const resetFilters = () => {
    setQuery("");
    setEmotionFilter("all");
    setTypeFilter("all");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Container className="pt-28 space-y-8">
        {/* Header Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Timeline & Records
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight">
              Conversation History
            </h1>
            <p className="text-sm text-muted-foreground">
              Revisit your past chat and voice therapy sessions and observe emotional trends over time.
            </p>
          </div>

          {/* Quick Metrics Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-card border border-border/50 text-xs font-medium shadow-2xs">
              <HistoryIcon className="w-3.5 h-3.5 text-primary" />
              <span>{allSessions.length} Total Sessions</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-card border border-border/50 text-xs font-medium shadow-2xs">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>{totalChatCount} Chat</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-card border border-border/50 text-xs font-medium shadow-2xs">
              <Mic className="w-3.5 h-3.5 text-emerald-500" />
              <span>{totalVoiceCount} Voice</span>
            </div>
          </div>
        </motion.div>

        {/* Filter Controls Bar */}
        <Card className="p-4 border-border/60 shadow-sm bg-card/70 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search session topics or keywords..."
                className="pl-10 rounded-2xl bg-background border-border/60 text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 min-w-[140px]">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
                <Select value={emotionFilter} onValueChange={setEmotionFilter}>
                  <SelectTrigger className="w-full rounded-2xl bg-background border-border/60 text-xs font-medium">
                    <SelectValue placeholder="Emotion Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Emotions</SelectItem>
                    {EMOTION_ORDER.map((emotion) => (
                      <SelectItem key={emotion} value={emotion}>
                        {emotion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[130px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full rounded-2xl bg-background border-border/60 text-xs font-medium">
                    <SelectValue placeholder="Session Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="chat">Chat Sessions</SelectItem>
                    <SelectItem value="voice">Voice Sessions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="rounded-2xl gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Session List & Timeline Display */}
        {isLoading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <Skeleton className="h-24 flex-1 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="border-border/60 shadow-sm bg-card/60">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                <HistoryIcon className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-heading">
                  {allSessions.length === 0
                    ? "No Therapy Sessions Recorded Yet"
                    : "No Matching Sessions Found"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {allSessions.length === 0
                    ? "Start a new chat or voice session to begin tracking your conversation timeline."
                    : "Try adjusting your search keywords, emotion filter, or session type filter."}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-full text-xs gap-1.5 mt-2">
                  <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                </Button>
              ) : (
                <Button asChild size="sm" className="rounded-full text-xs gap-1.5 mt-2">
                  <Link href="/therapy/new">
                    <Sparkles className="w-3.5 h-3.5" /> Start New Session
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="max-h-[640px] sm:max-h-[720px] overflow-y-auto pr-3 -mr-1 rounded-2xl">
            <div className="relative space-y-8 before:absolute before:left-[19px] sm:before:left-[23px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary/40 before:via-primary/20 before:to-transparent pb-6">
              {groups.map((group) => (
                <div key={group.date.toISOString()} className="space-y-4">
                  <div className="pl-11 sm:pl-14 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/40 shadow-2xs">
                      {format(group.date, "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.sessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3 }}
                        className="relative flex items-start gap-4 pl-1 group"
                      >
                        {/* Timeline Icon Ring */}
                        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card border border-border/80 shadow-sm sm:h-12 sm:w-12 group-hover:border-primary/50 group-hover:scale-105 transition-all">
                          {session.type === "voice" ? (
                            <Phone className="w-4.5 h-4.5 text-emerald-500" />
                          ) : (
                            <MessageCircle className="w-4.5 h-4.5 text-primary" />
                          )}
                        </div>

                        {/* Interactive Session Card Link */}
                        <Link href={`/therapy/${session.id}`} className="flex-1 min-w-0">
                          <Card className="hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl bg-card/80 border-border/60">
                            <SessionCardBody session={session} />
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
