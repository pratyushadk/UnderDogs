"""
WorkSafe ML Microservice — FastAPI
Port: 8000
Validates rider-submitted disruption images through a 2-stage AI pipeline.

Stage 1 — CLIP Zero-Shot Classification (Gate 3a, SRS FR-4B.4):
  Checks if the image depicts genuine urban disruption (flooding, accident, road closure).
  Threshold: confidence >= 0.65 → APPROVED

Stage 2 — Moiré Pattern Detection (Gate 3b, SRS FR-4B.4):
  Detects photos-of-screens (screen-recapture fraud).
  If moiré artifacts detected → REJECTED regardless of CLIP score.
"""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

from routes.validate_img import router as validate_img_router
from utils.clip_classifier import load_clip_model

# ── Model singleton — loaded once at startup ─────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load CLIP model at startup, release at shutdown."""
    print("🔄 Loading CLIP model (openai/clip-vit-base-patch32)...")
    load_clip_model()
    print("✅ CLIP model ready.")
    yield
    print("🛑 ML service shutting down.")

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="WorkSafe ML Microservice",
    description="AI image validation for crowdsourced disruption reports",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(validate_img_router)


@app.get("/health")
async def health():
    return {
        "service": "WorkSafe ML Microservice",
        "status": "running",
        "model": "openai/clip-vit-base-patch32",
        "endpoints": ["/validate-img", "/health"],
    }
