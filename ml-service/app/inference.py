import pickle
import warnings
import numpy as np
from typing import Tuple

warnings.filterwarnings("ignore", message=".*InconsistentVersionWarning.*")
warnings.filterwarnings("ignore", module="sklearn.base")

from .config import (
    EMOTION_MODEL_PATH,
    EMOTION_VECTORIZER_PATH,
    MH_MODEL_PATH,
    MH_VECTORIZER_PATH,
    CONFIDENCE_THRESHOLD,
    AFFECTIVE_RELEVANCE_THRESHOLD,
)
from .preprocessing import clean_text, is_uninformative_text
from .crisis import check_crisis_keywords, check_violence_keywords, compute_crisis_level
from .ood import ood_detector
from .schemas import (
    AnalyzeResponse,
    EmotionOutput,
    RiskOutput,
    CrisisOutput,
)


class ModelInferenceEngine:
    def __init__(self):
        self.emotion_model = None
        self.emotion_vectorizer = None
        self.mh_model = None
        self.mh_vectorizer = None
        self._load_models()

    def _load_models(self):
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                with open(EMOTION_VECTORIZER_PATH, "rb") as f:
                    self.emotion_vectorizer = pickle.load(f)
                with open(EMOTION_MODEL_PATH, "rb") as f:
                    self.emotion_model = pickle.load(f)
                with open(MH_VECTORIZER_PATH, "rb") as f:
                    self.mh_vectorizer = pickle.load(f)
                with open(MH_MODEL_PATH, "rb") as f:
                    self.mh_model = pickle.load(f)

            # Compatibility fix for unpickled LogisticRegression in scikit-learn 1.6+
            if self.mh_model is not None and not hasattr(self.mh_model, "multi_class"):
                self.mh_model.multi_class = "auto"
        except Exception as e:
            print(f"[WARN] Error loading models: {e}")

    @staticmethod
    def _softmax(scores: np.ndarray) -> np.ndarray:
        shifted = scores - np.max(scores)
        exp = np.exp(shifted)
        return exp / exp.sum()

    def analyze(self, raw_text: str) -> AnalyzeResponse:
        cleaned = clean_text(raw_text)

        # 1. First safety check: keyword matching on raw text runs regardless of syntax
        keyword_flag = check_crisis_keywords(raw_text)
        violence_flag = check_violence_keywords(raw_text)
        any_crisis_keyword = keyword_flag or violence_flag

        # 2. Input Quality & Out-Of-Vocabulary Guardrail
        # If input is obvious gibberish or empty, do not fabricate a confident prediction
        if is_uninformative_text(raw_text):
            crisis_level = "high" if any_crisis_keyword else "none"
            return AnalyzeResponse(
                analysisStatus="uncertain",
                emotion="Unknown",
                emotionConfidence=0.0,
                mentalHealthStatus="Unknown",
                crisisFlag=any_crisis_keyword,
                keywordFlag=any_crisis_keyword,
                emotionDetails=EmotionOutput(label="Unknown", confidence=0.0),
                riskDetails=RiskOutput(label="Unknown", confidence=0.0),
                crisisDetails=CrisisOutput(
                    level=crisis_level,
                    keywordDetected=any_crisis_keyword,
                    mlRiskFlag=False,
                ),
            )

        # 3. Transform with TF-IDF Vectorizers
        emo_vec = self.emotion_vectorizer.transform([cleaned])
        mh_vec = self.mh_vectorizer.transform([cleaned])

        # If zero vocabulary terms matched, the text is completely Out-Of-Vocabulary (OOV)
        if emo_vec.nnz == 0 and mh_vec.nnz == 0:
            crisis_level = "high" if keyword_flag else "none"
            return AnalyzeResponse(
                analysisStatus="uncertain",
                emotion="Unknown",
                emotionConfidence=0.0,
                mentalHealthStatus="Unknown",
                crisisFlag=keyword_flag,
                keywordFlag=keyword_flag,
                emotionDetails=EmotionOutput(label="Unknown", confidence=0.0),
                riskDetails=RiskOutput(label="Unknown", confidence=0.0),
                crisisDetails=CrisisOutput(
                    level=crisis_level,
                    keywordDetected=keyword_flag,
                    mlRiskFlag=False,
                ),
            )

        # 4. Statistical Affective Subspace Out-Of-Domain (OOD) Gate
        # Compute cosine similarity of input TF-IDF vector to the 53,000-sentence affective corpus centroid
        relevance = ood_detector.compute_relevance(emo_vec)

        if emo_vec.nnz > 0:
            decision_scores = self.emotion_model.decision_function(emo_vec)[0]
            emo_probs = self._softmax(decision_scores)
            emotion_confidence = float(np.max(emo_probs) * 100)
            raw_emotion_pred = str(self.emotion_model.predict(emo_vec)[0])
        else:
            decision_scores = np.array([])
            emo_probs = np.array([])
            emotion_confidence = 0.0
            raw_emotion_pred = "Unknown"

        # An input is out-of-domain / non-affective if its semantic relevance to the
        # affective training distribution is below the threshold (e.g. isolated nouns, arbitrary objects),
        # UNLESS the model has high confidence in a non-neutral emotion (e.g. "sad", "anxious"),
        # an affective disclosure term is present, or a crisis keyword was matched.
        has_strong_affective_signal = (
            keyword_flag
            or (raw_emotion_pred not in {"Neutral", "Unknown"} and emotion_confidence >= 45.0)
            or any(w in cleaned.split() for w in {
                "sad", "depressed", "anxious", "angry", "suicide", "suicidal",
                "crying", "down", "lonely", "hopeless", "furious", "panic", "worried",
                "well", "good", "happy", "calm", "hopeful", "fine", "better", "great",
                "relieved", "peaceful", "glad", "joy", "excited", "relaxed", "content",
                "okay", "alright"
            })
        )
        is_ood = (relevance < AFFECTIVE_RELEVANCE_THRESHOLD) and not has_strong_affective_signal

        if is_ood:
            emotion_pred = "Unknown"
            emotion_confidence = 0.0
            analysis_status = "uncertain"
        else:
            if emotion_confidence < CONFIDENCE_THRESHOLD:
                emotion_pred = "Unknown"
                emotion_confidence = 0.0
                analysis_status = "uncertain"
            else:
                emotion_pred = raw_emotion_pred
                analysis_status = "ok"

        # 5. Predict Mental Health Status
        if mh_vec.nnz > 0 and not is_ood:
            mh_pred = str(self.mh_model.predict(mh_vec)[0])
            if hasattr(self.mh_model, "predict_proba"):
                mh_probs = self.mh_model.predict_proba(mh_vec)[0]
                mh_confidence = float(np.max(mh_probs) * 100)
            else:
                mh_confidence = 75.0
        else:
            mh_pred = "Unknown"
            mh_confidence = 0.0

        # 6. Crisis Determination
        crisis_level = compute_crisis_level(
            keyword_flag=any_crisis_keyword,
            mental_health_status=mh_pred,
            emotion=emotion_pred,
            emotion_confidence=emotion_confidence,
        )
        if violence_flag and crisis_level == "none":
            crisis_level = "high"
        crisis_flag = bool(crisis_level in {"medium", "high"})

        # Safety & Affective Polarity Constraint:
        # A crisis (whether self-harm or violence/harm to others) is strictly incompatible
        # with positive affects ("Hopeful", "Calm"). Under bag-of-words modeling, words like
        # "want" in "I want to kill..." artifactually pull toward "Hopeful".
        if crisis_flag or any_crisis_keyword or mh_pred == "Suicidal":
            if violence_flag:
                # Interpersonal violent threats are acute outward aggression / anger
                emotion_pred = "Angry"
                emotion_confidence = max(emotion_confidence, 85.0)
                analysis_status = "ok"
                crisis_level = "high"
                crisis_flag = True
            elif emotion_pred in {"Hopeful", "Calm", "Unknown", "Neutral"}:
                # Depressive distress / self-harm
                emotion_pred = "Sad"
                emotion_confidence = max(emotion_confidence, mh_confidence if mh_confidence > 0 else 90.0)
                analysis_status = "ok"

        return AnalyzeResponse(
            analysisStatus=analysis_status,
            emotion=emotion_pred,
            emotionConfidence=round(emotion_confidence, 1),
            mentalHealthStatus=mh_pred,
            crisisFlag=crisis_flag,
            keywordFlag=any_crisis_keyword,
            emotionDetails=EmotionOutput(label=emotion_pred, confidence=round(emotion_confidence, 1)),
            riskDetails=RiskOutput(label=mh_pred, confidence=round(mh_confidence, 1)),
            crisisDetails=CrisisOutput(
                level=crisis_level,
                keywordDetected=any_crisis_keyword,
                mlRiskFlag=bool(mh_pred == "Suicidal"),
            ),
        )


engine = ModelInferenceEngine()
