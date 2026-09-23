"""MindCare ML Service entry point.

Delegates to app.main for structured, modular inference with input quality
guardrails, confidence calibration, and crisis safety logic.
"""
from app.main import app
from app.schemas import AnalyzeRequest, AnalyzeResponse

__all__ = ["app", "AnalyzeRequest", "AnalyzeResponse"]

