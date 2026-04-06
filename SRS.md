# Software Requirements Specification (SRS)
## WorkSafe: AI-Powered Parametric Income Protection for India's Gig Economy

---

| Field | Detail |
|-------|--------|
| **Document Title** | Software Requirements Specification — WorkSafe Platform |
| **Version** | 1.0.0 |
| **Status** | Final — Hackathon Submission |
| **Date** | April 4, 2026 |
| **Prepared by** | Pratyush Adhikari, Team UnderDogs |
| **Hackathon** | DEVTrails 2026 — Guidewire |
| **Classification** | Technical Internal Document |

---


## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features & Functional Requirements](#3-system-features--functional-requirements)
4. [Actuarial & Mathematical Specifications](#4-actuarial--mathematical-specifications)
5. [External Interface Requirements](#5-external-interface-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [System Architecture & Technology Stack](#7-system-architecture--technology-stack)
8. [Data Dictionary & Schema Definitions](#8-data-dictionary--schema-definitions)
9. [Error Handling & Exception Management](#9-error-handling--exception-management)
10. [Constraints, Risks & Mitigations](#10-constraints-risks--mitigations)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) provides a comprehensive, production-grade operational and architectural blueprint for the **WorkSafe** platform — an AI-powered parametric income protection system engineered exclusively for India's platform-based gig economy.

This document is the authoritative reference that:
- Defines all **functional and non-functional requirements** for the WorkSafe system.
- Documents the five **actuarial mathematical models** governing premium calculation, disruption detection, anti-fraud enforcement, and payout settlement.
- Specifies the **decoupled microservices architecture** consisting of a Node.js/Express API gateway, a Python/FastAPI ML inference service, and a PostgreSQL/PostGIS geospatial database.
- Establishes **integration interfaces** with external data providers (weather, traffic, social event, payment) and mock delivery platform APIs.

This document was prepared for the DEVTrails 2026 hackathon submission and serves as the technical foundation for engineering decisions, code review, and judging evaluation.

---

### 1.2 Document Conventions

| Tag | Meaning |
|-----|---------|
| **SHALL / MUST** | Mandatory requirement. Non-negotiable. |
| **SHOULD** | Strongly recommended. May have constraints due to API rate limits or hackathon scope. |
| **MAY** | Optional capability. Can be deferred post-hackathon. |
| **RESTRICTED** | Explicitly forbidden. Represents a hard system boundary. |
| **[MOCK]** | Functionality currently implemented via mock API due to absent live partner access. |
| **FR-X.Y** | Functional Requirement identifier (Stage.Sequence). |
| **NFR-X** | Non-Functional Requirement identifier. |
| **SRID 4326** | WGS 84 — the geographic coordinate system used for all PostGIS polygon operations. |

---

### 1.3 Intended Audience

| Stakeholder | Relevance |
|-------------|-----------|
| **Frontend Engineers** (React.js) | UI flows, Leaflet.js/OpenStreetMap integration, camera/GPS hardware interfaces |
| **Backend Engineers** (Node.js/Express) | API design, cron scheduling, math model implementation, PostGIS queries |
| **ML Engineers** (Python/FastAPI) | CLIP inference pipeline, OpenCV Moiré detection, `/validate-img` endpoint |
| **Database Administrators** | PostgreSQL schema, PostGIS spatial index optimization |
| **DevOps / Deployment Team** | Environment setup, containerization, API key management |
| **DEVTrails 2026 Judging Panel** | Technical architecture validation, completeness of requirements |

---

### 1.4 System Scope

**WorkSafe** is a B2B2C platform integration providing **parametric income protection** for India's platform-based delivery workers. The system is embedded natively within partner delivery applications (e.g., Zomato, Swiggy, Zepto) as a mobile-responsive React.js micro-frontend.

**In Scope:**
- Dynamic weekly premium calculation and automated deduction.
- Real-time environmental, traffic, and social disruption monitoring across GeoJSON delivery polygons.
- Multi-layered AI fraud detection and GPS spoofing prevention.
- Automatic claim triggering and zero-touch income payout settlement.
- Crowdsourced disruption fallback with AI image validation.

**Explicitly Out of Scope (RESTRICTED):**
- Health insurance, medical expense coverage.
- Life insurance or disability claims.
- Vehicle repair or accident damage compensation.
- Real-time integration with live Zomato/Swiggy partner APIs (replaced by mock services).
- Native iOS or Android application development.
- Multi-currency or international deployment.

---

### 1.5 Glossary

| Term | Definition |
|------|------------|
| **Parametric Insurance** | Insurance that automatically pays upon the occurrence of a predefined trigger event, bypassing traditional claim adjustment processes. |
| **B2B2C** | Business-to-Business-to-Consumer. WorkSafe integrates with Zomato (Business) to serve the rider (Consumer). |
| **Rolling Weekly Subscription** | A continuous 7-day coverage period auto-renewed unless explicitly opted out. Premium is deducted from the rider's weekly platform payout. |
| **Delivery Zone / Polygon** | A geographic area represented as a GeoJSON polygon stored in PostGIS, corresponding to a defined delivery sector in an Indian city. |
| **Disruption Index (DI)** | A composite normalized metric (0–100) quantifying the combined severity of weather, traffic, and crowdsourced disruption signals within a polygon at any given moment. |
| **C_factor (Consistency Factor)** | An actuarial multiplier (0.85–≥2.5) applied to the base premium that rewards long-term subscribers and penalizes adverse selection behavior. |
| **Adverse Selection** | The actuarial risk of subscribers canceling during calm weather and re-subscribing before predicted disruption events — mitigated by the Consistency Matrix. |
| **Moiré Pattern** | Repetitive wave-like visual artifacts appearing in a digital photograph of a digital screen, used as an indicator of fraudulent image submission. |
| **Haversine Distance** | The great-circle distance (km) between two GPS coordinate pairs on the Earth's surface, used for velocity-based fraud detection. |
| **ST_Contains** | A PostGIS spatial function returning true if a geometry (zone polygon) completely contains a second geometry (rider GPS point). |
| **E_avg** | A rider's established average hourly earning rate derived from their platform's historical payout data. |
| **H_lost** | The number of billable hours remaining in a rider's standard shift at the moment a disruption is confirmed. |
| **node-cron** | A Node.js library enabling task scheduling via cron expression syntax, used for premium calculation cycles and zone polling loops. |

---

## 2. Overall Description

### 2.1 Product Perspective

WorkSafe is not a standalone application. It is a **micro-frontend integration embedded within existing gig delivery partner apps** via a WebView tab labeled "Income Protection." This design philosophy is intentional:

- **Zero App Fatigue:** Riders never install a separate app. Adoption scales with the partner platform's existing user base.
- **Native Access:** The WebView retains access to mobile OS APIs (camera via `MediaDevices.getUserMedia()`, GPS via `navigator.geolocation`), essential for the fraud prevention pipeline.
- **Platform-Native Trust:** Riders trust their delivery app implicitly. Embedding within the host application removes the trust barrier for financial product adoption.

The system communicates with three categories of external services:
1. **Delivery Platform APIs [MOCK]:** Fetch rider operational baselines; execute ledger deductions/credits.
2. **Environmental & Social Oracle APIs:** OpenWeatherMap, Tomorrow.io, TomTom, PredictHQ, NASA EONET, USGS, NewsAPI.
3. **Payment Rails:** Razorpay Sandbox for simulated payout disbursement.

---

### 2.2 User Characteristics

#### 2.2.1 Delivery Partner (Primary End-User)

| Characteristic | Detail |
|----------------|--------|
| **Tech Literacy** | Moderate — comfortable with smartphone apps and their delivery partner dashboard |
| **Device** | Primarily entry-to-mid-tier Android devices (Android 9+) |
| **Connectivity** | Variable — 4G when mobile, potential signal drops in dense urban areas |
| **Affordability Sensitivity** | High — any premium above ≈2% of weekly earnings triggers opt-out consideration |
| **Claim Expectation** | Immediate — riders will lose confidence if payout does not arrive within minutes |
| **Language** | Primarily Hindi/regional languages; UI should support localization in production |

#### 2.2.2 Insurance Underwriter (Secondary User — Analytical Consumer)

| Characteristic | Detail |
|----------------|--------|
| **Concern** | Loss ratio, adverse selection, claim fraud rate |
| **System Interaction** | Primarily via the Analytics Dashboard (zone heatmaps, float exposure, C_factor distribution) |
| **Actuarial Requirement** | Must be able to verify that mathematical models enforce solvency margins |

---

### 2.3 Operating Environment

| Component | Specification |
|-----------|---------------|
| **Frontend Runtime** | Mobile WebView (Android/iOS) embedded within partner app; React.js 18+ |
| **Backend Runtime** | Node.js 20 LTS, Express.js 4.x, hosted on a containerized Linux environment |
| **Database** | PostgreSQL 15+ with PostGIS 3.3 extension; connection pooling via `pg-pool` |
| **ML Service** | Python 3.11+, FastAPI 0.110+, NumPy, Hugging Face Transformers (CPU/GPU agnostic) |
| **Scheduling** | `node-cron` v3 for cron-based task management within the Node.js process |
| **Browser Requirements** | Chrome Mobile 96+, Safari iOS 14+ (for `getUserMedia()` and Geolocation API support) |

---

### 2.4 Assumptions and Dependencies

**A-1: Platform API Availability [MOCK]**
> The system currently has no access to live internal partner APIs from delivery platforms (Zomato, Swiggy, Zepto). All partner-facing data ingestion (rider baselines, ledger deductions, payout credits) SHALL be fulfilled by an internal Express.js mock server running on a dedicated port. Mock API responses SHALL be structured identically to expected production API contracts to enable seamless production migration.

**A-2: External API Reliability**
> The system assumes ≥99% uptime for tier-1 external APIs (OpenWeatherMap, Tomorrow.io, TomTom). In the event of concurrent API downtime, the crowdsourced reporting fallback (Stage 4B) SHALL remain operational as a continuity mechanism.

**A-3: Device Hardware Availability**
> The system assumes that target devices support HTML5 `navigator.geolocation` (GPS), `MediaDevices.getUserMedia()` (Camera), and push notification capabilities. Devices that do not expose these APIs will receive degraded functionality with appropriate UI error states.

**A-4: PostGIS Zone Pre-seeding**
> The system assumes all target city delivery zone polygons (GeoJSON, SRID 4326) have been pre-loaded into the PostgreSQL database prior to system initialization. Zone seeding is a deployment prerequisite.

**A-5: Razorpay Sandbox**
> All payment disbursements during the hackathon demo occur exclusively in Razorpay's test environment. No real financial transactions are executed.

---

## 3. System Features & Functional Requirements

The WorkSafe system is architectured across **five operational stages**, each representing a distinct phase in the rider's insurance lifecycle.

---

### 3.1 Stage 1: Frictionless B2B2C Onboarding & Data Synchronization

**Objective:** Ingest the delivery partner into the risk pool without requiring manual data entry, establishing their actuarial profile and coverage baseline.

---

**FR-1.1 — Embedded Tab Rendering**
The system SHALL render the "Income Protection" React micro-frontend as a WebView tab within the host delivery application, indistinguishable from native app content in terms of visual integration.

**FR-1.2 — Automated Rider Data Ingestion [MOCK]**
Upon tab load, the Express.js backend SHALL issue a secure, authenticated request to the delivery platform API (or mock equivalent) to retrieve:
- **Primary Delivery Hub:** The rider's most frequently serviced geographic zone, mapped to a PostGIS polygon identifier.
- **Shift Patterns:** Average daily hours, preferred time slots (morning, evening, late-night).
- **Financial Baseline (E_avg):** The rider's established average hourly net earning in INR.

**FR-1.3 — Data Verification UI**
The frontend SHALL render a pre-populated summary card displaying all fetched rider data. The rider MUST be given the ability to review and dispute any incorrect values before proceeding.

**FR-1.4 — Mandatory Scope Disclosure**
The onboarding screen SHALL display a legally mandated consent dialog explicitly stating:
> *"WorkSafe provides coverage for Loss of Income only. This policy does not cover health, accidents, vehicle damage, or any other category of insurance."*
The rider MUST affirmatively acknowledge this statement before the subscription is activated.

**FR-1.5 — Subscription Activation**
Upon rider confirmation, the Express.js backend SHALL:
1. Create a `policy` record in PostgreSQL with status `ACTIVE`.
2. Initialize the `subscription_streak` to `1`.
3. Record the `zone_id` (PostGIS polygon reference) as the rider's primary insured polygon.
4. Return a subscription confirmation with the first week's premium estimate.

**FR-1.6 — Alternate Flow: Partner API Failure [MOCK Fallback]**
If the partner API (or mock server) returns a non-200 response or times out after 5 seconds, the system SHALL:
1. Display an error notification to the rider.
2. Render a manual onboarding form allowing the rider to:
   - Select their primary delivery zone from an interactive **Leaflet.js polygon picker** rendered over OpenStreetMap tiles.
   - Self-declare their estimated daily income (flagged as `manual_baseline: true` in PostgreSQL for actuarial auditing).

---

### 3.2 Stage 2: The Financial Engine — Dynamic Premium Calculation & Deduction

**Objective:** Calculate actuarially sound, risk-adjusted weekly premiums and execute seamless deductions from the rider's existing platform payout.

---

**FR-2.1 — Weekly Premium Calculation Trigger**
A `node-cron` job SHALL execute every Saturday at 23:00 IST (configurable via `CRON_PREMIUM_SCHEDULE` environment variable) to initiate the premium calculation batch for all riders with `ACTIVE` policy status.

**FR-2.2 — External Risk Data Acquisition**
For each active rider's `zone_id`, the backend SHALL asynchronously fetch:
- A 7-day weather forecast from Tomorrow.io.
- A 7-day structured event schedule from PredictHQ (political rallies, protests, sporting events).
- Current zone-level risk history from the internal PostgreSQL claims ledger.

**FR-2.3 — Premium Computation (Model 1)**
The backend SHALL compute the `WeeklyPremium%` using the Predictive Pricing formula defined in Section 4.1, applying the current `C_factor` retrieved from the rider's `subscription_streak` ledger record.

**FR-2.4 — Premium Notification**
The system SHALL dispatch an asynchronous push notification to the rider by Saturday 23:30 IST, disclosing:
- The calculated premium amount in INR.
- The coverage week (Monday–Sunday).
- A prominently accessible "Opt-Out" deep-link with a 24-hour window.

**FR-2.5 — Auto-Deduction Execution**
If no opt-out event is recorded by Sunday 23:59 IST, the system SHALL:
1. Transmit a ledger deduction instruction to the partner API [MOCK] for the computed premium amount.
2. Increment `subscription_streak` by 1 in the rider's policy record.
3. Create a `premium_transaction` record in PostgreSQL with status `DEDUCTED`.

**FR-2.6 — Opt-Out Processing**
If the rider invokes the opt-out link, the system SHALL:
1. Mark the policy status as `PAUSED` for the upcoming week only.
2. Record the `opt_out_week` and corresponding `forecast_risk_level` in the consistency ledger for Consistency Matrix evaluation in the next cycle.
3. NOT increment `subscription_streak`.

---

### 3.3 Stage 3: Concurrent Active Polygon Monitoring

**Objective:** Continuously monitor all active delivery zones for environmental and social disruption signals and maintain a live Disruption Index per polygon.

---

**FR-3.1 — 15-Minute Polling Loop**
A `node-cron` job SHALL execute every 15 minutes (configurable via `CRON_POLLING_SCHEDULE`) iterating through the complete set of active zone polygons in the database.

**FR-3.2 — Concurrent API Fetching**
For each polygon, the system SHALL issue concurrent HTTP requests using `Promise.all` to:
- **OpenWeatherMap:** Current precipitation, wind speed, visibility, and severe weather alerts.
- **TomTom Traffic API:** Real-time traffic congestion index and average vehicle speed.
- **NASA EONET:** Active natural event flags intersecting the polygon bounding box.
- **USGS:** Earthquake magnitude readings within a 50km radius of the polygon centroid.

**FR-3.3 — Metric Normalization**
Each raw API response SHALL be normalized to a 0–100 scalar value using the following mapping logic implemented in the Node.js normalization module:

| Source | Raw Metric | Normalization Logic |
|--------|-----------|---------------------|
| OpenWeatherMap | Precipitation (mm/hr) | `min(100, precipitation_mm * 10)` |
| TomTom | Traffic speed drop (%) | `speed_drop_percent` (0–100) |
| NASA EONET | Event severity code | Mapped: `low→20, medium→60, high→100` |
| USGS | Earthquake magnitude (Richter) | `min(100, magnitude * 15)` |

**FR-3.4 — Live DI Computation (Model 3)**
The normalized metrics SHALL be combined using the DI formula defined in Section 4.3 to produce a single floating-point Disruption Index for each polygon.

**FR-3.5 — Threshold Breach Detection**
If any polygon's computed `DI >= 75`, the system SHALL immediately enqueue a disruption event record for that zone and proceed to Stage 4 (API-Triggered Path).

**FR-3.6 — DI Persistence**
Every DI computation result SHALL be persisted to the `zone_disruption_log` table with a UTC timestamp. This historical log is used for the `R_geo` geographic risk multiplier in premium calculations.

---

### 3.4 Stage 4: Disruption Event Detection & Multi-Layer Fraud Defense

**Objective:** Validate disruption events through two distinct pathways — automated API triggers and crowdsourced human reporting — applying a mandatory four-gate fraud prevention pipeline to the latter.

---

#### 4A: API-Triggered Zero-Touch Path

**FR-4A.1 — Cohort Identification via Spatial Query**
Upon DI threshold breach, the Express.js backend SHALL execute the following PostGIS query to identify all qualifying riders:
```sql
SELECT r.rider_id, r.policy_id, r.e_avg, r.shift_pattern
FROM active_sessions s
JOIN policies p ON s.rider_id = p.rider_id
JOIN riders r ON r.rider_id = s.rider_id
WHERE ST_Contains(
    (SELECT geom FROM zones WHERE zone_id = $1),
    ST_SetSRID(ST_MakePoint(s.current_longitude, s.current_latitude), 4326)
)
AND p.status = 'ACTIVE'
AND p.zone_id = $1;
```

**FR-4A.2 — Disruption Record Creation**
The system SHALL create a `disruption_event` record in PostgreSQL with fields: `zone_id`, `trigger_type: 'API'`, `di_score`, `triggered_at`, `status: 'PENDING_SETTLEMENT'`.

**FR-4A.3 — Settlement Pipeline Handoff**
All riders returned by the cohort query SHALL be passed as a batch to the Stage 5 settlement pipeline.

---

#### 4B: Crowdsourced Fallback Path

**FR-4B.1 — Report Disruption UI**
The React frontend SHALL expose a "Report Disruption" button to all riders with `ACTIVE` policies. Tapping this button SHALL initiate a guided multi-step report flow.

**FR-4B.2 — Fraud Gate 1: Forced Live Camera Capture**
The system SHALL invoke `MediaDevices.getUserMedia({ video: { facingMode: "environment" } })` for image capture. The UI SHALL:
- Display only the real-time camera feed — NO file picker or gallery import control.
- Detect and block any browser extensions that proxy `getUserMedia()` with a pre-recorded stream.
- Verify that device mock location developer settings are not active (via a platform capability check where API permits).

**FR-4B.3 — Fraud Gate 2: Haversine Speed Trap (Model 5)**
Upon receiving the report coordinates `(lat₂, lon₂, t₂)`, the backend SHALL retrieve the rider's last recorded GPS ping `(lat₁, lon₁, t₁)` and compute the velocity using Model 5 (Section 4.5). If the computed velocity exceeds **80 km/h**, the report SHALL be rejected with HTTP 422 and the attempt logged to `fraud_log` with type `VELOCITY_VIOLATION`.

**FR-4B.4 — Fraud Gate 3: AI Vision Validation**
Validated images SHALL be forwarded via HTTP POST to the Python/FastAPI microservice at `/validate-img`. The service SHALL:
1. **CLIP Classification:** Run zero-shot classification against labels: `["flood", "protest", "accident", "road blockage", "heavy traffic", "normal conditions"]`. A confidence score below **0.65** for any disruption category SHALL result in rejection.
2. **OpenCV Moiré Detection:** Analyze the image for frequency-domain artifacts (FFT peak analysis) characteristic of photographing a digital screen. A Moiré confidence score above **0.40** SHALL result in rejection.

**FR-4B.5 — Fraud Gate 4: Logarithmic Crowdsource Threshold (Model 2)**
The system SHALL compute `U_min` for the reported zone using Model 2 (Section 4.2). The report SHALL be added to the validated report count for that zone. Only when the validated report count reaches `U_min` SHALL the zone's DI be overridden to **100** and the settlement pipeline triggered.

**FR-4B.6 — Duplicate Report Prevention**
A rider SHALL NOT be permitted to submit more than one disruption report for the same zone within a 4-hour window. Duplicate attempts SHALL be rejected with HTTP 429 and logged.

---

### 3.5 Stage 5: Automated Payout Settlement & Ledger Reconciliation

**Objective:** Execute zero-touch, mathematically derived income replacement payouts and close the disruption event's financial loop.

---

**FR-5.1 — Safety Halt Directive**
Immediately upon settlement pipeline activation, the system SHALL dispatch a high-priority push notification to all qualifying riders:
> *"⚠️ Disruption Verified in Your Zone. Cease delivery operations. Income Protection activated."*

**FR-5.2 — Payout Calculation (Model 4)**
For each qualifying rider, the system SHALL compute the compensation amount using Model 4 (Section 4.4), substituting:
- `E_avg` from the rider's policy record.
- `H_lost` calculated as the remaining hours in the rider's scheduled shift based on their registered `shift_pattern`.
- `C_ratio` as a globally configurable parameter (default: **0.85**).

**FR-5.3 — Razorpay Disbursement**
The computed payout amount SHALL be transmitted to the Razorpay Sandbox API via a POST request to `/v1/payouts`. The system SHALL:
1. Receive and validate the Razorpay transaction ID.
2. Update the `claims` table with `status: 'SETTLED'`, `payout_amount`, `razorpay_txn_id`, and `settled_at` timestamp.

**FR-5.4 — Payout Confirmation Notification**
Upon successful Razorpay confirmation, the system SHALL send a rider notification:
> *"✅ ₹[amount] credited to your account. Income protection payout for [date] has been processed."*

**FR-5.5 — Claim Audit Trail**
Every claim settlement SHALL produce an immutable audit record in PostgreSQL containing: `claim_id`, `rider_id`, `zone_id`, `trigger_type`, `di_score_at_trigger`, `payout_amount`, `c_ratio_applied`, `razorpay_txn_id`, `settled_at`.

---

## 4. Actuarial & Mathematical Specifications

All five models are implemented as pure functions within the Node.js backend service layer (`/src/models/`), ensuring testability, versioning, and independent validation.

---

### 4.1 Model 1: Predictive Pricing & Consistency Matrix

**Purpose:** Calculate a dynamic weekly premium percentage that reflects the rider's personal risk exposure, zone-level historical risk, and behavioral consistency.

**Formula:**
```
Premium% = [ P_base + (α · H_risk) + (β · W_risk) + (γ · S_risk) ] × R_geo × C_factor
```

**Variable Definitions:**

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `P_base` | Float | Config | Absolute minimum platform fee percentage (e.g., 1.5%) |
| `α` | Float | Config | Weighting coefficient for hourly exposure risk |
| `H_risk` | Float (0–1) | Platform API [MOCK] | Rider's operational exposure (hours/day normalized) |
| `β` | Float | Config | Weighting coefficient for weather risk |
| `W_risk` | Float (0–1) | Tomorrow.io | Normalized 7-day extreme weather probability for the zone |
| `γ` | Float | Config | Weighting coefficient for social disruption risk |
| `S_risk` | Float (0–1) | PredictHQ | Normalized 7-day social disruption event probability |
| `R_geo` | Float (≥1.0) | PostgreSQL | Zone claim frequency multiplier derived from `zone_disruption_log` |
| `C_factor` | Float | PostgreSQL | Consistency Matrix factor (see below) |

**Consistency Matrix — C_factor Determination:**

| Condition | C_factor Value | Business Rationale |
|-----------|---------------|---------------------|
| `subscription_streak >= 12` | **0.85** | Loyalty discount — rewards long-term commitment |
| `subscription_streak 4–11` | **1.00** | Neutral — standard pricing |
| `subscription_streak 1–3` | **1.20** | New subscriber loading — higher initial risk |
| Opt-out during low-risk week, re-subscribe before high-risk forecast | **≥ 2.5** | Adverse selection tax — mathematically penalizes gaming |

**Adverse Selection Detection Logic:**
```
IF (last_opt_out_week.forecast_risk_level == 'LOW')
AND (current_week.forecast_risk_level IN ['HIGH', 'EXTREME'])
AND (gap_weeks_since_opt_out <= 2)
THEN C_factor = 2.5 + (forecast_risk_level_score * 0.1)
```

---

### 4.2 Model 2: Dynamic Logarithmic Thresholding

**Purpose:** Prevent single or small groups of bad actors from fraudulently triggering zone-wide payouts by requiring a logarithmically scaled number of independent verified reports proportional to the zone's active rider density.

**Formula:**
```
U_min = max( U_base, ⌈ k · ln(N + 1) ⌉ )
```

**Variable Definitions:**

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `U_base` | Integer | 3 | Absolute minimum verified reports required under any zone density |
| `k` | Float | 2.5 | Logarithmic scaling constant (tunable per deployment zone) |
| `N` | Integer | Live query | Count of active premium-paying riders currently within the polygon, queried via `ST_Contains` at report time |

**Example Threshold Values:**

| Active Riders (N) | U_min (k=2.5) | Interpretation |
|-------------------|----------------|----------------|
| 5 | max(3, ⌈2.5 · ln(6)⌉) = **5** | Small zone — 5 verified reports needed |
| 50 | max(3, ⌈2.5 · ln(51)⌉) = **10** | Mid-density zone — 10 reports needed |
| 500 | max(3, ⌈2.5 · ln(501)⌉) = **16** | High-density zone — 16 reports needed |

This logarithmic growth ensures that as zones become more populated (and financially valuable to defraud), the validation bar rises accordingly without becoming prohibitively high.

---

### 4.3 Model 3: Live Disruption Index (DI) Calculator

**Purpose:** Unify heterogeneous environmental and social data streams into a single normalized severity score (0–100) per polygon, enabling a single universal payout threshold regardless of disruption type.

**Formula:**
```
DI = (w₁ · I_weather) + (w₂ · I_traffic) + (w₃ · min(100, U_ratio · 100))
```

**Variable Definitions:**

| Variable | Type | Default Weight | Source | Description |
|----------|------|----------------|--------|-------------|
| `w₁` | Float | 0.45 | Config | Weight assigned to weather severity |
| `I_weather` | Float (0–100) | — | OpenWeatherMap / NASA EONET / USGS | Normalized weather severity score |
| `w₂` | Float | 0.35 | Config | Weight assigned to traffic disruption |
| `I_traffic` | Float (0–100) | — | TomTom Traffic API | Normalized traffic congestion score |
| `w₃` | Float | 0.20 | Config | Weight assigned to crowdsource signal |
| `U_ratio` | Float (0–1) | — | PostgreSQL | Ratio of verified reports to `U_min`: `verified_count / U_min` |

**Constraint:** `w₁ + w₂ + w₃ = 1.0` (must sum to unity at all times).

**Payout Trigger:** `DI >= 75` initiates the Stage 4A settlement pipeline for the affected polygon.

**Override Condition:** When crowdsourced reports reach `U_min`, `U_ratio = 1.0`, which sets `w₃ · min(100, 1.0 · 100) = 20`. Combined with any non-zero weather/traffic baseline (minimum typically 5–10 for a genuinely disruptive day), the DI reliably crosses 75 to trigger settlement.

---

### 4.4 Model 4: Payout Compensation Formula

**Purpose:** Calculate the precise income replacement amount for each qualifying rider, incorporating a coverage ratio that maintains the economic incentive to work when conditions are safe.

**Formula:**
```
Payout (INR) = E_avg × H_lost × C_ratio
```

**Variable Definitions:**

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `E_avg` | Float (INR/hr) | Platform API / Policy record [MOCK] | Rider's average net hourly earnings, established at onboarding |
| `H_lost` | Float (hours) | Policy record + system clock | Remaining hours in the rider's registered shift pattern at payout trigger time |
| `C_ratio` | Float (0.0–1.0) | Config (default: 0.85) | Coverage ratio — caps payout at 85% of equivalent earned income to prevent moral hazard |

**Moral Hazard Control:** By setting `C_ratio < 1.0`, the formula ensures the payout is always less than what the rider would earn by continuing to work. This prevents deliberately staying idle during minor disruptions to collect payouts.

**H_lost Calculation:**
```
H_lost = max(0, registered_shift_end_time - event_trigger_time) in decimal hours
```

---

### 4.5 Model 5: Haversine Velocity Calculation (The Speed Trap)

**Purpose:** Detect GPS spoofing and VPN-based fake location submission by verifying that successive GPS coordinates represent a physically plausible movement given elapsed time.

**Formula:**
```
d = 2R · arcsin( √[ sin²((lat₂-lat₁)/2) + cos(lat₁)·cos(lat₂)·sin²((lon₂-lon₁)/2) ] )
Velocity (km/h) = d / ((t₂ - t₁) / 3600)
```

Where `R = 6371 km` (Earth's mean radius).

**Variable Definitions:**

| Variable | Description |
|----------|-------------|
| `(lat₁, lon₁, t₁)` | Previous GPS ping coordinates and Unix timestamp (retrieved from `rider_pings` table) |
| `(lat₂, lon₂, t₂)` | Report submission coordinates and Unix timestamp |
| `d` | Great-circle distance in kilometers |
| `Velocity` | Computed speed in km/h |

**Rejection Threshold:** `Velocity > 80 km/h` → Request rejected (HTTP 422) and logged as `VELOCITY_VIOLATION`.

**Rationale for 80 km/h Limit:** Urban Indian delivery zones have typical maximum vehicle speeds of 40–60 km/h. An 80 km/h threshold accommodates measurement GPS precision errors while firmly rejecting teleportation-indicating spoofed coordinates.

---

## 5. External Interface Requirements

### 5.1 User Interface Requirements

| Component | Technology | Requirement |
|-----------|-----------|-------------|
| **Application Shell** | React.js 18 | SPA rendered inside partner app WebView |
| **Styling System** | Tailwind CSS 3.x | Mobile-first responsive layout, min-width 320px |
| **Zone Visualization** | Leaflet.js + `react-leaflet` + OpenStreetMap tiles | Interactive GeoJSON polygon rendering with live DI heatmap color overlay; no API key required |
| **Manual Zone Picker** | Leaflet.js + `react-leaflet` | Polygon click-selection over OSM tiles for onboarding fallback (FR-1.6); fully open-source |
| **Premium Display Card** | React component | Weekly premium breakdown, streak status, C_factor indicator |
| **Disruption Reporter** | React component | Live camera feed only; no gallery access permitted |
| **Payout Ledger View** | React component | Chronological history of claims, payouts, and premium deductions |

**UI Response Time Requirement:** All UI interactions after initial load SHALL respond within **200ms** for local state changes and **3 seconds** for API-dependent data loads. Loading states SHALL be displayed immediately upon any API call initiation.

---

### 5.2 Hardware Interface Requirements

**HW-1: Camera (Disruption Reporting)**
- Interface: `MediaDevices.getUserMedia({ video: { facingMode: "environment" } })`
- Requirement: Rear-facing camera MUST be used. Gallery access MUST be blocked at the API level, not merely UI level.
- Resolution: Minimum 720p capture for adequate CLIP classification accuracy.

**HW-2: GPS (Location Services)**
- Interface: `navigator.geolocation.getCurrentPosition()` with `enableHighAccuracy: true`
- Requirement: GPS precision MUST achieve ≤30 meter accuracy for valid Haversine Speed Trap computation.
- Timeout: If a GPS fix is not achieved within 10 seconds, the report SHALL be rejected with a user-visible error.

---

### 5.3 Software Interface Requirements

#### 5.3.1 PostgreSQL + PostGIS Database Interface
- **Connection:** `pg` Node.js driver with `pg-pool` connection pooling (max 20 connections).
- **Spatial Functions Utilized:** `ST_Contains`, `ST_SetSRID`, `ST_MakePoint`, `ST_Distance`, `ST_Intersects`.
- **Indexing Requirement:** All zone geometry columns MUST have a GiST spatial index created: `CREATE INDEX ON zones USING GIST(geom);`
- **Query Performance SLA:** `ST_Contains` queries across 1,000 concurrent rider points MUST complete in under **100ms**.

#### 5.3.2 Python/FastAPI AI Microservice Interface
- **Endpoint:** `POST /validate-img`
- **Request Schema:**
  ```json
  {
    "image_b64": "<base64-encoded-jpeg>",
    "rider_id": "string",
    "zone_id": "string",
    "timestamp": "ISO8601"
  }
  ```
- **Response Schema:**
  ```json
  {
    "clip_classification": "flood|protest|blockage|normal",
    "clip_confidence": 0.87,
    "moire_detected": false,
    "moire_confidence": 0.12,
    "verdict": "APPROVED|REJECTED",
    "rejection_reason": "null|LOW_CLIP_SCORE|MOIRE_DETECTED"
  }
  ```
- **Performance SLA:** The `/validate-img` endpoint SHALL return a response within **2 seconds** for standard JPEG images (≤2MB).

#### 5.3.3 External Third-Party API Interfaces

| API | Authentication | Key Header | Rate Limit Buffer | Fallback Strategy |
|-----|----------------|------------|-------------------|-------------------|
| OpenWeatherMap | API Key | `appid` query param | 60 req/min | Cache last successful response for 15 min |
| Tomorrow.io | API Key | `apikey` query param | 25 req/hr (free tier) | Reuse cached zone forecast |
| TomTom Traffic | API Key | `key` query param | 250 req/day | Interpolate from previous call |
| PredictHQ | Bearer Token | `Authorization: Bearer` | 1,000 req/mo | Gracefully skip `S_risk` (set to 0.0) |
| NASA EONET | None (Public) | — | No hard limit | — |
| USGS | None (Public) | — | No hard limit | — |
| NewsAPI | API Key | `X-Api-Key` header | 100 req/day (dev) | Gracefully skip news component |
| Razorpay Sandbox | Key ID + Secret | HTTP Basic Auth | No limit (sandbox) | Retry 3x with exponential backoff |
| Mock Partner API | Internal Secret | `X-Mock-Secret` header | No limit (internal) | N/A |

#### 5.3.4 Leaflet.js + OpenStreetMap Interface
- Loaded via the `react-leaflet` npm package (wrapper around Leaflet.js v1.9+).
- **No API key or authentication required.** Map tiles are served by OpenStreetMap's public HTTPS tile endpoint: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
- Zone polygons are rendered as GeoJSON `<Polygon>` components with dynamic `fillColor` and `fillOpacity` values derived from the zone's current DI score (green → yellow → red gradient).
- The `react-leaflet` `<GeoJSON>` layer component handles all polygon click events for the manual zone picker fallback (FR-1.6).
- **Attribution:** OpenStreetMap tile usage requires the attribution string `© OpenStreetMap contributors` to be rendered on the map, which `react-leaflet` handles automatically.

---

### 5.4 Communications Interface Requirements

**C-1: Transport Security**
All external HTTP traffic SHALL use HTTPS with TLS 1.2 or higher. HTTP connections SHALL be rejected at the load balancer level.

**C-2: API Communication Format**
All internal service-to-service communication (Node.js ↔ FastAPI) SHALL use JSON-encoded REST over HTTPS.

**C-3: Authentication**
- Client → Express.js: JWT bearer tokens (issued by the partner application, validated by WorkSafe middleware).
- Express.js → FastAPI: Internal service token passed via `X-Internal-Token` header.
- Express.js → External APIs: API keys stored in environment variables; never exposed to the frontend.

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

**NFR-1: API Polling Concurrency**
The 15-minute `node-cron` polling loop SHALL complete the full fetch-normalize-compute cycle across all active polygons within **30 seconds** using `Promise.all` concurrent API batching.

**NFR-2: End-to-End Payout Latency**
From the moment a DI threshold breach is detected to the moment the Razorpay payout confirmation is received, the total elapsed time SHALL NOT exceed **5 seconds** under normal system load.

**NFR-3: Fraud Rejection Latency**
Haversine Speed Trap validation (Fraud Gate 2) SHALL complete and return a response within **500ms** of receiving the report request.

**NFR-4: Image Validation Latency**
The Python FastAPI `/validate-img` endpoint SHALL return a CLIP + OpenCV verdict within **2 seconds** for images up to 2MB.

**NFR-5: PostGIS Query Performance**
`ST_Contains` rider cohort identification queries SHALL execute within **100ms** for a dataset of up to 10,000 concurrent `active_sessions` rows.

**NFR-6: Frontend Initial Load**
The React micro-frontend bundle SHALL load and render an interactive initial state within **3 seconds** on a 4G mobile connection (10 Mbps downlink).

---

### 6.2 Security Requirements

**NFR-7: JWT Validation**
Every API request to the Express.js backend originating from the frontend SHALL carry a valid JWT. Requests with missing, expired, or malformed tokens SHALL receive HTTP 401 and be logged.

**NFR-8: Environment Variable Security**
All API keys, database credentials, and service tokens SHALL be stored exclusively in server-side environment variables. No secret value SHALL be embedded in source code, committed to version control, or transmitted to the frontend.

**NFR-9: Gallery Upload Prevention**
The system SHALL enforce live-camera-only capture at the API level (not just UI). The Express.js image ingestion endpoint SHALL reject any image submission that lacks EXIF metadata consistent with a live camera device capture.

**NFR-10: Fraud Log Integrity**
All fraud gate rejections (velocity violations, Moiré detections, low CLIP scores) SHALL be written to an immutable `fraud_log` PostgreSQL table with `rider_id`, `timestamp`, `gate_type`, and `rejection_reason`. Log entries SHALL NOT be deletable via application-layer APIs.

**NFR-11: SQL Injection Prevention**
All database queries SHALL use parameterized statements. String interpolation in SQL queries is RESTRICTED.

---

### 6.3 Reliability & Availability Requirements

**NFR-12: Crowdsource Continuity**
In the event that all external weather and traffic APIs are simultaneously unavailable, the crowdsourced disruption reporting pipeline (Stage 4B) SHALL remain fully operational, ensuring the system can still trigger payouts via verified human reports.

**NFR-13: Payment Retry Resilience**
In the event of a Razorpay API timeout or failure during payout, the system SHALL retry the call up to 3 times with exponential backoff (2s, 4s, 8s). Claims that fail all retries SHALL be marked `status: 'SETTLEMENT_FAILED'` and the operations team notified via an internal alert.

**NFR-14: Cron Job Failure Alerting**
If either `node-cron` job (premium calculation or zone polling) fails to complete successfully, the system SHALL log the failure with full stack trace and queue an internal alert notification.

---

### 6.4 Maintainability Requirements

**NFR-15: Mathematical Model Isolation**
All five mathematical models (Section 4) SHALL be implemented as isolated, independently testable pure functions in `/src/models/`. No model function SHALL have direct database or API dependencies — inputs SHALL be passed as arguments.

**NFR-16: ML Service Replaceability**
The Python FastAPI AI service SHALL be fully decoupled from the Node.js backend via a REST interface. Upgrading CLIP model versions or switching to a custom-trained image classifier MUST NOT require any changes to the backend business logic.

**NFR-17: Configuration-Driven Parameters**
All model coefficients (`α`, `β`, `γ`, `w₁`, `w₂`, `w₃`, `C_ratio`, `U_base`, `k`, DI threshold, velocity threshold) SHALL be stored in a dedicated configuration file or environment variables, enabling actuarial tuning without code changes.

---

## 7. System Architecture & Technology Stack

### 7.1 Architectural Overview

WorkSafe adopts a **decoupled event-driven microservices architecture** composed of four independent layers, each optimized for its specific computational responsibility:

```
┌────────────────────────────────────────────────────────────────┐
│                    DELIVERY PARTNER DEVICE                      │
│    React.js SPA (Tailwind + Leaflet.js + OpenStreetMap)        │
│    WebView embedded in Zomato/Swiggy Partner App               │
└────────────────────┬──────────────────────────────────────────-┘
                     │ HTTPS/JWT
┌────────────────────▼──────────────────────────────────────────-┐
│                  NODE.JS / EXPRESS.JS BACKEND                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  REST API    │  │  node-cron   │  │  Math Model Engine  │  │
│  │  Gateway     │  │  Scheduler   │  │  (Models 1,3,4,5)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬──────┘  │
└──────── ┼─────────────────┼─────────────────────────┼─────────┘
          │                 │                           │
   ┌──────▼────────────┐   │    ┌──────────────────────▼──────┐
   │ PostgreSQL+PostGIS│◄──┘    │  Python / FastAPI           │
   │ (Spatial Ledger) │        │  ML Microservice             │
   │ Policies, Claims  │        │  (CLIP + OpenCV)            │
   │ Zones, Riders     │        └─────────────────────────────┘
   └───────────────────┘
          │
   ┌──────▼───────────────────────────────────────────────────┐
   │  EXTERNAL APIs                                            │
   │  OpenWeatherMap │ Tomorrow.io │ TomTom │ PredictHQ       │
   │  NASA EONET │ USGS │ NewsAPI │ Razorpay Sandbox          │
   │  Mock Partner API [MOCK]                                 │
   └──────────────────────────────────────────────────────────┘
```

### 7.2 Layer Specifications

| Layer | Technology | Key Responsibility |
|-------|-----------|-------------------|
| **Frontend** | React.js 18 + Tailwind CSS + Leaflet.js (`react-leaflet`) + OpenStreetMap | User interface, WebView camera/GPS access, zone rendering — 100% open-source, no API key required |
| **API Gateway** | Node.js 20 + Express.js 4 | Request routing, JWT validation, business rule enforcement |
| **Scheduler** | node-cron v3 | Premium calculation cycles (weekly), zone polling loops (15-min) |
| **Math Engine** | Node.js service layer `/src/models/` | Models 1, 2, 3, 4, 5 computation |
| **Geospatial Database** | PostgreSQL 15 + PostGIS 3.3 | Zone storage, rider geofencing, claim ledger, audit trails |
| **AI/Vision Microservice** | Python 3.11 + FastAPI + HuggingFace + OpenCV | Image classification (CLIP) + Moiré fraud detection |
| **Payment Rails** | Razorpay Sandbox API | Simulated payout disbursement |
| **Mock Partner API** | Express.js mock server | Simulates Zomato/Swiggy partner endpoints [MOCK] |

---

## 8. Data Dictionary & Schema Definitions

### 8.1 Core Database Tables

**`riders`**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `rider_id` | UUID | PK | Unique rider identifier |
| `platform_rider_id` | VARCHAR(100) | UNIQUE | Partner platform's native rider ID |
| `e_avg` | DECIMAL(10,2) | NOT NULL | Average hourly earnings (INR) |
| `shift_pattern` | JSONB | NOT NULL | `{ start: "09:00", end: "21:00" }` |
| `manual_baseline` | BOOLEAN | DEFAULT false | Flag for self-declared income |
| `created_at` | TIMESTAMPTZ | NOT NULL | Registration timestamp |

**`zones`**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `zone_id` | VARCHAR(50) | PK | Zone identifier (e.g., `Zone_Koramangala`) |
| `city` | VARCHAR(100) | NOT NULL | City name |
| `geom` | GEOMETRY(Polygon, 4326) | NOT NULL | PostGIS polygon geometry (WGS 84) |
| `risk_multiplier` | DECIMAL(4,2) | DEFAULT 1.00 | `R_geo` value from historical claims |

**`policies`**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `policy_id` | UUID | PK | Unique policy record |
| `rider_id` | UUID | FK → riders | Policyholder reference |
| `zone_id` | VARCHAR(50) | FK → zones | Primary insured zone |
| `status` | ENUM | `('ACTIVE','PAUSED','CANCELLED')` | Current policy state |
| `subscription_streak` | INTEGER | DEFAULT 0 | Consecutive weeks subscribed |
| `c_factor` | DECIMAL(4,2) | NOT NULL | Current Consistency Matrix value |
| `last_premium_amount` | DECIMAL(10,2) | | Last week's charged premium (INR) |
| `created_at` | TIMESTAMPTZ | NOT NULL | Policy creation timestamp |

**`disruption_events`**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `event_id` | UUID | PK | Unique event record |
| `zone_id` | VARCHAR(50) | FK → zones | Affected zone |
| `trigger_type` | ENUM | `('API','CROWDSOURCE')` | How the event was triggered |
| `di_score` | DECIMAL(5,2) | NOT NULL | DI value at trigger (75–100) |
| `triggered_at` | TIMESTAMPTZ | NOT NULL | Event trigger timestamp |
| `status` | ENUM | `('PENDING_SETTLEMENT','SETTLED','FAILED')` | Settlement state |

**`claims`**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `claim_id` | UUID | PK | Unique claim record |
| `rider_id` | UUID | FK → riders | Claimant reference |
| `event_id` | UUID | FK → disruption_events | Triggering event |
| `payout_amount` | DECIMAL(10,2) | NOT NULL | Computed payout (INR) |
| `c_ratio_applied` | DECIMAL(3,2) | NOT NULL | Coverage ratio used |
| `h_lost` | DECIMAL(4,2) | NOT NULL | Hours compensated |
| `razorpay_txn_id` | VARCHAR(100) | | Payment reference |
| `status` | ENUM | `('SETTLED','FAILED','PENDING')` | Claim status |
| `settled_at` | TIMESTAMPTZ | | Settlement timestamp |

---

## 9. Error Handling & Exception Management

### 9.1 External API Failure Handling

| Scenario | System Response |
|----------|----------------|
| Weather API timeout (>5s) | Cache last successful response; proceed polling with stale data; log warning |
| TomTom API rate limit (429) | Implement exponential backoff; skip I_traffic for affected zone in that cycle |
| NASA/USGS unavailable | Proceed without macro disaster input; DI calculation continues with weather + traffic only |
| Razorpay payout failure | Retry 3× with exponential backoff; mark claim `SETTLEMENT_FAILED`; trigger internal alert |
| Partner API failure (MOCK) | Trigger manual onboarding fallback (FR-1.6); log to `api_error_log` |

### 9.2 Fraud Gate Rejection Codes

| Code | Gate | HTTP Status | Description |
|------|------|-------------|-------------|
| `VELOCITY_VIOLATION` | Gate 2 | 422 | GPS coordinates imply physically impossible movement |
| `LOW_CLIP_SCORE` | Gate 3 | 422 | Image classification confidence below 0.65 threshold |
| `MOIRE_DETECTED` | Gate 3 | 422 | Screen-capture artifact detected in submitted image |
| `THRESHOLD_NOT_MET` | Gate 4 | 202 | Report accepted but `U_min` not yet reached |
| `DUPLICATE_REPORT` | Dedup | 429 | Rider already submitted a report within the 4-hour window |

### 9.3 System-Level Errors

| Error Type | Handling Strategy |
|-----------|-------------------|
| `node-cron` job failure | Log full stack trace; trigger internal alert; attempt re-run at next scheduled interval |
| PostgreSQL connection pool exhaustion | Return HTTP 503 with `Retry-After: 30` header; log pool metrics |
| PostGIS spatial query timeout | Return HTTP 504; log query plan via `EXPLAIN ANALYZE`; notify DBA |
| Python FastAPI unreachable | Return HTTP 503 to client; log service health failure; disable crowdsource reporting temporarily |

---

## 10. Constraints, Risks & Mitigations

| Constraint / Risk | Category | Mitigation |
|-------------------|----------|-----------|
| No live Zomato/Swiggy API access | Integration | Mock server built with identical API contract for seamless future migration |
| Tomorrow.io free tier: 25 req/hr | Rate Limiting | Batch zone forecasts into single radius queries; cache 7-day outlook for 6 hours |
| NewsAPI: 100 req/day (developer tier) | Rate Limiting | Persistent 6-hour headline cache per city; reduce to one fetch per polling cycle |
| CLIP inference latency on CPU | Performance | Run `openai/clip-vit-base-patch32` (smallest variant); batch images if concurrent reports arrive |
| GPS accuracy on low-end Android devices | Fraud Detection | Accept 30m GPS tolerance; flag reports with `accuracy > 50m` for manual review |
| Razorpay Sandbox limitations | Payment | Fully adequate for hackathon demo; production migration to live keys is a configuration-only change |
| PostGIS cold start on unindexed geometries | Performance | GiST index creation is a deployment prerequisite; documented in setup instructions |

---

*This document represents the complete technical specification for WorkSafe v2.0.0 as submitted to the DEVTrails 2026 hackathon by Team UnderDogs. All mathematical models, architectural decisions, and interface specifications herein are finalized and reflect the implemented system.*
