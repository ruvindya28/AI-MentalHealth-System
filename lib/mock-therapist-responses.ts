// Canned reply generator standing in for the real AI therapist model.
// Picks a response by detected emotion/crisis level from analyzeText().

import type { EmotionAnalysis } from "./mock-emotion-analyzer";
import { classifyIntent } from "./dialogue/intent";

export interface CannedResponse {
  text: string;
  technique: string;
}

const RESPONSES: Record<string, CannedResponse> = {
  Anxious: {
    text: "It sounds like you're carrying a lot of anxiety right now. Let's slow down together — try breathing in for 4 counts, holding for 4, and releasing for 4.",
    technique: "Grounding Technique",
  },
  Sad: {
    text: "I hear that you're going through something heavy. Your feelings are valid, and I'm here to listen for as long as you need.",
    technique: "Active Listening",
  },
  Angry: {
    text: "That frustration sounds real. Would it help to talk through what's driving it?",
    technique: "Validation",
  },
  Hopeful: {
    text: "It's good to hear some hope in what you're sharing. What's been helping you feel this way?",
    technique: "Positive Reinforcement",
  },
  Calm: {
    text: "Thank you for sharing how you're feeling. I'm here whenever you'd like to talk more.",
    technique: "Active Listening",
  },
  Neutral: {
    text: "Thank you for sharing that with me. Can you tell me a bit more about what's on your mind?",
    technique: "Open-Ended Inquiry",
  },
  Unknown: {
    text: "I want to be sure I understand where you're coming from. Could you share a bit more about how you're feeling today?",
    technique: "Clarifying Question",
  },
};

const CRISIS_RESPONSE: CannedResponse = {
  text: "I'm really concerned about what you just shared, and I want you to know you're not alone in this. If you're in immediate danger, please contact your local emergency number or a crisis helpline right now. Would it help to talk about what support looks like for you right now?",
  technique: "Crisis Support",
};

const VIOLENCE_CRISIS_RESPONSE: CannedResponse = {
  text: "I hear that you're experiencing intense frustration or distress, but hurting someone else is never the answer. If you feel at risk of acting on these thoughts, please step away and contact emergency services or a crisis counselor immediately. Let's pause and take a slow breath — would it help to talk about what is causing you to feel this angry?",
  technique: "De-escalation & Safety Support",
};

export function generateReply(analysis: EmotionAnalysis, userMessage?: string): CannedResponse {
  if (analysis.crisisLevel === "medium" || analysis.crisisLevel === "high") {
    const lower = (userMessage || "").toLowerCase();
    const isViolence =
      lower.includes("kill someone") ||
      lower.includes("kill somebody") ||
      lower.includes("murder") ||
      lower.includes("hurt someone") ||
      lower.includes("harm someone") ||
      lower.includes("kill people") ||
      lower.includes("want to kill") ||
      lower.includes("shoot someone") ||
      lower.includes("stab someone");
    if (isViolence) {
      return VIOLENCE_CRISIS_RESPONSE;
    }
    return CRISIS_RESPONSE;
  }

  // If the user expressed a real non-neutral emotion (Sad, Anxious, Depressed, etc.),
  // prioritize empathy and therapeutic response over casual greeting replies!
  const isEmotionalDisclosure =
    analysis.emotion !== "Neutral" && analysis.emotion !== "Unknown";

  if (userMessage && !isEmotionalDisclosure) {
    const intent = classifyIntent(userMessage);
    if (intent === "greeting") {
      return {
        text: "Hi! How are you doing today?",
        technique: "Greeting / Rapport Building",
      };
    }
    if (intent === "pleasantry") {
      return {
        text: "Hi! My day is going well, thanks for asking. How is yours going?",
        technique: "Greeting / Rapport Building",
      };
    }
    if (intent === "closure") {
      return {
        text: "Take care of yourself. I'm here whenever you'd like to check in or talk again.",
        technique: "Supportive Closure",
      };
    }
  }

  if (analysis.emotion === "Unknown") {
    if (userMessage && userMessage.trim().length <= 30) {
      return {
        text: `You mentioned "${userMessage.trim()}" — could you share a bit more context about what's on your mind or how you're feeling today?`,
        technique: "Clarifying Question",
      };
    }
    return RESPONSES.Unknown;
  }

  return RESPONSES[analysis.emotion] ?? RESPONSES.Neutral;
}
