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
import { Badge } from "@/components/ui/badge";
import { EMOTION_COLORS, CRISIS_COLORS, type Emotion, type CrisisLevel } from "@/lib/mock-emotion-analyzer";

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

export function SessionSidebar() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const activeId = params?.sessionId;

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/therapy", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { sessions: SessionItem[] };
        if (!cancelled) setSessions(data.sessions ?? []);
      } catch {
        // silently skip
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeId]); // re-fetch whenever the active session changes

  const handleNewChat = () => router.push("/therapy/new");
  const handleOpen = (id: string) => router.push(`/therapy/${id}`);

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
            Sessions
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
          <div className="flex justify-center py-4">
            <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && sessions.length === 0 && !collapsed && (
          <p className="text-[11px] text-muted-foreground text-center py-6 px-2">
            No sessions yet. Start a new chat!
          </p>
        )}

        {!loading &&
          sessions.map((s) => {
            const isActive = s._id === activeId;
            const emotionColor =
              s.dominantEmotion && EMOTION_COLORS[s.dominantEmotion]
                ? EMOTION_COLORS[s.dominantEmotion]
                : "text-muted-foreground";
            const crisisColor =
              s.crisisLevel && s.crisisLevel !== "none" && CRISIS_COLORS[s.crisisLevel]
                ? CRISIS_COLORS[s.crisisLevel]
                : null;

            return (
              <button
                key={s._id}
                type="button"
                onClick={() => handleOpen(s._id)}
                title={
                  collapsed
                    ? `${s.type === "voice" ? "Voice" : "Chat"} · ${sessionDateLabel(s.createdAt)}`
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
                    "shrink-0 flex items-center justify-center w-7 h-7 rounded-lg",
                    isActive ? "bg-primary/20" : "bg-muted group-hover:bg-muted/80"
                  )}
                >
                  {s.type === "voice" ? (
                    <Mic className="w-3.5 h-3.5" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                </span>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold truncate">
                        {sessionDateLabel(s.createdAt)}
                      </span>
                      {/* Crisis badge */}
                      {crisisColor && (
                        <AlertTriangle
                          className={cn("w-3 h-3 shrink-0", crisisColor)}
                        />
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
