# MindCare ML Service

Serves the trained emotion and mental-health-status classifiers over HTTP.
The Next.js app calls this server-to-server (see `app/api/analyze/route.ts`)
instead of loading the `.pkl` files directly — Node.js can't load Python
pickles.

## Setup

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

The Next.js app expects this at `ML_SERVICE_URL` (see `.env.example`),
which defaults to `http://127.0.0.1:8000`.

## API

`POST /analyze`

```json
// Request
{ "text": "i had a rough day today" }

// Response
{
  "emotion": "Sad",
  "emotionConfidence": 62.4,
  "mentalHealthStatus": "Normal",
  "crisisFlag": false,
  "keywordFlag": false
}
```

`emotion` is one of `Sad, Anxious, Angry, Hopeful, Calm, Neutral` (matches
the app's `Emotion` type directly — no mapping needed on the Next.js side).

`mentalHealthStatus` is one of `Anxiety, Bipolar, Depression, Normal,
Personality disorder, Stress, Suicidal` — mapped to the app's
`none/low/medium/high` `CrisisLevel` in `app/api/analyze/route.ts`, not here.

`crisisFlag` is `true` if the ML model predicts "Suicidal" OR the text
matches a phrase in `models/crisis_keywords.json` — a keyword safety net
layered on top of the ML prediction, since the ML model alone only catches
~74% of "Suicidal" cases on its own.

`GET /health` — basic liveness check.

## Models

`models/*.pkl` are scikit-learn 1.8.0 pipelines (TF-IDF + LinearSVC for
emotion, TF-IDF + LogisticRegression for mental-health status). Retrain the
emotion model with `retrain_emotion_model.py` (kept alongside the original
training data, not in this repo) if the label mix needs adjusting.
