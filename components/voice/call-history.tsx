"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Phone, AlertTriangle, ChevronRight, User, Bot, Loader2, MessageCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EMOTION_COLORS, CRISIS_COLORS, type Emotion, type CrisisLevel } from "@/lib/mock-emotion-analyzer";
import type { CallRecord } from "@/lib/voice/call-history";

interface CallHistoryProps {
  calls: CallRecord[];
  className?: string;
}

interface PersistedMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  emotion?: Emotion;
  confidence?: number;
  crisisLevel?: CrisisLevel;
  technique?: string;
}

interface SessionData {
  _id: string;
  type: string;
  durationSeconds?: number;
  messages: PersistedMessage[];
  createdAt: string;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export function CallHistory({ calls, className }: CallHistoryProps) {
  const router = useRouter();
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenSession = async (call: CallRecord) => {
    setSelectedCall(call);
    setSessionData(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/therapy/${call.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { session: SessionData };
        setSessionData(data.session);
      }
    } catch (err) {
      console.error("Could not load session details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToTherapy = (sessionId: string) => {
    setSelectedCall(null);
    router.push(`/therapy/${sessionId}`);
  };

  return (
    <>
      <Card className={cn("border-primary/10 h-full flex flex-col min-h-[580px] lg:min-h-[640px] max-h-[700px]", className)}>
        <CardHeader className="shrink-0 pb-3">
          <CardTitle>Session History</CardTitle>
          <CardDescription>Click any voice session to view the complete conversation</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pr-2">
          {calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                No sessions yet. Start a voice session to see your history here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => (
                <div
                  key={call.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenSession(call)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenSession(call);
                    }
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-primary/20 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {format(call.startedAt, "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDuration(call.durationSeconds)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {call.crisisLevel && call.crisisLevel !== "none" && (
                      <Badge variant="destructive" className="text-xs flex items-center gap-1 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        {CRISIS_COLORS[call.crisisLevel].label}
                      </Badge>
                    )}
                    {(() => {
                      const colorConfig = EMOTION_COLORS[call.mood] ?? EMOTION_COLORS.Neutral;
                      return (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs border font-medium px-2 py-0.5",
                            colorConfig.bg,
                            colorConfig.border,
                            colorConfig.text
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", colorConfig.dot)} />
                          {call.mood}
                        </Badge>
                      );
                    })()}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Conversation Transcript Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={(open) => !open && setSelectedCall(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold">
                    Voice Session Transcript
                  </DialogTitle>
                  {selectedCall && (
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {format(selectedCall.startedAt, "MMMM d, yyyy 'at' h:mm a")} · {formatDuration(selectedCall.durationSeconds)}
                    </DialogDescription>
                  )}
                </div>
              </div>
              {selectedCall && (
                <div className="flex items-center gap-1.5">
                  {selectedCall.crisisLevel && selectedCall.crisisLevel !== "none" && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {CRISIS_COLORS[selectedCall.crisisLevel].label}
                    </Badge>
                  )}
                  {(() => {
                    const colorConfig = EMOTION_COLORS[selectedCall.mood] ?? EMOTION_COLORS.Neutral;
                    return (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs border font-medium px-2 py-0.5",
                          colorConfig.bg,
                          colorConfig.border,
                          colorConfig.text
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", colorConfig.dot)} />
                        {selectedCall.mood}
                      </Badge>
                    );
                  })()}
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Conversation messages thread */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm">Loading session transcript...</p>
              </div>
            ) : !sessionData || sessionData.messages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm">No messages recorded in this session.</p>
              </div>
            ) : (
              sessionData.messages.map((msg, idx) => (
                <div
                  key={`${msg.timestamp}-${idx}`}
                  className={cn(
                    "flex gap-3 p-3.5 rounded-2xl text-sm leading-relaxed",
                    msg.role === "assistant"
                      ? "bg-muted/40 border border-primary/5 mr-4"
                      : "bg-primary/5 border border-primary/10 ml-4"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {msg.role === "assistant" ? (
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                        <Bot className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-foreground/80">
                        {msg.role === "assistant" ? "AI Therapist" : "You (Spoken)"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {msg.technique ? (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                            {msg.technique}
                          </Badge>
                        ) : null}
                        {msg.crisisLevel && msg.crisisLevel !== "none" ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5 gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {CRISIS_COLORS[msg.crisisLevel].label}
                          </Badge>
                        ) : null}
                        {(() => {
                          const effectiveEmotion: Emotion | undefined =
                            (msg.emotion === "Unknown" && (msg.crisisLevel === "high" || msg.crisisLevel === "medium"))
                              ? "Sad"
                              : msg.emotion;
                          const effectiveConfidence =
                            (msg.emotion === "Unknown" && (msg.crisisLevel === "high" || msg.crisisLevel === "medium"))
                              ? 95
                              : msg.confidence;
                          if (!effectiveEmotion || effectiveEmotion === "Unknown") {
                            return null;
                          }
                          return (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] py-0 px-1.5 border",
                                EMOTION_COLORS[effectiveEmotion].bg,
                                EMOTION_COLORS[effectiveEmotion].border
                              )}
                            >
                              <span className={cn("h-1 w-1 rounded-full mr-1", EMOTION_COLORS[effectiveEmotion].dot)} />
                              {effectiveEmotion} {effectiveConfidence ? `· ${Math.round(effectiveConfidence)}%` : ""}
                            </Badge>
                          );
                        })()}
                        <span className="text-[11px] text-muted-foreground/70">
                          {format(new Date(msg.timestamp), "h:mm a")}
                        </span>
                      </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-3 border-t flex sm:flex-row justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedCall(null)}
            >
              Close
            </Button>
            {selectedCall && (
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                onClick={() => handleNavigateToTherapy(selectedCall.id)}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Open Full Session in Therapy
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
