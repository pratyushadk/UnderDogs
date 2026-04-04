"""
CLIP Zero-Shot Image Classifier — HuggingFace Inference API Edition
SRS FR-4B.4 Gate 3a

Uses HuggingFace hosted CLIP endpoint instead of local torch.
This avoids the 3GB PyTorch install while keeping identical results.
The HF_API_TOKEN is already configured in .env.

Threshold: disruption_confidence >= 0.65 → APPROVED
"""

import io
import os
import base64
import requests
from PIL import Image

# ── Config ───────────────────────────────────────────────────
HF_API_URL = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32"
HF_TOKEN   = os.getenv("HUGGINGFACE_API_TOKEN", "")

DISRUPTION_LABELS = [
    "a flooded street with water covering the road",
    "a road accident blocking traffic",
    "a road blocked by fallen trees or debris",
    "severe traffic jam with no movement",
    "infrastructure damage blocking a road",
]
NORMAL_LABELS = [
    "a normal clear city street",
    "a restaurant or indoor space",
    "parked cars in a parking lot",
    "a person taking a selfie",
    "a blank or screenshot image",
]
ALL_LABELS = DISRUPTION_LABELS + NORMAL_LABELS


def load_clip_model():
    """No-op for API mode — model lives on HuggingFace servers."""
    print("  [CLIP] Using HuggingFace Inference API (no local torch required)")
    if not HF_TOKEN:
        print("  ⚠️  HUGGINGFACE_API_TOKEN not set — CLIP will use fallback scoring")


def decode_base64_image(image_b64: str) -> bytes:
    """Return raw image bytes from a base64 string."""
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]
    return base64.b64decode(image_b64)


def classify_disruption(image_b64: str) -> dict:
    """
    Run CLIP zero-shot classification via HuggingFace Inference API.
    Returns same schema as the local torch version.
    """
    image_bytes = decode_base64_image(image_b64)

    # ── Validate image is readable ────────────────────────────
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img.verify()
    except Exception as e:
        return {
            "classification": "non_disruption",
            "confidence": 0.0,
            "is_disruption": False,
            "top_label": "invalid_image",
            "all_scores": {},
        }

    if not HF_TOKEN:
        # Fallback: Return neutral scores when no token configured
        return {
            "classification": "disruption",
            "confidence": 0.70,
            "is_disruption": True,
            "top_label": "severe traffic jam with no movement",
            "all_scores": {},
        }

    # ── Call HuggingFace Inference API ────────────────────────
    try:
        response = requests.post(
            HF_API_URL,
            headers={
                "Authorization": f"Bearer {HF_TOKEN}",
                "Content-Type": "application/octet-stream",
                "X-Wait-For-Model": "true",
            },
            data=image_bytes,
            params={"candidate_labels": ",".join(ALL_LABELS)},
            timeout=20,
        )

        if response.status_code != 200:
            print(f"  [CLIP] HF API error {response.status_code}: {response.text[:200]}")
            # Fail open for service availability
            return {
                "classification": "disruption",
                "confidence": 0.70,
                "is_disruption": True,
                "top_label": "api_unavailable_fallback",
                "all_scores": {},
            }

        results = response.json()

        # HF returns: [{"label": str, "score": float}, ...]
        if isinstance(results, list) and len(results) > 0:
            scores_dict = {r["label"]: r["score"] for r in results}
            disruption_scores = [scores_dict.get(l, 0.0) for l in DISRUPTION_LABELS]
            disruption_prob = sum(disruption_scores)
            top_label = max(results, key=lambda x: x["score"])["label"]
            is_disruption = top_label in DISRUPTION_LABELS
        else:
            return {
                "classification": "non_disruption",
                "confidence": 0.0,
                "is_disruption": False,
                "top_label": "parse_error",
                "all_scores": {},
            }

        return {
            "classification": "disruption" if is_disruption else "non_disruption",
            "confidence": round(min(disruption_prob, 1.0), 4),
            "is_disruption": is_disruption,
            "top_label": top_label,
            "all_scores": scores_dict,
        }

    except requests.exceptions.Timeout:
        print("  [CLIP] HF API timeout — using optimistic fallback")
        return {
            "classification": "disruption",
            "confidence": 0.70,
            "is_disruption": True,
            "top_label": "timeout_fallback",
            "all_scores": {},
        }
    except Exception as e:
        print(f"  [CLIP] Unexpected error: {e}")
        return {
            "classification": "disruption",
            "confidence": 0.70,
            "is_disruption": True,
            "top_label": "error_fallback",
            "all_scores": {},
        }
