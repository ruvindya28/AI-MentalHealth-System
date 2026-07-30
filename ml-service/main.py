import json
import pickle
import re
from pathlib import Path

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

MODELS_DIR = Path(__file__).parent / "models"

app = FastAPI(title="MindCare ML Service")

# Called server-to-server from the Next.js app, not from the browser,
# but CORS is left open for local development against this service directly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def clean_text(text: str) -> str:
    """Must match the preprocessing used at training time (cleaning.ipynb) —
    a mismatch here silently degrades every prediction."""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"[^a-z0-9\s!?.,']", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


with open(MODELS_DIR / "emotion_vectorizer.pkl", "rb") as f:
    emotion_vectorizer = pickle.load(f)
with open(MODELS_DIR / "emotion_model.pkl", "rb") as f:
    emotion_model = pickle.load(f)
with open(MODELS_DIR / "mh_vectorizer.pkl", "rb") as f:
    mh_vectorizer = pickle.load(f)
with open(MODELS_DIR / "mh_model.pkl", "rb") as f:
    mh_model = pickle.load(f)
with open(MODELS_DIR / "crisis_keywords.json", encoding="utf-8") as f:
    CRISIS_KEYWORDS: list[str] = json.load(f)


def keyword_crisis_flag(text: str) -> bool:
    lowered = text.lower()
    return any(kw in lowered for kw in CRISIS_KEYWORDS)


def softmax(scores: np.ndarray) -> np.ndarray:
    shifted = scores - np.max(scores)
    exp = np.exp(shifted)
    return exp / exp.sum()


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    emotion: str
    emotionConfidence: float
    mentalHealthStatus: str
    crisisFlag: bool
    keywordFlag: bool


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    cleaned = clean_text(request.text)

    emotion_vec = emotion_vectorizer.transform([cleaned])
    emotion_pred = emotion_model.predict(emotion_vec)[0]
    # LinearSVC has no predict_proba; turn the decision margins into a
    # pseudo-confidence via softmax over the per-class scores.
    decision_scores = emotion_model.decision_function(emotion_vec)[0]
    emotion_confidence = float(np.max(softmax(decision_scores)) * 100)

    mh_vec = mh_vectorizer.transform([cleaned])
    mh_pred = mh_model.predict(mh_vec)[0]

    keyword_flag = keyword_crisis_flag(request.text)
    crisis_flag = bool(mh_pred == "Suicidal" or keyword_flag)

    return AnalyzeResponse(
        emotion=str(emotion_pred),
        emotionConfidence=round(emotion_confidence, 1),
        mentalHealthStatus=str(mh_pred),
        crisisFlag=crisis_flag,
        keywordFlag=keyword_flag,
    )
