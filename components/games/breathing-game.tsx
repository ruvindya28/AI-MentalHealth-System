"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Wind, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function BreathingGame() {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [progress, setProgress] = useState(0);
  const [round, setRound] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const TOTAL_ROUND = 5;

  useEffect(() => {
    if (isComplete || isPaused) return;

    let timer: NodeJS.Timeout;

    if (phase === "inhale") {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setPhase("hold");
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    } else if (phase === "hold") {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setPhase("exhale");
            return 0;
          }
          return prev + 4;
        });
      }, 100);
    } else if (phase === "exhale") {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (round >= TOTAL_ROUND) {
              setIsComplete(true);
              return 100;
            }
            setPhase("inhale");
            setRound((r) => r + 1);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }

    return () => clearInterval(timer);
  }, [phase, round, isComplete, isPaused]);

  const handleReset = () => {
    setPhase("inhale");
    setProgress(0);
    setRound(1);
    setIsComplete(false);
    setIsPaused(false);
  };

  const getPhaseInstruction = () => {
    if (isComplete) return "Activity Complete! Great job.";
    switch (phase) {
      case "inhale":
        return "Inhale deeply through your nose";
      case "hold":
        return "Hold your breath calmly";
      case "exhale":
        return "Exhale slowly through your mouth";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-7 bg-card/40 backdrop-blur-md rounded-3xl border border-border/50">
      {/* Round & Status Header */}
      <div className="flex items-center justify-between w-full">
        <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Round {round} of {TOTAL_ROUND}
        </Badge>
        {isPaused && (
          <Badge variant="secondary" className="text-xs px-2.5 py-0.5 rounded-full font-medium">
            Paused
          </Badge>
        )}
      </div>

      {/* Animated Breathing Circle */}
      <div className="relative w-44 h-44 flex items-center justify-center my-2">
        {/* Glow Ring */}
        <motion.div
          animate={{
            scale: isComplete ? 1 : phase === "inhale" ? 1.45 : phase === "hold" ? 1.45 : 1.0,
            opacity: phase === "hold" ? 0.8 : 0.4,
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-emerald-400 to-teal-400 blur-xl"
        />

        {/* Outer Ring */}
        <motion.div
          animate={{
            scale: isComplete ? 1 : phase === "inhale" ? 1.35 : phase === "hold" ? 1.35 : 1.0,
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border-2 border-primary/30 bg-primary/10 backdrop-blur-sm"
        />

        {/* Center Content */}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-1 text-center">
          <Wind className="w-10 h-10 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {phase}
          </span>
        </div>
      </div>

      {/* Phase Label & Instructions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isComplete ? "complete" : phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-1"
        >
          <h3 className="text-2xl font-bold font-heading text-foreground">
            {isComplete
              ? "Feeling Relaxed?"
              : phase === "inhale"
              ? "Breathe In"
              : phase === "hold"
              ? "Hold"
              : "Breathe Out"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xs">
            {getPhaseInstruction()}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="w-full max-w-xs space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>Phase Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2.5 rounded-full" />
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3 pt-1">
        {!isComplete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="rounded-full px-5 border-primary/30 hover:bg-primary/10 font-semibold gap-2"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 text-primary" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-primary" /> Pause
              </>
            )}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="rounded-full px-5 font-semibold text-muted-foreground hover:text-foreground gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>
    </div>
  );
}
