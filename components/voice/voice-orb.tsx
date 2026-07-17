"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type VoiceOrbState = "idle" | "listening" | "speaking";

interface VoiceOrbProps {
  state: VoiceOrbState;
  size?: number;
  barCount?: number;
  children?: React.ReactNode;
  className?: string;
}

const STATE_LABEL: Record<VoiceOrbState, string> = {
  idle: "Ready",
  listening: "Listening…",
  speaking: "Speaking…",
};

// Deterministic pseudo-random in [0,1) so SSR and the client hydrate to the
// same bar heights — Math.random() here would cause a hydration mismatch.
function seedFor(i: number) {
  return (Math.sin(i * 12.9898) + 1) / 2;
}

export function VoiceOrb({
  state,
  size = 128,
  barCount = 14,
  children,
  className,
}: VoiceOrbProps) {
  const reduceMotion = useReducedMotion();

  const bars = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) => ({
        seed: seedFor(i),
        delay: (i / barCount) * 0.5,
      })),
    [barCount]
  );

  const ringDuration = state === "idle" ? 4 : state === "listening" ? 1.6 : 1.2;
  const isSpeaking = state === "speaking";

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {!reduceMotion && (
          <>
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full",
                isSpeaking ? "bg-accent/25" : "bg-primary/20"
              )}
              animate={
                state === "idle"
                  ? { scale: [1, 1.05, 1], opacity: [0.45, 0.65, 0.45] }
                  : { scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }
              }
              transition={{ duration: ringDuration, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className={cn(
                "absolute inset-3 rounded-full",
                isSpeaking ? "bg-accent/20" : "bg-primary/15"
              )}
              animate={
                state === "idle"
                  ? { scale: [1, 1.03, 1], opacity: [0.35, 0.5, 0.35] }
                  : { scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }
              }
              transition={{
                duration: ringDuration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
          </>
        )}

        <motion.div
          className={cn(
            "absolute rounded-full bg-linear-to-br shadow-lg",
            isSpeaking
              ? "from-accent via-primary to-accent shadow-accent/30"
              : "from-primary via-primary/90 to-secondary shadow-primary/30"
          )}
          style={{ width: size * 0.72, height: size * 0.72 }}
          animate={
            reduceMotion
              ? undefined
              : state === "idle"
                ? { scale: [1, 1.04, 1] }
                : { scale: [1, 1.06, 1] }
          }
          transition={{ duration: ringDuration, repeat: Infinity, ease: "easeInOut" }}
        />

        <div
          className="relative z-10 flex items-center justify-center"
          style={{ width: size * 0.72, height: size * 0.72 }}
        >
          {children}
        </div>
      </div>

      <div className="flex h-6 items-end justify-center gap-1" aria-hidden="true">
        {bars.map((bar, i) => (
          <motion.span
            key={i}
            className={cn(
              "w-1 rounded-full",
              isSpeaking ? "bg-accent-foreground/50" : "bg-primary/50",
              state === "idle" && "opacity-30"
            )}
            animate={
              reduceMotion || state === "idle"
                ? { height: 4 }
                : state === "listening"
                  ? { height: [4, 6 + bar.seed * 16, 4] }
                  : { height: [4, 10 + bar.seed * 18, 4] }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: state === "listening" ? 0.4 + bar.seed * 0.4 : 0.35 + bar.seed * 0.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: bar.delay,
                  }
            }
          />
        ))}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {STATE_LABEL[state]}
      </span>
    </div>
  );
}
