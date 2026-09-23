# MindCare System Architecture

MindCare is an AI-powered mental health support platform integrating lightweight machine learning classification models with the Google Gemini generative API and safety-first deterministic guardrails.

---

## 1. High-Level Architectural Flow

```text
                                 [ User ]
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
        [ Text Chat Input ]                      [ Audio Voice Input ]
               │                                         │
               │                                         ▼
               │                              Gemini STT Transcription
               │                              (gemini-3.5-flash-lite)
               │                                         │
               └────────────────────┬────────────────────┘
                                    ▼
                          [ Input Quality Layer ]
                      (Length, Gibberish, OOV check)
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
            [ Uninformative / Gibberish ]       [ Valid Text ]
                  │                                   │
                  ▼                                   ▼
          Returns "Uncertain"                [ ML Analysis Service ]
          Prompts for clarification          (FastAPI Microservice / Local Fallback)
                                              ├── Emotion (6 Classes - LinearSVC)
                                              ├── Mental Health Risk (7 Classes - LogisticRegression)
                                              ├── Affective Centroid OOD Detection
                                              └── Hybrid Crisis Engine
                                                  ├── Self-Harm Detection
                                                  ├── Violence / Harm-to-Others Detection
                                                  └── Affective Polarity Suppression
                                                      │
                                                      ▼
                                            [ Crisis Safety Router ]
                                                      │
                            ┌─────────────────────────┴─────────────────────────┐
                            ▼                                                   ▼
                [ High / Medium Crisis ]                                [ Low / None Risk ]
                            │                                                   │
                            ▼                                                   ▼
             *BYPASS GEMINI COMPLETELY*                               [ Gemini LLM ]
             ├── Harm-to-Self:                                        (gemini-3.5-flash-lite)
             │   Return Immediate Support                             - Injected Emotion Context
             │   + 988 Crisis Lifeline Banner                         - Evidence-Based Techniques
             └── Harm-to-Others:                                      - Structured JSON Output
                 Return Firm De-escalation                            - Graceful Fallback if Timeout
                 & Grounding Intervention                                       │
                                                                                ▼
                                                                      [ Text Response ]
                                                                      + Optional Gemini TTS
                                                                      (Voice "Kore")
```

---

## 2. Safety, Calibration & Guardrail Architecture

### A. Dual-Branch Crisis Safety Net
Rather than relying on non-deterministic generative models during critical distress, MindCare enforces a hard boundary:
* **Harm-to-Self Branch**: Detects suicidal ideation, hopelessness, or self-injury keywords and ML risk flags. Immediately bypasses generative LLMs and serves a supportive intervention alongside the **988 Suicide & Crisis Lifeline** emergency banner.
* **Harm-to-Others Branch**: Detects expressions of physical violence, threats, or intent to injure others. Serves a calm, firm, boundary-setting de-escalation response that avoids escalating agitation.

### B. Affective Polarity Suppression
Prevents contradictory sentiment assignments. If an input contains violent or self-destructive intent, the classifier suppresses contradictory positive emotion labels (e.g., classifying a threat as `"Hopeful"` or `"Happy"`).

### C. Calibrated Confidence & OOD Centroid Gate
* **Input Preprocessing**: Strips URLs, normalizes whitespace, and rejects repeated character strings (`"ssssss"`).
* **Statistical OOD Gate**: Calculates cosine similarity against a normalized centroid of genuine affective expressions (53,000+ samples) to reject isolated objects (`"laptop"`, `"table"`).
* **Calibrated Softmax**: Temperature-scaled probabilities over 6 emotion classes ensure low-confidence noise (< 25.0%) returns `"Unknown"` / `"uncertain"`.

---

## 3. Component Responsibilities

### A. Next.js 16 Web Application (`app/`, `components/`, `lib/`)
* **Role**: Modern React 19 interface, JWT authentication, MongoDB session history, real-time emotion telemetry, interactive relaxation tools (Box Breathing, Zen Garden, Ocean Waves).
* **Safety Protocol**: Implements the deterministic crisis override in `app/api/therapy/[sessionId]/reply/route.ts`. If `crisisLevel` is `medium` or `high`, Gemini is strictly bypassed.
* **Resilience Fallbacks**:
  * **ML Fallback (`lib/mock-emotion-analyzer.ts`)**: If the external FastAPI service is unreachable, an in-process analyzer provides uninterrupted keyword and rule-based safety screening.
  * **LLM Fallback (`lib/mock-therapist-responses.ts`)**: If Gemini API times out (>8s) or is unconfigured, rule-based evidence-grounded therapeutic replies are served without breaking user experience.

### B. Machine Learning Service (`ml-service/`)
* **Role**: Standalone Python FastAPI microservice (port 8000).
* **Models**:
  * Emotion Classification: `LinearSVC` with calibrated softmax output.
  * Mental Health Risk: `LogisticRegression` with balanced class weights across 7 categories (`Normal`, `Depression`, `Suicidal`, `Anxiety`, `Bipolar`, `Stress`, `Personality disorder`).
* **Endpoints**:
  * `GET /health`: Liveness probe and model memory verification.
  * `POST /analyze`: Comprehensive inference endpoint returning status, emotion details, risk details, and multi-tier crisis assessment.

### C. Research & Training Pipelines (`research/`)
* **Role**: Reproducible training scripts, dataset preparation, and evaluation artifacts:
  * `research/training/train_emotion.py`: Trains emotion vectorizer and linear classifier.
  * `research/training/train_mental_health.py`: Trains mental health risk pipeline.
  * `research/datasets/raw/Combined_Data.csv`: 51,000+ benchmark mental-health records.

---

## 4. Voice Modality (Gemini Voice)

* **Speech-to-Text (STT)**: Powered by `gemini-3.5-flash-lite` via `lib/llm/gemini-voice.ts` for natural speech transcription.
* **Text-to-Speech (TTS)**: Powered by `gemini-3.1-flash-tts-preview` (with fallback to `gemini-2.5-flash-preview-tts`), synthesizing therapeutic audio using the calm vocal profile `"Kore"`.

---

## 5. Disclaimers & Ethics
MindCare is an assistive technological research system. It does **not** diagnose medical or mental health disorders. All classifications represent statistical language pattern indications rather than clinical assessments.
