"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type VoiceOrbState = "idle" | "listening" | "processing" | "speaking";

export interface VoiceOrbProps {
  state: VoiceOrbState;
  size?: number;
  barCount?: number;
  audioLevel?: number; // 0.0 to 1.0 real-time amplitude
  frequencies?: number[]; // 0.0 to 1.0 frequency array for individual bars
  children?: React.ReactNode;
  className?: string;
}

const STATE_LABEL: Record<VoiceOrbState, string> = {
  idle: "Ready",
  listening: "Listening…",
  processing: "Thinking…",
  speaking: "Speaking…",
};

export function VoiceOrb({
  state,
  size = 136,
  barCount = 14,
  audioLevel = 0,
  frequencies,
  children,
  className,
}: VoiceOrbProps) {
  const reduceMotion = useReducedMotion();

  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const isVoiceActive = isListening && audioLevel > 0.04;

  // Outer glow size & intensity scales dynamically with speech volume
  const dynamicGlowScale = isVoiceActive
    ? 1 + audioLevel * 0.45
    : isSpeaking
      ? 1 + audioLevel * 0.3
      : isProcessing
        ? 1.08
        : 1;

  const dynamicGlowOpacity = isVoiceActive
    ? 0.35 + audioLevel * 0.55
    : isSpeaking
      ? 0.3 + audioLevel * 0.45
      : isProcessing
        ? 0.4
        : 0.15;

  const dynamicCoreScale = isVoiceActive
    ? 1 + audioLevel * 0.12
    : isSpeaking
      ? 1 + audioLevel * 0.08
      : 1;

  return (
    <div className={cn("flex flex-col items-center gap-2.5 select-none shrink-0", className)}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {!reduceMotion && (
          <>
            {/* Outer dynamic diffuse glow - expands when speaking */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full blur-xl pointer-events-none transition-colors duration-300",
                isSpeaking
                  ? "bg-emerald-500/40"
                  : isVoiceActive
                    ? "bg-primary/50"
                    : "bg-primary/20"
              )}
              animate={{
                scale: dynamicGlowScale,
                opacity: dynamicGlowOpacity,
              }}
              transition={{ duration: 0.08, ease: "easeOut" }}
            />

            {/* Inner pulsating ring - ripples outward when voice volume spikes */}
            <motion.div
              className={cn(
                "absolute inset-2 rounded-full blur-md pointer-events-none transition-colors duration-300",
                isSpeaking
                  ? "bg-emerald-400/30"
                  : isVoiceActive
                    ? "bg-primary/35"
                    : "bg-primary/15"
              )}
              animate={{
                scale: isVoiceActive
                  ? 1 + audioLevel * 0.25
                  : isProcessing
                    ? [1, 1.05, 1]
                    : 1,
                opacity: isVoiceActive ? 0.6 : isProcessing ? [0.3, 0.6, 0.3] : 0.2,
              }}
              transition={
                isProcessing
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.08, ease: "easeOut" }
              }
            />
          </>
        )}

        {/* Center spherical orb */}
        <motion.div
          className={cn(
            "absolute rounded-full bg-gradient-to-br shadow-xl transition-colors duration-300",
            isSpeaking
              ? "from-emerald-500 via-teal-600 to-emerald-700 shadow-emerald-500/30"
              : isVoiceActive
                ? "from-primary via-indigo-600 to-purple-600 shadow-primary/40"
                : "from-primary via-primary/90 to-primary/70 shadow-primary/20"
          )}
          style={{ width: size * 0.72, height: size * 0.72 }}
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: dynamicCoreScale,
                }
          }
          transition={{ duration: 0.06, ease: "easeOut" }}
        />

        {/* Content / Interactive icon */}
        <div
          className="relative z-10 flex items-center justify-center text-primary-foreground"
          style={{ width: size * 0.72, height: size * 0.72 }}
        >
          {children}
        </div>
      </div>

      {/* Real-time reactive audio frequency bars - only jump up when speaking */}
      <div className="flex h-8 items-center justify-center gap-1.5" aria-hidden="true">
        {Array.from({ length: barCount }, (_, i) => {
          const freqVal = frequencies?.[i] ?? 0;
          const targetHeight = isVoiceActive
            ? Math.max(4, 4 + freqVal * 24)
            : isSpeaking
              ? Math.max(4, 4 + (frequencies?.[i] ?? audioLevel) * 22)
              : 4;

          const isBarLit = isVoiceActive || (isSpeaking && audioLevel > 0.05);

          return (
            <motion.span
              key={i}
              className={cn(
                "w-1.5 rounded-full transition-colors duration-200",
                isSpeaking
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : isBarLit
                    ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]"
                    : "bg-muted-foreground/25"
              )}
              animate={
                reduceMotion
                  ? { height: 4 }
                  : { height: targetHeight }
              }
              transition={{ duration: 0.05, ease: "linear" }}
            />
          );
        })}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {STATE_LABEL[state]}
      </span>
    </div>
  );
}

