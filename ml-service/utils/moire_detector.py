"""
Moiré Pattern Detector
SRS FR-4B.4 Gate 3b

Detects screen-capture fraud — riders photographing a screen instead of
taking a live camera photo. Screen photos exhibit distinctive moiré patterns
caused by the interference between the camera sensor grid and screen pixel grid.

Method:
  1. Convert image to grayscale
  2. Apply FFT (Fast Fourier Transform)
  3. Shift zero-frequency component to center
  4. Compute power spectrum in log scale
  5. Analyze high-frequency energy distribution
  6. Screen photos show characteristic periodic spikes in FFT output

Threshold: moire_confidence >= 0.40 → REJECTED
"""

import io
import base64
import numpy as np
import cv2
from PIL import Image


def decode_image_cv2(image_b64: str) -> np.ndarray:
    """Decode base64 image to OpenCV BGR array."""
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]
    img_bytes = base64.b64decode(image_b64)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def detect_moire(image_b64: str) -> dict:
    """
    Detect moiré patterns via FFT frequency analysis.

    Returns:
        {
            "moire_detected": bool,
            "moire_confidence": float,  # 0.0–1.0
            "method": str,
            "details": dict
        }
    """
    try:
        img = decode_image_cv2(image_b64)

        if img is None:
            return {"moire_detected": False, "moire_confidence": 0.0,
                    "method": "fft_analysis", "details": {"error": "could not decode image"}}

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Resize to fixed size for consistent FFT analysis
        gray_resized = cv2.resize(gray, (512, 512))

        # Apply FFT
        fft = np.fft.fft2(gray_resized.astype(np.float32))
        fft_shift = np.fft.fftshift(fft)

        # Compute log power spectrum
        magnitude = np.abs(fft_shift)
        log_magnitude = np.log1p(magnitude)

        h, w = log_magnitude.shape
        cy, cx = h // 2, w // 2

        # Mask the DC component (center 5% radius)
        mask = np.ones((h, w), np.float32)
        radius_dc = int(min(h, w) * 0.05)
        cv2.circle(mask, (cx, cy), radius_dc, 0, -1)
        log_magnitude_masked = log_magnitude * mask

        # Compute energy in mid-frequency ring (typical moiré artifact zone)
        # Inner radius: 10% of image, outer radius: 40%
        r_inner = int(min(h, w) * 0.10)
        r_outer = int(min(h, w) * 0.40)

        mid_freq_mask = np.zeros((h, w), np.float32)
        cv2.circle(mid_freq_mask, (cx, cy), r_outer, 1, -1)
        cv2.circle(mid_freq_mask, (cx, cy), r_inner, 0, -1)

        total_energy = float(np.sum(log_magnitude_masked))
        mid_freq_energy = float(np.sum(log_magnitude_masked * mid_freq_mask))

        if total_energy < 1e-6:
            return {"moire_detected": False, "moire_confidence": 0.0,
                    "method": "fft_analysis", "details": {"error": "blank or near-blank image"}}

        # Ratio of mid-frequency energy to total — moiré images have high ratio
        energy_ratio = mid_freq_energy / total_energy

        # Detect periodic spikes (characteristic of screen grid interference)
        # Compare max spike intensity to mean in the mid-frequency band
        mid_values = log_magnitude_masked[mid_freq_mask > 0]
        if len(mid_values) > 0:
            spike_ratio = float(np.max(mid_values)) / (float(np.mean(mid_values)) + 1e-6)
        else:
            spike_ratio = 0.0

        # Combine features into confidence score
        # High energy_ratio + high spike_ratio → strong moiré signal
        moire_confidence = float(np.clip(
            (energy_ratio * 0.6) + (min(spike_ratio / 20, 1.0) * 0.4),
            0.0, 1.0
        ))

        moire_detected = moire_confidence >= 0.40

        return {
            "moire_detected": moire_detected,
            "moire_confidence": round(moire_confidence, 4),
            "method": "fft_analysis",
            "details": {
                "energy_ratio": round(energy_ratio, 4),
                "spike_ratio": round(spike_ratio, 4),
                "total_energy": round(total_energy, 2),
                "mid_freq_energy": round(mid_freq_energy, 2),
            },
        }

    except Exception as e:
        # On any error, fail open (don't block real reports due to analysis bug)
        return {
            "moire_detected": False,
            "moire_confidence": 0.0,
            "method": "fft_analysis",
            "details": {"error": str(e)},
        }
