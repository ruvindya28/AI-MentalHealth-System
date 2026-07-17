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

// Display order is fixed (not sorted by value) — validated for adjacent
// colorblind separation. Keep this order wherever emotions are listed together.
export const EMOTION_ORDER: Emotion[] = [
  "Calm",
  "Hopeful",
  "Neutral",
  "Anxious",
  "Sad",
  "Angry",
];

export const EMOTION_COLORS: Record<Emotion, { text: string; bg: string; border: string; bar: string; dot: string }> = {
  Calm: { text: "text-foreground", bg: "bg-emotion-calm/10", border: "border-emotion-calm/30", bar: "bg-emotion-calm", dot: "bg-emotion-calm" },
  Hopeful: { text: "text-foreground", bg: "bg-emotion-hopeful/10", border: "border-emotion-hopeful/30", bar: "bg-emotion-hopeful", dot: "bg-emotion-hopeful" },
  Neutral: { text: "text-foreground", bg: "bg-emotion-neutral/10", border: "border-emotion-neutral/30", bar: "bg-emotion-neutral", dot: "bg-emotion-neutral" },
  Anxious: { text: "text-foreground", bg: "bg-emotion-anxious/10", border: "border-emotion-anxious/30", bar: "bg-emotion-anxious", dot: "bg-emotion-anxious" },
  Sad: { text: "text-foreground", bg: "bg-emotion-sad/10", border: "border-emotion-sad/30", bar: "bg-emotion-sad", dot: "bg-emotion-sad" },
  Angry: { text: "text-foreground", bg: "bg-emotion-angry/10", border: "border-emotion-angry/30", bar: "bg-emotion-angry", dot: "bg-emotion-angry" },
};

export const CRISIS_COLORS: Record<CrisisLevel, { text: string; bg: string; ring: string; label: string }> = {
  none: { text: "text-crisis-none", bg: "bg-crisis-none", ring: "ring-crisis-none/30", label: "None detected" },
  low: { text: "text-crisis-low", bg: "bg-crisis-low", ring: "ring-crisis-low/30", label: "Low" },
  medium: { text: "text-crisis-medium", bg: "bg-crisis-medium", ring: "ring-crisis-medium/30", label: "Medium" },
  high: { text: "text-crisis-high", bg: "bg-crisis-high", ring: "ring-crisis-high/30", label: "High" },
};
