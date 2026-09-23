# AI Mental Health Support System (MindCare)

An evidence-based mental health support system combining statistical NLP emotion and risk detection (from academic research) with real-time generative dialogue (Gemini) and deterministic crisis safety protocols.

---

## 🏛️ System Architecture

MindCare uses a **two-service modular architecture** as specified in the university thesis (`research.pdf`):

1. **Frontend & Application Server (`app/`, `components/`, `lib/`)**:
   - Built with **Next.js 16 (App Router)** and **React 19**.
   - Features supportive chat with live affective feedback, Gemini-powered voice interactions (STT/TTS), and 6 interactive relaxation tools.
   - Includes conversational intent classification (`lib/dialogue/intent.ts`) so the assistant engages warmly and naturally in casual greetings before transitioning into counseling techniques when personal disclosures occur.

2. **Machine Learning Microservice (`ml-service/`)**:
   - Built with **FastAPI** running on port `8000`.
   - Serves the research-grade **6-class emotion classifier** (`LinearSVC`) and **7-class mental health risk classifier** (`LogisticRegression`).
   - Implements out-of-vocabulary (OOV) and character entropy quality filters to reject meaningless/gibberish input (returning `Uncertain` rather than a false diagnosis).
   - Evaluates multi-stage deterministic crisis safety rules distinguishing between **inward self-harm** (suicide hotline referral) and **outward violence** (de-escalation & public safety intervention).
   - Enforces **Affective Polarity Suppression** to guarantee positive emotions (`Hopeful`, `Calm`) are strictly prevented from surfacing on violent or crisis disclosures.

3. **Research & Training Pipelines (`research/`)**:
   - Reproducible data splits (`research/datasets/processed/`).
   - Clean, reproducible training and evaluation scripts (`research/training/`).
   - Full evaluation metrics, confusion matrices, and model reports (`research/evaluation/`).

---

## ⚠️ Important Note: Dual-Service Operation

> **Does `npm run dev` start the ML service automatically?**
>
> **No.** `npm run dev` starts only the Next.js application server on port `3000`. The Python ML inference microservice runs as an independent backend on port `8000`.
> - **When the ML service is running on port 8000**: Next.js automatically connects to it and uses your trained `LinearSVC` and `LogisticRegression` models for every analysis.
> - **When the ML service is NOT running**: Next.js automatically and gracefully falls back to the internal rule-based analyzer (`lib/mock-emotion-analyzer.ts`) as defined by Non-Functional Requirement 2 (NFR2) in the thesis, preventing request failures.

---

## 📋 Prerequisites

Before setting up MindCare, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.9 or higher ([Download Python](https://www.python.org/))
- **MongoDB**: Local community server running on port `27017` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/apikey).

---

## ⚙️ Initial Environment Configuration

In the repository root directory, copy the example environment file:

### On macOS / Linux:
```bash
cp .env.example .env.local
```

### On Windows (Command Prompt):
```cmd
copy .env.example .env.local
```

### On Windows (PowerShell):
```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` in your editor and configure:
```env
MONGODB_URI=mongodb://localhost:27017/mindcare
JWT_SECRET=your-random-jwt-secret-string
GEMINI_API_KEY=your-gemini-api-key
ML_SERVICE_URL=http://127.0.0.1:8000
```

---

## 🚀 End-to-End Installation & First-Time Setup

You will need **two terminal windows**: one for the Python ML service and one for the Next.js frontend.

### Terminal 1: Python ML Microservice (Port 8000)

#### 🍏 macOS / Linux:
```bash
# 1. Navigate to the ML service folder
cd ml-service

# 2. Create Python virtual environment
python3 -m venv .venv

# 3. Activate the virtual environment
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start the ML service
uvicorn main:app --reload --port 8000
```

#### 🪟 Windows (Command Prompt `cmd.exe`):
```cmd
:: 1. Navigate to the ML service folder
cd ml-service

:: 2. Create Python virtual environment
python -m venv .venv

:: 3. Activate the virtual environment
.venv\Scripts\activate.bat

:: 4. Install dependencies
pip install -r requirements.txt

:: 5. Start the ML service
uvicorn main:app --reload --port 8000
```

#### 🪟 Windows (PowerShell):
```powershell
# 1. Navigate to the ML service folder
cd ml-service

# 2. Create Python virtual environment
python -m venv .venv

# 3. Enable script execution for this session and activate
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start the ML service
uvicorn main:app --reload --port 8000
```

> ✅ **Verify ML Service Health:** Open `http://127.0.0.1:8000/health` in your browser. You should see:
> `{"status":"ok","modelsLoaded":true}`

---

### Terminal 2: Next.js Frontend Application (Port 3000)

Open a **second terminal window** in the repository root directory:

#### 🍏 macOS / Linux:
```bash
# 1. Install frontend dependencies
npm install

# 2. Start the development server
npm run dev
```

#### 🪟 Windows (Command Prompt or PowerShell):
```cmd
:: 1. Install frontend dependencies
npm install

:: 2. Start the development server
npm run dev
```

> ✅ **Access Application:** Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔄 Daily Start & Stop Workflow

Once initial setup is completed, everyday running is simple:

### Starting Daily

| Service | macOS / Linux | Windows (PowerShell) |
|---|---|---|
| **Terminal 1 (ML Backend)** | `cd ml-service && source .venv/bin/activate && uvicorn main:app --reload --port 8000` | `cd ml-service; .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000` |
| **Terminal 2 (Frontend)** | `npm run dev` | `npm run dev` |

---

### Stopping the Servers

In both terminal windows, press:
```text
Ctrl + C
```

---

### Troubleshooting: Freeing Busy / Hung Ports

If a process was not cleanly closed and port `8000` or `3000` is already in use:

#### On macOS / Linux:
```bash
# Kill whatever is running on port 8000 (ML service)
kill -9 $(lsof -t -i:8000)

# Kill whatever is running on port 3000 (Next.js)
kill -9 $(lsof -t -i:3000)
```

#### On Windows (PowerShell as Administrator or User):
```powershell
# Stop process holding port 8000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force

# Stop process holding port 3000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

#### On Windows (Command Prompt):
```cmd
:: Find the PID running on port 8000
netstat -ano | findstr :8000
:: Kill the process by its PID (replace <PID>)
taskkill /PID <PID> /F
```

---

## 📁 Repository Structure

```text
ai-mentalhealth-system/
├── app/                      # Next.js 16 App Router (pages & API endpoints)
│   ├── api/
│   │   ├── analyze/          # Dispatches to ML microservice:8000/analyze
│   │   ├── therapy/          # Therapy sessions, messages, and Gemini replies
│   │   └── voice/            # Gemini STT (transcribe) and TTS (synthesize)
│   └── therapy/[sessionId]/  # Active therapy chat interface with Live Analysis Panel
│
├── components/               # React 19 UI components (chat, voice orb, therapy tools)
├── lib/
│   ├── dialogue/intent.ts    # Conversational intent router (greetings, pleasantries, disclosures)
│   ├── llm/gemini.ts         # Generative AI counseling dialogue & allowed techniques
│   ├── mock-emotion-analyzer.ts # Fallback emotion and crisis scoring
│   ├── mock-therapist-responses.ts # Context-aware fallback therapist generator
│   └── models/               # MongoDB / Mongoose schemas
│
├── ml-service/               # Production FastAPI ML microservice
│   ├── app/
│   │   ├── config.py         # Confidence thresholds, model paths, risk weights
│   │   ├── crisis.py         # Multi-factor deterministic crisis severity logic
│   │   ├── inference.py      # TF-IDF + Classifier inference engine
│   │   ├── main.py           # FastAPI entry point (/analyze, /health)
│   │   ├── ood.py            # Affective centroid Out-Of-Domain detector
│   │   ├── preprocessing.py  # Text cleaning & gibberish / OOV filter
│   │   └── schemas.py        # Pydantic request and response contracts
│   ├── models/               # Pre-trained models, centroid vector, and models/README.md
│   └── tests/                # Automated pytest suite (9/9 tests passing)
│
├── research/                 # Reproducible research & thesis pipelines
│   ├── datasets/raw/         # Combined_Data.csv (51k records), Emotion_classify_Data.csv
│   ├── datasets/processed/   # Stratified 80/20 train/test splits
│   ├── notebooks/            # Dedicated training & crisis notebooks (01, 02, 03, original)
│   ├── training/             # Standalone reproducible training pipelines
│   └── evaluation/           # Model metrics, classification reports, confusion matrices
│
├── docs/                     # Academic and technical documentation
│   ├── architecture.md       # Full architecture diagram & data flows
│   ├── model-card.md         # Detailed model cards & ethical disclaimers
│   └── dataset-card.md       # Dataset lineage & class distributions
│
└── research.docx, research.pdf # University thesis documentation
```

---

## 🧪 Testing & Verification

- **ML Inference Tests (Python)**:
  ```bash
  cd ml-service
  python -m pytest tests/ -v
  ```
- **TypeScript Static Verification**:
  ```bash
  npx tsc --noEmit
  ```
- **Linter Check**:
  ```bash
  npm run lint
  ```

---

## ⚠️ Clinical & Safety Disclaimer

This system is an assistive screening aid and reflective conversational companion designed for academic research. **It does not provide clinical medical diagnosis or psychiatric treatment.** If a user expresses intent to harm themselves or others, deterministic safety rules immediately override all LLM dialogue and display emergency crisis hotline resources.
