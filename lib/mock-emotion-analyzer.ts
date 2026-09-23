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
  | "Neutral"
  | "Unknown";

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
    "kill someone",
    "kill somebody",
    "kill people",
    "want to kill",
    "going to kill",
    "gonna kill",
    "murder someone",
    "murder somebody",
    "shoot someone",
    "hurt someone",
    "harm someone",
    "harm others",
    "stab someone",
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

const VIOLENCE_KEYWORDS = [
  "kill someone",
  "kill somebody",
  "kill people",
  "want to kill",
  "going to kill",
  "gonna kill",
  "murder",
  "shoot someone",
  "hurt someone",
  "harm someone",
  "harm others",
  "stab someone",
];

const EMOTION_KEYWORDS: Record<Exclude<Emotion, "Unknown">, string[]> = {
  Anxious: ["anxious", "anxiety", "nervous", "worried", "panic", "stressed", "tense"],
  Sad: ["sad", "down", "depressed", "crying", "lonely", "empty", "hurt"],
  Angry: ["angry", "furious", "frustrated", "mad", "irritated", "annoyed"],
  Hopeful: ["hopeful", "better", "improving", "grateful", "excited", "proud", "great"],
  Calm: ["calm", "relaxed", "peaceful", "fine", "okay", "good", "well", "content"],
  Neutral: ["fine", "routine", "everyday", "regular", "normal", "usual"],
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

  const isViolence = VIOLENCE_KEYWORDS.some((kw) => lower.includes(kw));
  if (isViolence && crisisLevel === "none") {
    crisisLevel = "high";
  }

  // Check for degenerate / gibberish text (e.g., 'ssssss', single repeating letters)
  const alphaChars = lower.replace(/[^a-z]/g, "");
  const uniqueChars = new Set(alphaChars);
  if (alphaChars.length >= 3 && uniqueChars.size === 1) {
    return { emotion: "Unknown", confidence: 0, crisisLevel };
  }

  let bestEmotion: Emotion = "Unknown";
  let bestScore = 0;
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS) as [
    Exclude<Emotion, "Unknown">,
    string[],
  ][]) {
    const matches = keywords.filter((kw) => lower.includes(kw)).length;
    if (matches > bestScore) {
      bestScore = matches;
      bestEmotion = emotion;
    }
  }

  // Polarity constraint: positive emotions ("Hopeful", "Calm", "Neutral") must NEVER
  // be returned if a crisis or violent threat is detected.
  if (crisisLevel === "high" || crisisLevel === "medium") {
    if (isViolence || lower.includes("kill") || lower.includes("murder")) {
      bestEmotion = "Angry";
      bestScore = Math.max(bestScore, 2);
    } else if (
      bestEmotion === "Hopeful" ||
      bestEmotion === "Calm" ||
      bestEmotion === "Neutral" ||
      bestEmotion === "Unknown"
    ) {
      bestEmotion = "Sad";
      bestScore = Math.max(bestScore, 2);
    }
  }

  // If no emotional keyword matched, check if a crisis was detected
  if (bestScore === 0) {
    if (crisisLevel !== "none") {
      const emotion = isViolence ? "Angry" : "Sad";
      return { emotion, confidence: crisisLevel === "high" ? 95 : 85, crisisLevel };
    }
    return { emotion: "Unknown", confidence: 0, crisisLevel };
  }

  const confidence = Math.min(60 + bestScore * 15, 96);
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
  "Unknown",
];

export const EMOTION_COLORS: Record<Emotion, { text: string; bg: string; border: string; bar: string; dot: string }> = {
  Calm: { text: "text-foreground", bg: "bg-emotion-calm/10", border: "border-emotion-calm/30", bar: "bg-emotion-calm", dot: "bg-emotion-calm" },
  Hopeful: { text: "text-foreground", bg: "bg-emotion-hopeful/10", border: "border-emotion-hopeful/30", bar: "bg-emotion-hopeful", dot: "bg-emotion-hopeful" },
  Neutral: { text: "text-foreground", bg: "bg-emotion-neutral/10", border: "border-emotion-neutral/30", bar: "bg-emotion-neutral", dot: "bg-emotion-neutral" },
  Anxious: { text: "text-foreground", bg: "bg-emotion-anxious/10", border: "border-emotion-anxious/30", bar: "bg-emotion-anxious", dot: "bg-emotion-anxious" },
  Sad: { text: "text-foreground", bg: "bg-emotion-sad/10", border: "border-emotion-sad/30", bar: "bg-emotion-sad", dot: "bg-emotion-sad" },
  Angry: { text: "text-foreground", bg: "bg-emotion-angry/10", border: "border-emotion-angry/30", bar: "bg-emotion-angry", dot: "bg-emotion-angry" },
  Unknown: { text: "text-muted-foreground", bg: "bg-muted/40", border: "border-muted/50", bar: "bg-muted-foreground/40", dot: "bg-muted-foreground" },
};

export const CRISIS_COLORS: Record<CrisisLevel, { text: string; bg: string; ring: string; label: string }> = {
  none: { text: "text-crisis-none", bg: "bg-crisis-none", ring: "ring-crisis-none/30", label: "None detected" },
  low: { text: "text-crisis-low", bg: "bg-crisis-low", ring: "ring-crisis-low/30", label: "Low" },
  medium: { text: "text-crisis-medium", bg: "bg-crisis-medium", ring: "ring-crisis-medium/30", label: "Medium" },
  high: { text: "text-crisis-high", bg: "bg-crisis-high", ring: "ring-crisis-high/30", label: "High" },
};

