# 🛡️ WorkSafe — Try It Out Guide

**A hands-on walkthrough for judges, evaluators, and anyone exploring this prototype.**

> **What is WorkSafe?**
> WorkSafe is an AI-powered parametric income protection platform for India's gig delivery workers. When external disruptions — floods, protests, AQI spikes — wipe out a rider's ability to earn, WorkSafe detects the event automatically, validates it through multi-layered AI fraud gates, and pays the rider their lost income within minutes. Zero paperwork. Zero claim forms. Zero delays.

---

## Table of Contents

1. [How to Access the Prototype](#1-how-to-access-the-prototype)
2. [Admin Portal — Underwriter & Operations View](#2-admin-portal--underwriter--operations-view)
3. [User Journey — Step by Step](#3-user-journey--step-by-step)
   - [Step 1: Rider Identification & Profile Fetch](#step-1-rider-identification--profile-fetch)
   - [Step 2: Zone Selection & Risk Map](#step-2-zone-selection--risk-map)
   - [Step 3: Premium Review & Activation](#step-3-premium-review--activation)
   - [Step 4: Dashboard — Live Coverage Overview](#step-4-dashboard--live-coverage-overview)
   - [Step 5: Report a Disruption (Crowdsource Path)](#step-5-report-a-disruption-crowdsource-path)
4. [Mathematical Models — Where to Find Them](#4-mathematical-models--where-to-find-them)
5. [Fraud Prevention Architecture](#5-fraud-prevention-architecture)
6. [API & Data Pipeline](#6-api--data-pipeline)
7. [Prototype vs. Production — What Changes](#7-prototype-vs-production--what-changes)
8. [Future Roadmap](#8-future-roadmap)

---

## 1. How to Access the Prototype

### Live Deployment
| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | `https://worksafe-seven.vercel.app` |
| **Backend API (Render)** | `https://worksafe-backend1.onrender.com/health` |
| **Mock Partner API (Render)** | `https://worksafe-mock-api1.onrender.com/health` |

> **⚠️ Note:** The platform is hosted on Render's free tier. If the site takes a few seconds to load on the first visit, the servers are simply waking up from cold-start. Please wait ~30 seconds and refresh.

### Running Locally

```bash
# 1. Start the database (requires PostgreSQL + PostGIS)
psql -d worksafe_db -f database/init.sql
psql -d worksafe_db -f database/seed_zones.sql
psql -d worksafe_db -f database/seed_extended.sql

# 2. Start the Mock Partner API (Port 4001)
cd mock-partner-api && npm install && node server.js

# 3. Start the Backend (Port 4000)
cd backend && npm install && node src/app.js

# 4. Start the ML Service (Port 8000)
cd ml-service && pip install -r requirements.txt && uvicorn main:app --port 8000

# 5. Start the Frontend (Port 3000)
cd frontend && npm install && npm run dev
```

---

## 2. Admin Portal — Underwriter & Operations View

WorkSafe has a dedicated **Admin Portal** for the insurance underwriter and operations team. It provides a full bird's-eye view of the entire platform — all riders, all zones, all financial activity, and all fraud events — in real time.

### Access the Admin Portal

| Field | Value |
|-------|-------|
| **URL** | [`https://worksafe-seven.vercel.app/admin/login`](https://worksafe-seven.vercel.app/admin/login) |
| **Email** | `admin@worksafe.in` |
| **Password** | `WorkSafe@Admin2026` |

### What You Can See in the Admin Portal

**Overview Dashboard:**
- Total active policies, total riders, total claims settled, and float exposure (total premiums collected vs. total payouts disbursed).
- Platform-wide DI status — which zones are currently disrupted.

**Zone Monitor:**
- Live Disruption Index (DI) for all 10 Bengaluru zones simultaneously, color-coded by severity.
- Unlike the rider dashboard (which only shows the rider's own zone), admins see the full city-wide picture.

**Rider Management:**
- Full list of all registered riders with their policy status, zone, subscription streak, C_factor, and payout history.

**Transaction Ledger:**
- Complete financial record of every premium collected and every payout disbursed across all riders.

**Fraud Log:**
- Every fraud gate rejection logged with reason: Haversine velocity exceeded, Moiré pattern detected, CLIP classification failed, or duplicate report blocked.
- Useful for auditing the integrity of submitted disruption reports.

**Disruption Events:**
- Historical log of every zone-level disruption event — DI score at trigger, number of riders affected, total payout, and settlement latency.

**Crowdsource Reports:**
- All manually submitted rider disruption reports with their gate-by-gate validation status.

> **Note:** Admin authentication uses a separate JWT signed with a different secret, and all admin API routes require an `admin` role in the token payload. The admin account is pre-seeded in the database via `seed_extended.sql`.

---

## 3. User Journey — Step by Step

### Step 1: Rider Identification & Profile Fetch

**What you see on the home screen:**
The landing page presents a clean verification interface titled **"Verify Your Account."** At the bottom of the page, you will find a set of **Demo Rider IDs** — these are provided so that you can instantly try the platform without needing real credentials.

**Use any of these IDs to test:**

| Demo Rider ID | Name | Platform | Avg Earnings (₹/hr) |
|---------------|------|----------|---------------------|
| `ZOMATO_DEMO_RIDER_001` | Arjun Mehta | Zomato | ₹78.50 |
| `SWIGGY_DEMO_RIDER_001` | Priya Sharma | Swiggy | ₹92.00 |
| `ZOMATO_DEMO_RIDER_002` | Ravi Kumar | Zomato | ₹110.75 |
| `BLINKIT_RIDER_001` | Kavya Reddy | Blinkit | ₹95.00 |
| `SWIGGY_DEMO_RIDER_002` | Suresh Babu | Swiggy | ₹88.25 |
| `PORTER_RIDER_001` | Meena Nair | Porter | ₹105.00 |

**How to proceed:**
1. Copy any Rider ID from the table above (or from the bottom of the home page).
2. Paste it into the input field.
3. Click **"Fetch Profile →"**.

**What happens behind the scenes:**
- The frontend calls `GET /api/onboarding/profile?platform_rider_id=<ID>`.
- The backend routes this request to the **Mock Partner API** ([mock-partner-api/server.js](mock-partner-api/server.js)), which simulates the real Zomato/Swiggy/Blinkit internal API.
- The mock API returns the rider's profile: name, platform, average hourly earnings (`e_avg`), shift pattern, total deliveries, and rating.

**Why a Mock API?**
In the real product, platforms like Zomato and Swiggy would provide us their internal APIs through a B2B partnership. Their riders would access WorkSafe directly within the delivery app as a native "Income Protection" tab. Since we don't have access to live platform APIs for this hackathon, we built a fully functional mock server that simulates the exact data contract we'd receive from the real partners. This mock server lives at [`mock-partner-api/server.js`](mock-partner-api/server.js) and registers all 10 demo riders across 5 platforms (Zomato, Swiggy, Blinkit, Porter, Dunzo).

**In the production version:**
- No Rider IDs would be displayed on-screen. Riders would log in through their platform app, and WorkSafe would authenticate them via the platform's OAuth/JWT system.
- We plan to implement a dedicated **login + JWT authentication system** for direct rider onboarding outside of platform apps.
- The commission model: platforms get a small cut of each transaction for routing their riders to our insurance product — a win-win B2B2C arrangement.

---

### Step 2: Zone Selection & Risk Map

**What you see:**
After a successful profile fetch, the UI transitions to **"Select Your Primary Delivery Zone"**. You'll see:
- An interactive **Leaflet.js map** centered on Bengaluru, rendered over OpenStreetMap tiles (no API key required — fully open-source).
- **10 colored zone polygons** spread across the city, each color-coded by their current Disruption Index (DI):
  - 🟢 **Green (DI 0–25):** Safe
  - 🟡 **Yellow (DI 25–50):** Moderate
  - 🟠 **Orange (DI 50–75):** High
  - 🔴 **Red (DI 75+):** Disrupted — payout trigger active

**The 10 Bengaluru zones:**
Indiranagar, Koramangala, Whitefield, Marathahalli, Electronic City, HSR Layout, BTM Layout, Jayanagar, Yelahanka, Bannerghatta.

**How to proceed:**
1. Click on any zone card below the map (e.g., **"Indiranagar"**) to select it as your primary delivery area.
2. The map will highlight your selection.
3. Click **"Continue to Activation →"**.

**What happens behind the scenes:**
- The frontend calls `GET /api/zones` which queries the PostGIS-enabled `zones` table ([backend/src/routes/zones.js](backend/src/routes/zones.js)).
- Each zone is stored as a strict GeoJSON polygon in the database with a `risk_multiplier` — a value derived from historical claim frequency. See the zone schema in [`database/init.sql`](database/init.sql) (lines 48–53).
- The `risk_multiplier` (R_geo) directly feeds into Model 1 (Premium Calculation), making premiums more expensive in historically disrupted zones.

**Why zone selection matters:**
The zone you choose determines your premium amount, payout eligibility, and which environmental data feeds (weather, traffic) the system monitors for your coverage. In the real product, the rider's zone would be auto-detected from GPS + delivery history.

---

### Step 3: Premium Review & Activation

**What you see:**
The final onboarding step shows:
- **Weekly Premium Amount (₹):** Your calculated cost for one week of income protection.
- **Payout Rate (₹/hr):** How much you'll receive per lost hour if disruption strikes.
- **Coverage Terms:** Explicit declaration that this policy covers **loss of income only** — not health, accidents, or vehicle damage.
- A **consent checkbox** you must tick before activating.

**How to proceed:**
1. Review the premium and payout information displayed.
2. ✅ Check the consent box to acknowledge the coverage scope.
3. Click **"Activate Protection →"**.

**What happens behind the scenes:**
The premium is calculated using **Model 1: Predictive Pricing & Consistency Matrix** ([backend/src/models/premiumCalc.js](backend/src/models/premiumCalc.js)):

```
Premium% = [ P_base + (α × H_risk) + (β × W_risk) + (γ × S_risk) ] × R_geo × C_factor
```

| Variable | What it means | Source |
|----------|--------------|--------|
| `P_base` | Minimum base premium (1.5%) | Configured in model |
| `H_risk` | Hourly exposure risk (0–1) | Derived from shift length |
| `W_risk` | Weather disruption probability (0–1) | Tomorrow.io / OpenWeatherMap forecast |
| `S_risk` | Social disruption probability (0–1) | PredictHQ / NewsAPI |
| `R_geo` | Zone geographic risk multiplier (≥1.0) | `zones.risk_multiplier` in DB |
| `C_factor` | Consistency Matrix anti-fraud factor | Subscription history ledger |

**The Consistency Matrix (C_factor):**
This is our primary defense against **adverse selection** — riders who only subscribe when they know bad weather is coming and cancel during clear weeks:

| Subscription Streak | C_factor | Effect |
|---------------------|----------|--------|
| 12+ continuous weeks | 0.85 | **15% loyalty discount** — rewards commitment |
| 4–11 weeks | 1.00 | Standard pricing |
| 1–3 weeks | 1.20 | **20% new subscriber loading** — untested risk |
| Detected gaming | ≥ 2.50 | **150%+ penalty** — mathematically taxes adverse selection |

The adverse selection detection logic is implemented in `detectAdverseSelection()` within [`premiumCalc.js`](backend/src/models/premiumCalc.js) (lines 59–64). It triggers when a rider cancels during a low-risk week and re-subscribes just before a forecasted high-risk week within a 2-week gap.

**After activation:**
- The backend creates a `rider` record and an `ACTIVE` policy in PostgreSQL.
- A JWT token is issued (7-day expiry) and stored in `localStorage` — this authenticates all subsequent API calls.
- You are redirected to the **Dashboard**.

---

### Step 4: Dashboard — Live Coverage Overview

**What you see:**
The Dashboard ([frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx)) has three tabs:

**Tab 1: Overview**
- **Subscription Streak:** How many consecutive weeks you've been covered.
- **Total Payouts Received:** Sum of all historical claim settlements.
- **Active Zone:** Your selected delivery zone with its current DI score.
- **Policy Status Card:** Shows your current C_factor, zone risk multiplier, and premium amount.

**Tab 2: Zone Map**
- A live Leaflet.js heatmap showing all 10 Bengaluru zones color-coded by Disruption Index severity.
- Each zone displays its current DI score fetched from the `zone_disruption_log` table.
- The DI is calculated by **Model 3: Live Disruption Index** ([backend/src/models/disruptionIndex.js](backend/src/models/disruptionIndex.js)):

```
DI = (0.45 × I_weather) + (0.35 × I_traffic) + (0.20 × min(100, U_ratio × 100))
```

Where:
- `I_weather` = Normalized weather severity (0–100) from OpenWeatherMap, NASA EONET, USGS earthquake data.
- `I_traffic` = Normalized traffic speed drop (0–100) from TomTom Traffic API.
- `U_ratio` = Crowdsource verification ratio from rider-submitted reports.
- When **DI ≥ 75**, the automated payout pipeline triggers.

**Tab 3: Claims History**
- A chronological list of all past disruption events and settlements.
- Each claim shows: zone affected, DI score at trigger, hours lost, payout amount, Razorpay transaction ID, and settlement timestamp.
- The payout for each claim is computed by **Model 4: Payout Compensation Formula** ([backend/src/models/payoutCalc.js](backend/src/models/payoutCalc.js)):

```
Payout (₹) = E_avg × H_lost × C_ratio
```

Where `C_ratio` is set to **0.85** — meaning the payout is always 85% of what the rider would have earned. This prevents **moral hazard** (riders choosing not to work when disruption is minor because the payout exceeds their earnings).

**The Underwriter Analytics View:**
The dashboard endpoint (`GET /api/claims/dashboard` — see [backend/src/routes/claims.js](backend/src/routes/claims.js), lines 83–145) also powers an analytics view that shows:
- Zone-level DI heatmap data with GeoJSON polygons.
- Float exposure (total payouts settled vs. pending vs. failed).
- C_factor distribution across all active policies.
- Recent fraud rejection log (which gates caught what).

---

### Step 5: Report a Disruption (Crowdsource Path)

**What you see:**
The Report page ([frontend/src/pages/Report.jsx](frontend/src/pages/Report.jsx)) provides a **"Report Disruption"** feature for situations where local events (protests, road blockages, localized strikes) are not detected by weather/traffic APIs.

**How to proceed:**
1. From the Dashboard, click **"Report Disruption"**.
2. The system requests your **live GPS location** via `navigator.geolocation`.
3. Your **camera opens** (forced live capture — gallery upload is blocked). Take a photo of the disruption.
4. Click **"Submit Report"**.
5. Watch the **4-Gate Fraud Validation Pipeline** execute in real-time on screen:

| Gate | Name | What It Does | Code Reference |
|------|------|-------------|----------------|
| Gate 0 | **Integrity Check** | Blocks duplicate reports within a 4-hour window per zone | [reports.js](backend/src/routes/reports.js) lines 37–46 |
| Gate 1 | **Velocity Audit** | Haversine Speed Trap — computes velocity between GPS pings. If > 80 km/h → rejected as physically impossible | [haversine.js](backend/src/models/haversine.js) |
| Gate 2 | **Neural Scene Vision** | CLIP zero-shot classification checks if the image depicts genuine disruption (flood, accident, protest). Moiré pattern detection via FFT analysis catches photos-of-screens | [clip_classifier.py](ml-service/utils/clip_classifier.py), [moire_detector.py](ml-service/utils/moire_detector.py) |
| Gate 3 | **Consensus Threshold** | Logarithmic threshold — requires at least `U_min` independent verified reports before triggering zone-wide payout | [logThreshold.js](backend/src/models/logThreshold.js) |

**The Logarithmic Threshold (Model 2):**
This prevents a single bad actor from triggering a zone-wide payout that could cost ₹100,000+:

```
U_min = max( U_base, ⌈ k × ln(N + 1) ⌉ )
```

Where `U_base = 3` and `k = 2.5`. As the number of active riders (N) in a zone grows, the required number of independent verified reports grows logarithmically. See the implementation at [`logThreshold.js`](backend/src/models/logThreshold.js).

**The AI Vision Pipeline (ML Microservice):**
The Python FastAPI microservice ([ml-service/main.py](ml-service/main.py)) exposes a `POST /validate-img` endpoint that runs two models in sequence:

1. **CLIP Zero-Shot Classification** ([ml-service/utils/clip_classifier.py](ml-service/utils/clip_classifier.py)):
   - Uses HuggingFace's hosted `openai/clip-vit-base-patch32` model.
   - Classifies the image against 10 candidate labels (5 disruption types + 5 non-disruption types).
   - Threshold: `disruption_confidence ≥ 0.65` → APPROVED.

2. **Moiré Pattern Detection** ([ml-service/utils/moire_detector.py](ml-service/utils/moire_detector.py)):
   - Applies Fast Fourier Transform (FFT) to detect screen-capture artifacts.
   - Screen photos exhibit characteristic periodic spikes in the frequency domain caused by camera-sensor/screen-pixel grid interference.
   - Threshold: `moire_confidence ≥ 0.40` → REJECTED regardless of CLIP score.

---

## 3. Mathematical Models — Where to Find Them

All 5 core mathematical models are implemented as standalone modules in the backend's [`models/`](backend/src/models/) directory:

| Model | Purpose | File | Formula |
|-------|---------|------|---------|
| **Model 1** | Predictive Pricing & Consistency Matrix | [premiumCalc.js](backend/src/models/premiumCalc.js) | `Premium% = [P_base + (α·H) + (β·W) + (γ·S)] × R_geo × C_factor` |
| **Model 2** | Dynamic Logarithmic Thresholding | [logThreshold.js](backend/src/models/logThreshold.js) | `U_min = max(U_base, ⌈k·ln(N+1)⌉)` |
| **Model 3** | Live Disruption Index (DI) | [disruptionIndex.js](backend/src/models/disruptionIndex.js) | `DI = (w₁·I_weather) + (w₂·I_traffic) + (w₃·U_component)` |
| **Model 4** | Payout Compensation | [payoutCalc.js](backend/src/models/payoutCalc.js) | `Payout = E_avg × H_lost × C_ratio` |
| **Model 5** | Haversine Velocity (Speed Trap) | [haversine.js](backend/src/models/haversine.js) | `Velocity = Haversine(lat₁,lon₁,lat₂,lon₂) / Δt` |

Each file is fully commented with SRS requirement traceability tags (e.g., `SRS Section 4.3`, `FR-4B.4`). For the complete mathematical derivation and actuarial rationale, see the [PRD](PRD.md) (Section 5) and the [SRS](SRS.md).

---

## 4. Fraud Prevention Architecture

WorkSafe implements **defense-in-depth** across 5 distinct layers. No single point of failure can compromise the system:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Client-Side OS Enforcement                        │
│  → getUserMedia() forces live camera; gallery blocked       │
│  → Prevents recycled/stock photos                           │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Haversine Speed Trap (Model 5)                    │
│  → Server-side GPS velocity check between pings             │
│  → Rejects movements > 80 km/h as physically impossible     │
│  → Code: backend/src/models/haversine.js                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 3a: CLIP Zero-Shot Classification                    │
│  → AI confirms visual presence of genuine disruption        │
│  → Code: ml-service/utils/clip_classifier.py                │
├─────────────────────────────────────────────────────────────┤
│  Layer 3b: Moiré Pattern Detection (OpenCV + FFT)           │
│  → Detects screen-capture fraud via frequency analysis      │
│  → Code: ml-service/utils/moire_detector.py                 │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Logarithmic Crowdsource Threshold (Model 2)       │
│  → Requires independent corroboration from multiple riders  │
│  → Prevents single bad actors from triggering zone payouts  │
│  → Code: backend/src/models/logThreshold.js                 │
├─────────────────────────────────────────────────────────────┤
│  Layer 5: Consistency Matrix (Model 1)                      │
│  → Penalizes adverse selection in subscription patterns     │
│  → C_factor ≥ 2.5 for detected gaming                      │
│  → Code: backend/src/models/premiumCalc.js                  │
└─────────────────────────────────────────────────────────────┘
```

The fraud rejection log is stored in the `fraud_log` table and visible in the Dashboard's underwriter analytics view. See [`database/init.sql`](database/init.sql) for the schema.

---

## 5. API & Data Pipeline

### Real-Time Data Sources

The backend polls the following APIs every **15 minutes** via a `node-cron` job ([backend/src/cron/pollingJob.js](backend/src/cron/pollingJob.js)) to compute the Disruption Index for each zone:

| API | Data Provided | Service File |
|-----|--------------|-------------|
| **OpenWeatherMap** | Rainfall (mm/hr), temperature, severe weather alerts | [weatherService.js](backend/src/services/weatherService.js) |
| **TomTom Traffic** | Real-time traffic speed drop as a proxy for infrastructure disruption | [trafficService.js](backend/src/services/trafficService.js) |
| **NASA EONET** | Natural disasters — wildfires, volcanic activity | [weatherService.js](backend/src/services/weatherService.js) |
| **USGS Earthquake** | Seismic events — auto-spikes DI to 100 for affected zones | [weatherService.js](backend/src/services/weatherService.js) |
| **PredictHQ** | Scheduled social disruptions (rallies, demonstrations) | [socialService.js](backend/src/services/socialService.js) |
| **NewsAPI** | Real-time keyword scraping for "Strike," "Protest," "Curfew" | [socialService.js](backend/src/services/socialService.js) |

### Automated Settlement Pipeline

When the DI for any zone breaches 75 — whether through API data or crowdsource reports — the settlement pipeline ([backend/src/cron/settlementPipeline.js](backend/src/cron/settlementPipeline.js)) fires automatically:

1. Creates a `disruption_event` record in the database.
2. Runs a PostGIS `ST_Contains` query to identify all premium-paying riders geolocated inside the disrupted polygon ([postgisService.js](backend/src/services/postgisService.js)).
3. Computes individual payouts using Model 4.
4. Disburses via Razorpay Sandbox API ([razorpayService.js](backend/src/services/razorpayService.js)).
5. Updates claim records with Razorpay transaction IDs.
6. The entire process includes a **4-hour cooldown** per zone to prevent double-firing.

### Weekly Premium Cycle

Every **Saturday at 11:00 PM IST**, a separate `node-cron` job ([backend/src/cron/premiumJob.js](backend/src/cron/premiumJob.js)) calculates next week's premium for all active riders using Model 1, incorporating the latest weather/social forecasts and each rider's C_factor.

---

## 6. Prototype vs. Production — What Changes

| Feature | Prototype (Current) | Production (Planned) |
|---------|---------------------|---------------------|
| **Rider Login** | Demo Rider IDs displayed on home page | Platform OAuth/SSO integration + dedicated JWT login |
| **Partner API** | Custom mock server simulating Zomato/Swiggy | Live B2B API integration with real platform data |
| **Payments** | Razorpay Sandbox (no real money) | Live Razorpay with real fund transfers to UPI/bank |
| **Zone Coverage** | 10 zones in Bengaluru | Expandable to any Indian metro (add GeoJSON polygons) |
| **Subscription Plans** | Weekly rolling only | Weekly, Monthly (4-week), Quarterly (13-week), Semi-Annual (26-week) |
| **Premium Opt-Out** | Not implemented in UI | 24-hour opt-out window with push notification |
| **Push Notifications** | Console logs only | Firebase Cloud Messaging / platform push |
| **ML Model** | HuggingFace hosted CLIP API | Fine-tuned custom model on India-specific disruption imagery |
| **Moiré Detection** | FFT-based OpenCV analysis | Enhanced with deep learning (ResNet/EfficientNet trained on screen-capture dataset) |
| **Hosting** | Render free tier (cold starts) | AWS/GCP with auto-scaling, zero cold starts |
| **Database** | Supabase PostgreSQL (free tier) | Managed RDS/CloudSQL with read replicas |

---

## 7. Future Roadmap

### Near-Term Improvements
- **Multi-Duration Plans:** Introduce 1-month, 3-month, and 6-month subscription plans with progressive loyalty discounts. Longer commitments → lower per-week cost.
- **Enhanced UI/UX:** Add real-time animated transitions, dark/light mode toggle, interactive DI trend charts (Chart.js/Recharts), and a mobile-native PWA manifest.
- **Improved AI Validation:** Fine-tune the CLIP model on Indian road/weather disruption images for higher accuracy. Train a custom CNN for Moiré detection instead of relying solely on FFT heuristics.
- **Rider Trust Score:** Build a composite trust metric combining subscription streak, claim frequency, report accuracy, and fraud gate pass rate.

### Medium-Term Features
- **Multi-City Expansion:** Add Mumbai, Delhi, Hyderabad, Chennai, Pune zone polygons. The architecture is city-agnostic — just add GeoJSON and API targets.
- **Native Mobile App:** Convert from WebView to a standalone React Native/Flutter app for deeper OS integration (background location, push notifications, biometric auth).
- **Real-Time Rider Tracking:** Continuous GPS ping stream with WebSocket connection for sub-minute DI updates and instant disruption alerts.
- **Premium Optimization Engine:** Use historical claim data to train an ML model that auto-tunes premium coefficients (α, β, γ) per zone per season.

### Long-Term Vision
- **Partner API Marketplace:** Build a self-service portal where delivery platforms (Zomato, Swiggy, Zepto, Dunzo, Porter, BigBasket) can integrate WorkSafe in under 48 hours.
- **Regulatory Compliance:** Pursue IRDAI sandbox approval for live parametric insurance underwriting in India.
- **Cross-Border Expansion:** Adapt the model for gig economies in Southeast Asia (Grab, GoJek) and LATAM (Rappi, iFood).
- **Climate Adaptation Index:** Integrate long-term climate data (IPCC projections) into zone-level risk multipliers to future-proof premium pricing against increasing weather volatility.

---

## Quick Reference: Project Architecture

```
worksafe/
├── frontend/              → React.js + Leaflet.js + Tailwind CSS
│   ├── src/pages/         → Onboarding.jsx, Dashboard.jsx, Report.jsx
│   ├── src/components/    → ZoneMap.jsx, CameraCapture.jsx, PremiumCard.jsx
│   └── src/services/      → api.js (Axios client)
│
├── backend/               → Node.js + Express.js + node-cron
│   ├── src/models/        → 5 mathematical models (DI, Premium, Payout, Haversine, Threshold)
│   ├── src/routes/        → onboarding.js, claims.js, reports.js, zones.js
│   ├── src/services/      → weatherService, trafficService, postgisService, razorpayService
│   └── src/cron/          → pollingJob.js (15-min), premiumJob.js (weekly), settlementPipeline.js
│
├── ml-service/            → Python + FastAPI + CLIP + OpenCV
│   ├── routes/            → validate_img.py
│   └── utils/             → clip_classifier.py, moire_detector.py
│
├── mock-partner-api/      → Express.js mock (simulates Zomato/Swiggy APIs)
│   └── server.js          → 10 demo riders across 5 platforms
│
├── database/              → PostgreSQL + PostGIS
│   ├── init.sql           → Full schema (9 tables, 5 ENUMs, spatial indexes)
│   ├── seed_zones.sql     → 3 base Bengaluru zones
│   └── seed_extended.sql  → 10 zones + 10 riders + demo disruption events
│
├── PRD.md                 → Product Requirements Document
├── SRS.md                 → Software Requirements Specification
└── README.md              → Technical overview and setup guide
```

---

*Document prepared for DEVTrails 2026 — Team UnderDogs. This prototype demonstrates a fully functioning end-to-end parametric insurance pipeline. All financial transactions are simulated via Razorpay Sandbox.*
