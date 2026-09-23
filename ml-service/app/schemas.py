from typing import Optional
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="User message text to analyze")


class EmotionOutput(BaseModel):
    label: str
    confidence: float


class RiskOutput(BaseModel):
    label: str
    confidence: float


class CrisisOutput(BaseModel):
    level: str  # "none", "low", "medium", "high"
    keywordDetected: bool
    mlRiskFlag: bool


class AnalyzeResponse(BaseModel):
    # Backward-compatible fields
    emotion: str
    emotionConfidence: float
    mentalHealthStatus: str
    crisisFlag: bool
    keywordFlag: bool
    # Extended research schema
    analysisStatus: str = "ok"  # "ok" or "uncertain"
    emotionDetails: Optional[EmotionOutput] = None
    riskDetails: Optional[RiskOutput] = None
    crisisDetails: Optional[CrisisOutput] = None
