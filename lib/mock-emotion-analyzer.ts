// Placeholder heuristic that stands in for the real trained emotion/crisis
// detection model. Keyword-matched, not ML — swap this out once the model
// from training is ready to serve predictions.

export type CrisisLevel = "none" | "low" | "medium" | "high";

export type Emotion =
  | "Anxious"
  | "Sad"
  | "Angry"
  | "Hopeful"
  | "Calm"
  | "Neutral";

export interface EmotionAnalysis {
  emotion: Emotion;
  confidence: number;
  crisisLevel: CrisisLevel;
}

const CRISIS_KEYWORDS: Record<Exclude<CrisisLevel, "none">, string[]> = {
  high: [
    "kill myself",
    "suicide",
    "end my life",
    "want to die",
    "no reason to live",
    "better off dead",
  ],
  medium: [
    "hopeless",
    "can't go on",
    "cant go on",
    "give up",
    "worthless",
    "self harm",
    "self-harm",
  ],
  low: ["overwhelmed", "panic attack", "can't cope", "cant cope", "breaking down"],
};

const EMOTION_KEYWORDS: Record<Emotion, string[]> = {
  Anxious: ["anxious", "anxiety", "nervous", "worried", "panic", "stressed", "tense"],
  Sad: ["sad", "down", "depressed", "crying", "lonely", "empty", "hurt"],
  Angry: ["angry", "furious", "frustrated", "mad", "irritated", "annoyed"],
  Hopeful: ["hopeful", "better", "improving", "grateful", "excited", "proud"],
  Calm: ["calm", "relaxed", "peaceful", "fine", "okay", "good", "content"],
  Neutral: [],
};

export function analyzeText(text: string): EmotionAnalysis {
  const lower = text.toLowerCase();

  let crisisLevel: CrisisLevel = "none";
  for (const level of ["high", "medium", "low"] as const) {
    if (CRISIS_KEYWORDS[level].some((kw) => lower.includes(kw))) {
      crisisLevel = level;
      break;
    }
  }

  let bestEmotion: Emotion = "Neutral";
  let bestScore = 0;
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS) as [
    Emotion,
    string[],
  ][]) {
    const matches = keywords.filter((kw) => lower.includes(kw)).length;
    if (matches > bestScore) {
      bestScore = matches;
      bestEmotion = emotion;
    }
  }

  const confidence = bestScore > 0 ? Math.min(60 + bestScore * 15, 96) : 55;

  return { emotion: bestEmotion, confidence, crisisLevel };
}

export const EMOTION_COLORS: Record<Emotion, { text: string; bg: string; bar: string }> = {
  Anxious: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", bar: "bg-amber-500" },
  Sad: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", bar: "bg-blue-500" },
  Angry: { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", bar: "bg-rose-500" },
  Hopeful: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500" },
  Calm: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", bar: "bg-purple-500" },
  Neutral: { text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500/10", bar: "bg-slate-500" },
};

export const CRISIS_COLORS: Record<CrisisLevel, { text: string; bg: string; ring: string; label: string }> = {
  none: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", ring: "ring-emerald-500/30", label: "None detected" },
  low: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", ring: "ring-amber-500/30", label: "Low" },
  medium: { text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500", ring: "ring-orange-500/30", label: "Medium" },
  high: { text: "text-red-600 dark:text-red-400", bg: "bg-red-500", ring: "ring-red-500/30", label: "High" },
};
