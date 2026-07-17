"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VoiceOrb, type VoiceOrbState } from "@/components/voice/voice-orb";

const MOODS = ["Calm", "Reflective", "Hopeful", "Content", "Anxious"];

export interface CallRecord {
  id: string;
  startedAt: Date;
  durationSeconds: number;
  mood: string;
}

interface VoiceSessionCardProps {
  onCallEnd: (record: CallRecord) => void;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function VoiceSessionCard({ onCallEnd }: VoiceSessionCardProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [voicingPhase, setVoicingPhase] = useState<"listening" | "speaking">("listening");

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || isMuted) return;
    // No real audio pipeline yet — alternate listening/speaking to preview
    // both voice-orb states while a mock call is "active".
    const timer = setInterval(() => {
      setVoicingPhase((prev) => (prev === "listening" ? "speaking" : "listening"));
    }, 3500);
    return () => clearInterval(timer);
  }, [isActive, isMuted]);

  const orbState: VoiceOrbState = !isActive || isMuted ? "idle" : voicingPhase;

  const handleStart = () => {
    setStartedAt(new Date());
    setElapsed(0);
    setIsMuted(false);
    setVoicingPhase("listening");
    setIsActive(true);
  };

  const handleEnd = () => {
    setIsActive(false);
    onCallEnd({
      id: crypto.randomUUID(),
      startedAt: startedAt ?? new Date(),
      durationSeconds: elapsed,
      mood: MOODS[Math.floor(Math.random() * MOODS.length)],
    });
  };

  return (
    <Card className="border-primary/10 h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Voice Session</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Preview
          </Badge>
        </div>
        <CardDescription>Talk it out with your AI therapist</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-6 py-6">
        <VoiceOrb state={orbState} size={128}>
          <button
            type="button"
            onClick={isActive ? undefined : handleStart}
            disabled={isActive}
            className={cn(
              "flex h-full w-full items-center justify-center rounded-full transition-transform duration-300",
              !isActive && "hover:scale-105 cursor-pointer"
            )}
          >
            {isActive ? (
              <Phone className="w-7 h-7 text-primary-foreground" />
            ) : (
              <Mic className="w-7 h-7 text-primary-foreground" />
            )}
          </button>
        </VoiceOrb>

        {isActive ? (
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground">
              {isMuted ? "Muted" : orbState === "speaking" ? "Speaking…" : "Listening…"}
            </span>
            <span className="text-2xl font-semibold font-heading tabular-nums">
              {formatDuration(elapsed)}
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => setIsMuted((m) => !m)}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full"
                onClick={handleEnd}
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tap to start a voice session
          </p>
        )}
      </CardContent>
    </Card>
  );
}
