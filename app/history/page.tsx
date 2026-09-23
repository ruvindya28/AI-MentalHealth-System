"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format, isSameDay } from "date-fns";
import { Search, MessageCircle, Phone, AlertTriangle, History as HistoryIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  return (
    <CardContent className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium line-clamp-1">{session.title}</p>
        <span className="text-xs text-muted-foreground shrink-0">
          {format(session.date, "h:mm a")} · {session.durationMinutes} min
          {session.type === "chat" ? ` · ${session.messageCount} messages` : ""}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge
          variant="outline"
          className={cn(
            "text-xs border",
            EMOTION_COLORS[session.dominantEmotion].bg,
            EMOTION_COLORS[session.dominantEmotion].border
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", EMOTION_COLORS[session.dominantEmotion].dot)} />
          {session.dominantEmotion}
        </Badge>
        {session.crisisLevel !== "none" && (
          <Badge variant="crisis" className="text-xs">
            <AlertTriangle className="h-3 w-3" />
            {CRISIS_COLORS[session.crisisLevel].label}
          </Badge>
        )}
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
    : "Chat session";

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
    // Initial data fetch from the server, not a derivable value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold font-heading">Conversation History</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Revisit past chat and voice sessions, and notice patterns over time.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions..."
              className="pl-10"
            />
          </div>
          <Select value={emotionFilter} onValueChange={setEmotionFilter}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Emotion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All emotions</SelectItem>
              {EMOTION_ORDER.map((emotion) => (
                <SelectItem key={emotion} value={emotion}>
                  {emotion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="voice">Voice</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <HistoryIcon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground max-w-70">
                {isLoading
                  ? "Loading your sessions..."
                  : allSessions.length === 0
                    ? "No sessions yet. Start a therapy chat to see it here."
                    : "No sessions match your filters. Try adjusting your search."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-h-[600px] sm:max-h-[680px] overflow-y-auto pr-3 -mr-1 rounded-xl">
            <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border sm:before:left-[23px] pb-4">
              {groups.map((group) => (
                <div key={group.date.toISOString()} className="space-y-3">
                  <p className="pl-11 sm:pl-13 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {format(group.date, "EEEE, MMMM d")}
                  </p>
                  <div className="space-y-3">
                    {group.sessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35 }}
                        className="relative flex items-start gap-4 pl-1"
                      >
                        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-12 sm:w-12">
                          {session.type === "voice" ? (
                            <Phone className="w-4.5 h-4.5 text-primary" />
                          ) : (
                            <MessageCircle className="w-4.5 h-4.5 text-primary" />
                          )}
                        </div>
                        <Link href={`/therapy/${session.id}`} className="flex-1">
                          <Card className="hover:border-primary/40 transition-colors cursor-pointer">
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
