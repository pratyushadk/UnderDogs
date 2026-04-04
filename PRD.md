# Product Requirements Document (PRD)
## System: WorkSafe – AI-Powered Parametric Income Protection for Gig Workers
**Version:** 1.0.0 | **Date:** April 4, 2026 | **Team:** UnderDogs (DEVTrails 2026)
**Status:** Hackathon Submission Draft

---

## 1. Executive Summary & Product Vision

### 1.1 Elevator Pitch
WorkSafe is an AI-powered parametric income insurance platform embedded natively inside India's gig delivery apps (Zomato, Swiggy, Zepto). When external disruptions — floods, curfews, AQI spikes — wipe out a rider's ability to earn, WorkSafe detects the event automatically, validates it through multi-layered AI fraud gates, and pays the rider their lost income within minutes. Zero paperwork. Zero claim forms. Zero delays.

### 1.2 The Core Problem
India's gig delivery workforce (~7 million workers) bears 100% of the financial risk from events entirely outside their control. A monsoon flood, a sudden protest, or a hazardous AQI event can eliminate an entire day's income without recourse. Platforms offer no sick-leave equivalent, no compensation for externally disrupted shifts, and no week-to-week safety net aligned with how gig workers actually get paid.

**Impact (Quantified):**
- **20–30% monthly income loss** during disruption-heavy periods.
- **Zero** existing parametric insurance product aligned to the weekly gig earning cycle.
- Riders face chronic financial precarity with no automated safety mechanism.

### 1.3 The Solution
WorkSafe provides a Rolling Weekly Subscription model embedded within the rider's existing platform. A `node-cron` polling loop monitors every delivery zone in the city every 15 minutes. When the platform's Disruption Index (DI) breaches the threshold, the system automatically triggers claims and pays riders — no forms, no delays.

### 1.4 Hackathon Goal
Demonstrate a fully functioning B2B2C parametric insurance system on a live demo: onboard a rider, calculate a risk-adjusted premium, simulate a zone disruption, validate an AI-submitted photo, and settle an instant payout — end-to-end within a 5-minute demo cycle.

---

## 2. Target Personas

### 2.1 Primary Persona: The Delivery Partner

| Attribute | Detail |
|-----------|--------|
| **Name** | Ravi (representative persona) |
| **Occupation** | Full-time Zomato delivery partner, Bengaluru |
| **Earnings** | ₹600–₹900/day across 8–10 hour shifts |
| **Device** | Entry-level Android smartphone |
| **Pain Point** | During a monsoon event, earns ₹0 for 6 hours. No recourse. |
| **Goal** | Wants income security without additional apps or paperwork |
| **Tech Comfort** | Comfortable with their delivery app; minimal tolerance for new UX |

**Behavioral Insight:** Ravi will subscribe *only* if the cost is low, the value is clear, and the payout is fast. Any friction in the process causes immediate drop-off.

### 2.2 Secondary Persona: The Insurance Underwriter

| Attribute | Detail |
|-----------|--------|
| **Name** | Priya (representative persona) |
| **Role** | Actuary / Risk Manager at a parametric insurance firm |
| **Concern** | Adverse selection, fraudulent claims, unpredictable float exposure |
| **Goal** | Maintain an actuarially sound book with predictable loss ratios |
| **Dependency** | Relies on WorkSafe's AI fraud gates and mathematical models to protect underwriting margins |

**Business Insight:** Priya's firm only participates if WorkSafe can demonstrate mathematically enforced anti-gaming logic (Consistency Matrix), multi-layer fraud rejection, and a coverage ratio that prevents moral hazard.

---

## 3. User Journeys

### 3.1 Journey 1: Frictionless B2B2C Onboarding & Verification

**Trigger:** Rider opens their delivery app and sees a prominent "Income Protection" tab.

| Step | User Action | System Response |
|------|-------------|-----------------|
| 1 | Taps "Income Protection" tab | React micro-frontend loads inside the host app |
| 2 | Views pre-populated rider profile | Node.js backend queries mock Zomato partner API; fetches E_avg, shift patterns, primary zone |
| 3 | Reviews data summary + coverage disclaimer | Frontend renders: "This policy covers **Loss of Income only**. Health, vehicle, and accident coverage excluded." |
| 4 | Taps "Subscribe — ₹X this week" | Node.js writes subscription record to PostgreSQL |
| 5 | Receives confirmation notification | Premium deduction scheduled for Sunday 11:59 PM |

**Alternate Flow (API Unavailable):** Mock API returns a 503. Frontend degrades gracefully to a manual form: rider selects their primary delivery zone from an interactive **Leaflet.js map** (powered by OpenStreetMap tiles) and enters an estimated daily income. System flags the record as "manual-baseline" for actuarial weighting.

---

### 3.2 Journey 2: Weekly Premium Notification & Auto-Deduction

**Trigger:** `node-cron` fires Saturday 11:00 PM.

| Step | Actor | Action |
|------|-------|--------|
| 1 | System | Fetches 7-day forecasts from Tomorrow.io and PredictHQ for each active rider's zone |
| 2 | System | Calculates Model 1 (Predictive Pricing) and applies C_factor from Consistency Matrix ledger |
| 3 | System | Queues push notification: "Next week's premium: ₹47. Tap to opt-out by 11:59 PM Sunday." |
| 4 | Rider | No action taken (most common case) |
| 5 | System | Sunday 11:59 PM: Premium deducted from platform payout ledger. PostgreSQL subscription_streak +1. |

**Alternate Flow (Rider Opts Out):** Rider taps "Opt-out" before Sunday 11:59 PM. System records the cancellation. If the next subscription event occurs on a high-risk week (as forecasted), the `C_factor` penalty is applied and premium increases accordingly — the Consistency Matrix at work.

---

### 3.3 Journey 3: Zero-Touch Automated Payout (API-Triggered)

**Trigger:** Zone DI breaches 75 via the 15-minute polling loop.

| Step | Actor | Action |
|------|-------|--------|
| 1 | System | TomTom Traffic + OpenWeatherMap data feed into DI calculator (Model 3) |
| 2 | System | DI = 82 for Zone_Koramangala. Threshold exceeded. |
| 3 | System | PostGIS query: `ST_Contains(zone_geom, rider_location)` identifies 43 eligible riders |
| 4 | System | Model 4 executed: `Payout = E_avg × H_lost × C_ratio` for each rider |
| 5 | System | Razorpay Sandbox API called. Payout credited to each rider's platform wallet. |
| 6 | Rider | Receives push: "₹234 credited. Disruption in your zone confirmed. Stay safe." |

**Total Rider Effort Required:** Zero. No form. No photo. No call center.

---

### 3.4 Journey 4: Crowdsourced Fallback (Manual Disruption Report)

**Trigger:** Local protest not detected by any weather/traffic API. Rider reports manually.

| Step | Actor | Fraud Gate | System Response |
|------|-------|------------|-----------------|
| 1 | Rider | — | Taps "Report Disruption" in the app |
| 2 | System | **Gate 1: OS-Level** | Forces `getUserMedia()` live camera; gallery blocked |
| 3 | Rider | — | Takes live photo of blocked road/flooded street |
| 4 | System | **Gate 2: Haversine Speed Trap** | Computes velocity between last ping and current location. If > 80 km/h → rejected |
| 5 | System | **Gate 3: AI Vision (CLIP + OpenCV)** | Routes image to Python/FastAPI. CLIP classifies disruption type; OpenCV detects Moiré artifacts |
| 6 | System | **Gate 4: Logarithmic Threshold** | Checks if U_min riders in this zone have validated (Model 2). If yes → DI overridden to 100 |
| 7 | System | — | Zone enters payout state. Settlement proceeds identically to Journey 3 |

---

## 4. Core Product Features

### 4.1 Embedded B2B2C Onboarding Tab
- React.js micro-frontend embedded inside partner apps (Native WebView).
- Automated rider data prefill via partner API (or mock API fallback).
- Mandatory consent dialog: Loss of Income scope only.
- Manual zone selection fallback via **Leaflet.js + `react-leaflet`** rendered over OpenStreetMap tiles (no API key required).
- Mock API layer in place of live Zomato/Swiggy partner integrations during hackathon.

### 4.2 Dynamic Weekly Premium Engine
- Saturday `node-cron` trigger for premium batch calculation.
- Math Model 1 execution with live API forecast data.
- Consistency Matrix ledger tracking per rider (`subscription_streak`).
- Push notification system with 24-hour opt-out window.
- Sunday 11:59 PM auto-deduction committed to platform ledger.

### 4.3 Live Zone Disruption Monitor
- 15-minute `node-cron` polling across all registered PostGIS polygons.
- Concurrent async API calls (OpenWeatherMap, TomTom, NASA EONET, USGS).
- Math Model 3 DI Calculator outputting a live 0-100 index per zone.
- Threshold alert handler (DI ≥ 75) triggering automated settlement pipeline.

### 4.4 Crowdsourced Disruption Reporting
- "Report Disruption" UI component in the rider-facing React app.
- `getUserMedia()` enforcement preventing gallery photo uploads.
- Haversine Speed Trap calculation in Node.js (Model 5).
- Python FastAPI `/validate-img` endpoint (CLIP + OpenCV pipeline).
- Math Model 2 threshold check before DI override.

### 4.5 Automated Zero-Touch Settlement
- PostGIS `ST_Contains` query to isolate affected riders.
- Model 4 payout computation per qualifying rider.
- Razorpay Sandbox API disbursement.
- "Safety Halt Directive" push notification.
- PostgreSQL claim record write with full audit trail.

### 4.6 Analytics Dashboard (Underwriter View)
- Zone-level DI heatmap overlaid on **Leaflet.js + OpenStreetMap** visualization (GeoJSON polygons colored by DI severity).
- Real-time premium vs. payout ledger (float exposure).
- C_factor distribution (how many riders are being penalized vs. rewarded).
- Claim rejection log (Haversine failures, Moiré detections).

---

## 5. Business Logic & Mathematical Engine

The following 5 models are the actuarial core that make WorkSafe both useful to riders and profitable for insurers.

### 5.1 Model 1: Predictive Pricing & Consistency Matrix
**Business Problem Solved:** Premiums must be high enough to cover float exposure in bad weeks but low enough to retain subscribers in calm weeks.

`Premium% = [ P_base + (α·H_risk) + (β·W_risk) + (γ·S_risk) ] × R_geo × C_factor`

**C_factor — The Consistency Matrix:**
- **C_factor = 0.85** for riders with 12+ continuous weeks. Rewards loyalty, reduces churn.
- **C_factor ≥ 2.5** for detected adverse selection (cancelled during clear forecast, re-subscribed ahead of a predicted flood). Mathematically taxes gaming behavior, protecting the underwriting float.

**Insurer Value:** The Consistency Matrix is the primary mechanism that prevents adverse selection from making the product actuarially unviable.

### 5.2 Model 2: Dynamic Logarithmic Thresholding
**Business Problem Solved:** Prevent a single fraudulent rider from triggering a zone-wide payout worth ₹100,000+.

`U_min = max( U_base, ⌈k · ln(N + 1)⌉ )`

As zone density (N) grows, the required corroboration threshold grows logarithmically. A lone bad actor in a busy zone requires significantly more verified co-reports to trigger a payout.

### 5.3 Model 3: Live Disruption Index (DI)
**Business Problem Solved:** Normalize completely different API data types (rainfall in mm, traffic speed in km/h, protest events) into a single actionable trigger.

`DI = (w₁ · I_weather) + (w₂ · I_traffic) + (w₃ · min(100, U_ratio × 100))`

This unified index allows one threshold (DI ≥ 75) to govern payouts regardless of whether the disruption source is meteorological, infrastructural, or social.

### 5.4 Model 4: Payout Compensation Formula
**Business Problem Solved:** Prevent moral hazard (riders choosing not to work even when disruption is minor) while ensuring fair compensation.

`Payout = E_avg × H_lost × C_ratio`

- **C_ratio < 1.0** ensures the payout is always marginally less than working. A rider always earns more by continuing to work in non-dangerous conditions.

### 5.5 Model 5: Haversine Velocity (The Speed Trap)
**Business Problem Solved:** Defeat GPS spoofing and VPN-based fake location submissions.

`Velocity = Haversine(lat₁, lon₁, lat₂, lon₂) / (t₂ − t₁)`

If computed velocity between two pings exceeds 80 km/h, the system flags the movement as physically impossible in an urban zone and rejects the claim entirely.

---

## 6. Technical Strategy & Stack

The WorkSafe architecture is intentionally decoupled to ensure each layer can scale, be replaced, or be updated independently.

| Layer | Technology | Product Rationale |
|-------|------------|-------------------|
| **Frontend** | React.js + Tailwind CSS + **Leaflet.js (`react-leaflet`) + OpenStreetMap** | Embeds natively into any partner WebView. Leaflet.js renders live GeoJSON zone heatmaps over free OSM tiles — zero API key required, no credit card needed. Tailwind ensures mobile-first styling with minimal bundle size. |
| **Backend API Gateway** | Node.js + Express.js + node-cron | JSON-native, non-blocking I/O perfectly suited for concurrent multi-API polling across hundreds of city polygons. `node-cron` manages both the weekly premium cycle and the 15-minute disruption polling loop in a single runtime. |
| **Geospatial Engine** | PostgreSQL + PostGIS | Offloads all spatial math from Node.js. `ST_Contains` queries identify affected riders at database speed. Zone polygons stored as GeoJSON (SRID 4326). |
| **AI/Vision Microservice** | Python + FastAPI + Hugging Face CLIP + OpenCV | Isolated from the main transaction service. Can be retrained or swapped (e.g., CLIP → custom model) without touching the financial pipeline. FastAPI ensures sub-200ms inference for real-time fraud gate performance. |
| **Payment Simulation** | Razorpay Sandbox API | End-to-end payout simulation without real financial exposure during hackathon. Architecture is production-ready for live Razorpay integration. |
| **Mock Partner APIs** | Custom Express.js mock server | Simulates Zomato/Swiggy internal data endpoints (rider E_avg, shift patterns, ledger credits) since live B2B access is unavailable. Designed as a drop-in replacement for production integration. |

---

## 7. Success Metrics (KPIs for Hackathon Demo)

| Metric | Target | What It Proves |
|--------|--------|----------------|
| **End-to-End Payout Latency** | < 3 seconds from DI breach to payout confirmation | System is genuinely zero-touch |
| **Fraud Gate Rejection Rate (Moiré)** | 100% detection on a submitted screen-photo | AI vision pipeline is functional |
| **Haversine Rejection Latency** | < 500ms | Node.js physics engine is performant |
| **Crowdsource Threshold Validation** | System correctly blocks a single-reporter override | Model 2 is correctly calibrated |
| **Premium Calculation Accuracy** | C_factor penalty correctly applied to a gamed subscription | Consistency Matrix is operational |
| **Polygon Query Speed** | ST_Contains executes in < 100ms for 1,000 rider points | PostGIS spatial layer is optimization-ready |
| **API Polling Concurrency** | 15-minute loop completes all zone queries in < 30 seconds | Node.js async architecture scales to city-level |

---

## 8. Out of Scope

The following features and product categories are **explicitly excluded** from this version and SHALL NOT be built or implied during the hackathon:

| Out of Scope Item | Reason |
|-------------------|--------|
| **Health or Medical Insurance** | Different regulatory framework; out of actuarial scope |
| **Vehicle Damage / Repair Coverage** | Out of policy scope — income only |
| **Life Insurance Components** | Requires IRDAI licensing and separate actuarial modeling |
| **Real Zomato / Swiggy API Integration** | No live partner API access; mock server in use |
| **Native iOS/Android App** | Delivered as a mobile-responsive WebView tab only |
| **Live Payment Disbursement** | Razorpay Sandbox only; no real fund transfers |
| **Multi-Country Coverage** | Scoped exclusively to India's metro zones (INR) |
| **Rider-to-Rider Claims Disputes** | No human adjudication layer; system is fully automated |

---

*Document prepared for DEVTrails 2026 — Team UnderDogs. All financial and mathematical models are designed for simulation and demonstration purposes at the hackathon stage.*
