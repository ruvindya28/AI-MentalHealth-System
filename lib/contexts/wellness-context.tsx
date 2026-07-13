"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CrisisLevel, Emotion } from "@/lib/mock-emotion-analyzer";

export interface EmotionLogEntry {
  id: string;
  timestamp: Date;
  emotion: Emotion;
  confidence: number;
  crisisLevel: CrisisLevel;
}

interface WellnessContextValue {
  emotionLog: EmotionLogEntry[];
  addEmotionEntry: (entry: Omit<EmotionLogEntry, "id" | "timestamp">) => void;
}

const WellnessContext = createContext<WellnessContextValue | null>(null);

export function WellnessProvider({ children }: { children: ReactNode }) {
  const [emotionLog, setEmotionLog] = useState<EmotionLogEntry[]>([]);

  const addEmotionEntry: WellnessContextValue["addEmotionEntry"] = (entry) => {
    setEmotionLog((prev) => [
      { ...entry, id: crypto.randomUUID(), timestamp: new Date() },
      ...prev,
    ]);
  };

  return (
    <WellnessContext.Provider value={{ emotionLog, addEmotionEntry }}>
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const ctx = useContext(WellnessContext);
  if (!ctx) {
    throw new Error("useWellness must be used within a WellnessProvider");
  }
  return ctx;
}
