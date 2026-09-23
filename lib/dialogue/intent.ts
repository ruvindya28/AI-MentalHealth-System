export type ConversationalIntent =
    | "greeting"
    | "pleasantry"
    | "closure"
    | "disclosure";

// Pure greetings only (e.g. "Hi", "Hello!", "Hey there", "Good morning")
// with no subsequent disclosure or emotional statements.
const PURE_GREETING_REGEX =
    /^\s*(hi|hello|hey|heya|hiya|howdy|sup|yo|good\s+(morning|afternoon|evening|day)|greetings)(\s+(there|therapist|doc|doctor|friend|everyone))?[.!,?]*\s*$/i;

const PLEASANTRY_PATTERNS = [
    /how\s*(are\s*you|are\s*u|r\s*u|have\s*you\s*been)/i,
    /how\s*(is|'s)\s*(your\s*day|it\s*going|everything|life)/i,
    /how\s*do\s*you\s*do/i,
    /what('s|\s*is)\s*up/i,
];

const CLOSURE_PATTERNS = [
    /^\s*(bye|goodbye|see\s*you|talk\s*later|cya|take\s*care|goodnight)\b/i,
    /^\s*have\s*a\s*good\s*(day|night|evening|weekend)\b/i,
];

/**
 * Classifies the conversational intent of a user message.
 * Pure casual openers (e.g. "Hi", "How are you?") are recognized so the AI can build rapport.
 * Any message that includes emotional disclosures (e.g. "Hi, I am sad") returns "disclosure".
 */
export function classifyIntent(text: string): ConversationalIntent {
    const trimmed = text.trim();
    if (!trimmed) return "disclosure";

    // 1. Check for pure greeting (exact single greeting phrase with no emotional disclosure attached)
    if (PURE_GREETING_REGEX.test(trimmed)) {
        return "greeting";
    }

    // 2. Check for pleasantry (e.g. "How are you?", "How's your day?")
    for (const pattern of PLEASANTRY_PATTERNS) {
        if (pattern.test(trimmed)) {
            if (trimmed.length <= 50) {
                return "pleasantry";
            }
        }
    }

    // 3. Check for closure/farewell
    for (const pattern of CLOSURE_PATTERNS) {
        if (pattern.test(trimmed)) {
            return "closure";
        }
    }

    return "disclosure";
}

