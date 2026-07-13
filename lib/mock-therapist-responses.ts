// Canned reply generator standing in for the real AI therapist model.
// Picks a response by detected emotion/crisis level from analyzeText().

import type { EmotionAnalysis } from "./mock-emotion-analyzer";

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
};

const CRISIS_RESPONSE: CannedResponse = {
  text: "I'm really concerned about what you just shared, and I want you to know you're not alone in this. If you're in immediate danger, please contact your local emergency number or a crisis helpline right now. Would it help to talk about what support looks like for you right now?",
  technique: "Crisis Support",
};

export function generateReply(analysis: EmotionAnalysis): CannedResponse {
  if (analysis.crisisLevel === "medium" || analysis.crisisLevel === "high") {
    return CRISIS_RESPONSE;
  }
  return RESPONSES[analysis.emotion] ?? RESPONSES.Neutral;
}
