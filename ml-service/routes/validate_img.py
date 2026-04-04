"""
Validate Image Route — POST /validate-img
SRS FR-4B.4 Gate 3: AI Vision Fraud Prevention

Runs 2-stage validation pipeline:
  Stage 1 → CLIP zero-shot classification (disruption confidence >= 0.65)
  Stage 2 → Moiré pattern detection (screen-capture fraud)

Returns a structured verdict consumed by the Express.js reports route.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from utils.clip_classifier import classify_disruption
from utils.moire_detector import detect_moire

router = APIRouter()

CLIP_CONFIDENCE_THRESHOLD = 0.65
MOIRE_CONFIDENCE_THRESHOLD = 0.40


class ImageValidationRequest(BaseModel):
    image_b64: str
    rider_id: str
    zone_id: str
    timestamp: Optional[str] = None


class ImageValidationResponse(BaseModel):
    verdict: str                    # "APPROVED" | "REJECTED"
    rejection_reason: Optional[str] # None if approved
    clip_classification: str
    clip_confidence: float
    moire_detected: bool
    moire_confidence: float
    details: dict


@router.post("/validate-img", response_model=ImageValidationResponse)
async def validate_image(request: ImageValidationRequest):
    """
    Full 2-stage image validation pipeline.
    Returns structured verdict for the Express.js backend to process.
    """
    if not request.image_b64 or len(request.image_b64) < 100:
        raise HTTPException(status_code=400, detail="image_b64 is missing or too short")

    # ── Stage 1: Moiré Detection (fast — runs first to save CLIP compute) ──
    moire_result = detect_moire(request.image_b64)

    if moire_result["moire_detected"]:
        # Run CLIP anyway for logging, but result is already REJECTED
        clip_result = classify_disruption(request.image_b64)
        return ImageValidationResponse(
            verdict="REJECTED",
            rejection_reason="MOIRE_DETECTED",
            clip_classification=clip_result["classification"],
            clip_confidence=clip_result["confidence"],
            moire_detected=True,
            moire_confidence=moire_result["moire_confidence"],
            details={
                "message": "Screen-capture artifact detected. Must use live camera.",
                "moire_details": moire_result["details"],
            },
        )

    # ── Stage 2: CLIP Classification ──────────────────────────────────────
    clip_result = classify_disruption(request.image_b64)

    if clip_result["confidence"] < CLIP_CONFIDENCE_THRESHOLD:
        return ImageValidationResponse(
            verdict="REJECTED",
            rejection_reason="LOW_CLIP_SCORE",
            clip_classification=clip_result["classification"],
            clip_confidence=clip_result["confidence"],
            moire_detected=False,
            moire_confidence=moire_result["moire_confidence"],
            details={
                "message": f"Image does not depict urban disruption (confidence={clip_result['confidence']:.2f} < {CLIP_CONFIDENCE_THRESHOLD})",
                "top_label": clip_result["top_label"],
            },
        )

    # ── APPROVED ──────────────────────────────────────────────────────────
    return ImageValidationResponse(
        verdict="APPROVED",
        rejection_reason=None,
        clip_classification=clip_result["classification"],
        clip_confidence=clip_result["confidence"],
        moire_detected=False,
        moire_confidence=moire_result["moire_confidence"],
        details={
            "top_label": clip_result["top_label"],
            "clip_scores_summary": {
                k: v for k, v in list(clip_result["all_scores"].items())[:5]
            },
        },
    )
