"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  const handleStart = () => {
    setStartedAt(new Date());
    setElapsed(0);
    setIsMuted(false);
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
        <div className="relative w-28 h-28 flex items-center justify-center">
          {isActive && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-2 rounded-full bg-primary/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
              />
            </>
          )}
          <button
            type="button"
            onClick={isActive ? undefined : handleStart}
            disabled={isActive}
            className={cn(
              "relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
              "bg-gradient-to-r from-primary via-primary/90 to-secondary shadow-lg shadow-primary/30",
              !isActive && "hover:scale-105 cursor-pointer"
            )}
          >
            {isActive ? (
              <Phone className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>
        </div>

        {isActive ? (
          <div className="flex flex-col items-center gap-4">
            <span className="text-2xl font-semibold tabular-nums">
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
