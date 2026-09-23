import json
from typing import List
from .config import CRISIS_KEYWORDS_PATH

try:
    with open(CRISIS_KEYWORDS_PATH, "r", encoding="utf-8") as f:
        CRISIS_KEYWORDS: List[str] = json.load(f)
except Exception:
    CRISIS_KEYWORDS = [
        "want to die", "end my life", "kill myself", "suicide", "suicidal",
        "no reason to live", "no point in living", "no point living",
        "cant go on", "can't go on", "want to disappear", "disappear forever",
        "hurting myself", "hurt myself", "not worth living", "better off dead",
        "give up on life", "dont want to be here", "don't want to be here",
        "cant do this anymore", "can't do this anymore", "end it all",
        "not worth it anymore", "wish i wasnt alive", "wish i wasn't alive",
        "kill someone", "kill somebody", "kill people", "want to kill",
        "going to kill", "gonna kill", "murder someone", "murder somebody",
        "shoot someone", "hurt someone", "harm someone", "harm others", "stab someone"
    ]

VIOLENCE_KEYWORDS: List[str] = [
    "kill someone", "kill somebody", "kill people", "want to kill",
    "going to kill", "gonna kill", "murder", "murder someone",
    "murder somebody", "shoot someone", "hurt someone", "harm someone",
    "harm others", "stab someone"
]


def check_crisis_keywords(text: str) -> bool:
    """Performs exact substring matching against the validated crisis keywords list."""
    lowered = text.lower()
    return any(kw in lowered for kw in CRISIS_KEYWORDS)


def check_violence_keywords(text: str) -> bool:
    """Checks for explicit indicators of violent intent or harm to others."""
    lowered = text.lower()
    return any(kw in lowered for kw in VIOLENCE_KEYWORDS)


def compute_crisis_level(
    keyword_flag: bool,
    mental_health_status: str,
    emotion: str,
    emotion_confidence: float
) -> str:
    """Computes a multi-factor deterministic crisis severity level: 'none', 'low', 'medium', or 'high'.

    Integrates mental health status, crisis keywords, and negative emotional intensity
    as specified in Research Objective 3.
    """
    if keyword_flag and mental_health_status == "Suicidal":
        return "high"
    if keyword_flag:
        return "high"
    if mental_health_status == "Suicidal":
        return "medium"

    # Secondary ongoing risk indicators
    elevated_risk_statuses = {"Depression", "Stress", "Bipolar", "Personality disorder"}
    if mental_health_status in elevated_risk_statuses:
        # If accompanied by high-confidence Sad or Anxious emotion, elevate to low/medium
        if emotion in {"Sad", "Anxious"} and emotion_confidence >= 75.0:
            return "low"
        return "low"

    return "none"
