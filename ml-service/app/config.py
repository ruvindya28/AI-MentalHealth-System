import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

# Active model paths
EMOTION_MODEL_PATH = MODELS_DIR / "emotion_model.pkl"
EMOTION_VECTORIZER_PATH = MODELS_DIR / "emotion_vectorizer.pkl"
MH_MODEL_PATH = MODELS_DIR / "mh_model.pkl"
MH_VECTORIZER_PATH = MODELS_DIR / "mh_vectorizer.pkl"
CRISIS_KEYWORDS_PATH = MODELS_DIR / "crisis_keywords.json"
AFFECTIVE_CENTROID_PATH = MODELS_DIR / "affective_centroid.npy"

# Quality & OOD thresholds
MIN_TEXT_LENGTH = 2
MIN_WORD_COUNT = 1
CONFIDENCE_THRESHOLD = 25.0  # Minimum confidence to accept a classification (6 classes: random is 16.7%)
AFFECTIVE_RELEVANCE_THRESHOLD = 0.020  # Cosine similarity to the 53k affective corpus centroid


