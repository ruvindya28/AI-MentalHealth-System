"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Mic,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EMOTION_COLORS, type Emotion, type CrisisLevel } from "@/lib/mock-emotion-analyzer";

interface SessionItem {
  _id: string;
  type: "chat" | "voice";
  createdAt: string;
  durationSeconds?: number;
  dominantEmotion?: Emotion;
  crisisLevel?: CrisisLevel;
  preview?: string; // first user message
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
}

function sessionDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

// Module-level in-memory cache for chat sessions so navigating between chats never re-triggers sidebar loading
let cachedChatSessions: SessionItem[] | null = null;

export function SessionSidebar() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  // Derive active ID directly during render — no effect needed
  const activeSessionId =
    params?.sessionId && params.sessionId !== "new"
      ? params.sessionId
      : (createdSessionId ?? params?.sessionId);

  const [sessions, setSessions] = useState<SessionItem[]>(() => cachedChatSessions ?? []);
  const [loading, setLoading] = useState(() => !cachedChatSessions);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadSessions() {
      try {
        const res = await fetch("/api/therapy?type=chat", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { sessions: SessionItem[] };
        if (!ignore) {
          const chatOnly = (data.sessions ?? []).filter((s) => s.type === "chat" || !s.type);
          cachedChatSessions = chatOnly;
          setSessions(chatOnly);
        }
      } catch {
        // silently skip
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadSessions();

    const handleSessionUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{
        sessionId?: string;
        preview?: string;
        emotion?: Emotion;
        crisisLevel?: CrisisLevel;
      }>;

      if (customEvent.detail?.sessionId) {
        const sid = customEvent.detail.sessionId;
        setCreatedSessionId(sid);

        // Optimistically insert or update the session at the top of the sidebar immediately
        setSessions((prev) => {
          const existingIdx = prev.findIndex((s) => s._id === sid);
          const updatedItem: SessionItem = {
            _id: sid,
            type: "chat",
            createdAt: prev[existingIdx]?.createdAt || new Date().toISOString(),
            preview: customEvent.detail?.preview ?? prev[existingIdx]?.preview,
            dominantEmotion: customEvent.detail?.emotion ?? prev[existingIdx]?.dominantEmotion,
            crisisLevel: customEvent.detail?.crisisLevel ?? prev[existingIdx]?.crisisLevel,
          };

          const next = existingIdx >= 0
            ? prev.map((item, idx) => (idx === existingIdx ? updatedItem : item))
            : [updatedItem, ...prev];

          cachedChatSessions = next;
          return next;
        });
      }

      // Re-fetch in background to ensure database sync
      void loadSessions();
    };

    window.addEventListener("therapy-session-updated", handleSessionUpdated);
    return () => {
      ignore = true;
      window.removeEventListener("therapy-session-updated", handleSessionUpdated);
    };
  }, [params?.sessionId]);

  const handleNewChat = () => {
    setCreatedSessionId(null);
    router.push("/therapy/new");
  };

  const handleOpen = (id: string) => {
    setCreatedSessionId(id);
    router.push(`/therapy/${id}`);
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col shrink-0 border-r bg-card/60 backdrop-blur transition-all duration-300 ease-in-out",
        "h-full overflow-hidden",
        collapsed ? "w-14" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b shrink-0">
        {!collapsed && (
          <span className="flex-1 text-sm font-semibold text-foreground truncate">
            Chat History
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* New Chat button */}
      <div className="px-2 pt-2 pb-1 shrink-0">
        <Button
          variant="outline"
          className={cn(
            "w-full gap-2 rounded-xl text-xs font-semibold transition-all",
            collapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={handleNewChat}
          title="New chat session"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 px-1.5">
        {loading && (
          <div className="space-y-1.5 p-1 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-2 rounded-xl bg-muted/40 space-y-1.5">
                <div className="h-3 w-20 bg-muted/80 rounded" />
                <div className="h-2.5 w-32 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && sessions.length === 0 && !collapsed && (
          <p className="text-[11px] text-muted-foreground text-center py-6 px-2">
            No chat sessions yet. Start a new chat!
          </p>
        )}

        {!loading &&
          sessions.map((s) => {
            const isActive = s._id === activeSessionId;
            const emotionColor =
              s.dominantEmotion && EMOTION_COLORS[s.dominantEmotion]
                ? EMOTION_COLORS[s.dominantEmotion]
                : "text-muted-foreground";
            const isHighRisk = s.crisisLevel === "high";
            const isMediumRisk = s.crisisLevel === "medium";
            const isLowRisk = s.crisisLevel === "low";
            const hasRisk = isHighRisk || isMediumRisk || isLowRisk;

            return (
              <button
                key={s._id}
                type="button"
                onClick={() => handleOpen(s._id)}
                title={
                  collapsed
                    ? `${s.type === "voice" ? "Voice" : "Chat"}${hasRisk ? ` (${s.crisisLevel?.toUpperCase()} RISK)` : ""} · ${sessionDateLabel(s.createdAt)}`
                    : undefined
                }
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-150 group",
                  isActive
                    ? "bg-primary/10 text-foreground"
                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Type icon */}
                <span
                  className={cn(
                    "shrink-0 relative flex items-center justify-center w-7 h-7 rounded-lg",
                    isActive ? "bg-primary/20" : "bg-muted group-hover:bg-muted/80"
                  )}
                >
                  {s.type === "voice" ? (
                    <Mic className="w-3.5 h-3.5" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  {isHighRisk && collapsed && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background" />
                  )}
                </span>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold truncate">
                        {sessionDateLabel(s.createdAt)}
                      </span>
                      {/* Crisis badge */}
                      {hasRisk && (
                        <span title={`${s.crisisLevel?.toUpperCase()} RISK`} className="inline-flex shrink-0">
                          <AlertTriangle
                            className={cn(
                              "w-3.5 h-3.5",
                              isHighRisk
                                ? "text-red-500 fill-red-500/20"
                                : isMediumRisk
                                ? "text-amber-500 fill-amber-500/20"
                                : "text-yellow-500 fill-yellow-500/20"
                            )}
                          />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {/* Time */}
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(s.createdAt), "h:mm a")}
                      </span>

                      {/* Duration for voice */}
                      {s.type === "voice" && s.durationSeconds != null && (
                        <>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDuration(s.durationSeconds)}
                          </span>
                        </>
                      )}

                      {/* Emotion */}
                      {s.dominantEmotion && (
                        <>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className={cn("text-[10px] font-medium truncate", emotionColor)}>
                            {s.dominantEmotion}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Preview snippet */}
                    {s.preview && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-tight">
                        {s.preview}
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
      </div>
    </aside>
  );
}
