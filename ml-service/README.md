# MindCare ML Service

High-performance inference microservice for emotion classification, mental-health risk screening, and deterministic crisis detection.

The Next.js application communicates with this service via server-to-server HTTP (`POST /analyze`) using `ML_SERVICE_URL` (default: `http://127.0.0.1:8000`).

---

## Architecture Overview

```text
POST /analyze
    │
    ▼
clean_text()
    │
    ▼
is_uninformative_text() ──(Gibberish / OOV / Empty)──► Return 'uncertain' / 'Unknown'
    │
    ▼ (Valid Text)
TfidfVectorizer (Emotion & Mental Health)
    │
    ├──► LinearSVC ──────────────► Calibrated Softmax ──► Emotion Classification
    ├──► LogisticRegression ─────► Predict Proba ───────► Mental Health Risk Screening
    └──► Crisis Safety Net ──────► Deterministic Rules ──► Multi-Tier Severity Flagging
                                  ├── Self-Harm vs Harm-to-Others
                                  └── Affective Polarity Suppression
```

### Safety & Calibration Pipeline
- **Input Guardrails**: Short, low-entropy, or repetitive character strings (e.g., `"ssssss"`, `"asdf"`) bypass model hallucinations and return status `uncertain`.
- **Emotion Confidence Calibration**: Converts raw `LinearSVC` decision boundary margins into calibrated probability distributions via temperature-scaled softmax.
- **Affective Polarity Suppression**: Prevents contradictory predictions (e.g., classifying violent or self-destructive intent as `"Hopeful"` or `"Happy"`).
- **Crisis Severity Tiers**: Categorizes crisis signals into `high`, `medium`, `low`, or `none`, explicitly distinguishing between suicidal ideation and violence towards others.

---

## Installation & Running

### Prerequisites
- Python 3.10, 3.11, or 3.12 installed.

---

### macOS & Linux

#### 1. Create Virtual Environment & Install Dependencies
```bash
# Navigate to the ml-service folder
cd ml-service

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies and test runner
pip install -r requirements.txt pytest
```

#### 2. Start the Service
```bash
# Start FastAPI with auto-reload on port 8000
uvicorn main:app --reload --port 8000
```

#### 3. Run Automated Tests
```bash
python -m pytest tests/ -v
```

---

### Windows

#### 1. Create Virtual Environment & Install Dependencies

**Command Prompt (`cmd.exe`):**
```cmd
cd ml-service
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt pytest
```

**PowerShell:**
```powershell
cd ml-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt pytest
```
> *Note: If PowerShell shows an execution policy error, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first.*

#### 2. Start the Service
```cmd
uvicorn main:app --reload --port 8000
```

#### 3. Run Automated Tests
```cmd
python -m pytest tests/ -v
```

---

## API Specification

### `GET /health`
Liveness check verifying that the service is running and machine learning models are loaded into memory.

**Response:**
```json
{
  "status": "ok",
  "modelsLoaded": true
}
```

---

### `POST /analyze`
Primary inference endpoint analyzing user input text.

#### 1. Valid Input Example
**Request:**
```json
{
  "text": "I feel overwhelmed with work and exhausted today."
}
```

**Response (`200 OK`):**
```json
{
  "analysisStatus": "ok",
  "emotion": "Sad",
  "emotionConfidence": 68.4,
  "mentalHealthStatus": "Normal",
  "crisisFlag": false,
  "keywordFlag": false,
  "emotionDetails": {
    "label": "Sad",
    "confidence": 68.4
  },
  "riskDetails": {
    "label": "Normal",
    "confidence": 84.2
  },
  "crisisDetails": {
    "level": "none",
    "keywordDetected": false,
    "mlRiskFlag": false
  }
}
```

#### 2. Crisis / Harm Detected Example
**Request:**
```json
{
  "text": "I feel hopeless and I want to end my life"
}
```

**Response (`200 OK`):**
```json
{
  "analysisStatus": "ok",
  "emotion": "Sad",
  "emotionConfidence": 82.1,
  "mentalHealthStatus": "Suicide",
  "crisisFlag": true,
  "keywordFlag": true,
  "emotionDetails": {
    "label": "Sad",
    "confidence": 82.1
  },
  "riskDetails": {
    "label": "Suicide",
    "confidence": 91.5
  },
  "crisisDetails": {
    "level": "high",
    "keywordDetected": true,
    "mlRiskFlag": true
  }
}
```

#### 3. Uninformative / Gibberish Input Example
**Request:**
```json
{
  "text": "zzzzzzz"
}
```

**Response (`200 OK`):**
```json
{
  "analysisStatus": "uncertain",
  "emotion": "Unknown",
  "emotionConfidence": 0.0,
  "mentalHealthStatus": "Unknown",
  "crisisFlag": false,
  "keywordFlag": false,
  "emotionDetails": null,
  "riskDetails": null,
  "crisisDetails": {
    "level": "none",
    "keywordDetected": false,
    "mlRiskFlag": false
  }
}
```

---

## Project Structure

```text
ml-service/
├── app/
│   ├── config.py         # Confidence thresholds, model paths, risk weights
│   ├── crisis.py         # Multi-tier crisis keywords & deterministic rules
│   ├── inference.py      # Core inference engine (vectorization & prediction)
│   ├── main.py           # FastAPI application definition and routing
│   ├── ood.py            # Affective centroid Out-Of-Domain detector
│   ├── preprocessing.py  # Text cleaning, entropy check, and gibberish guard
│   └── schemas.py        # Pydantic request and response contracts
├── models/               # Pre-trained vectorizers, models, and safety assets
│   ├── README.md         # Detailed training lineage & artifact guide
│   ├── emotion_model.pkl
│   ├── emotion_vectorizer.pkl
│   ├── mh_model.pkl
│   ├── mh_vectorizer.pkl
│   ├── affective_centroid.npy
│   └── crisis_keywords.json
├── tests/                # Automated pytest suite
│   └── test_analyze.py
├── main.py               # Root uvicorn entrypoint (delegates to app.main)
├── requirements.txt      # Python package dependencies
└── README.md             # Microservice documentation
```
