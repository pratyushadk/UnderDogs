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

load_dotenv()  # reads from env vars on Render, or local .env during dev

from routes.validate_img import router as validate_img_router
from utils.clip_classifier import load_clip_model

# ── Model singleton — loaded once at startup ─────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load CLIP model at startup, release at shutdown."""
    print("[INFO] Loading CLIP model (openai/clip-vit-base-patch32)...")
    load_clip_model()
    print("[INFO] CLIP model ready.")
    yield
    print("[INFO] ML service shutting down.")

# ── App ──────────────────────────────────────────────────────
app = FastAPI(
    title="WorkSafe ML Microservice",
    description="AI image validation for crowdsourced disruption reports",
    version="1.0.0",
    lifespan=lifespan,
)

# Pull allowed origins from env so production URLs don't need code changes
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
_extra = [o.strip() for o in _raw_origins.split(",") if o.strip()]
ALLOWED_ORIGINS = [
    "http://localhost:4000",
    "http://localhost:3000",
    *_extra,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
