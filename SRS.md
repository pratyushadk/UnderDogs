# Software Requirements Specification (SRS)
## System: WorkSafe – AI-Powered Parametric Income Protection for Gig Workers
**Version:** 1.0.0
**Date:** April 4, 2026
**Prepared by:** Pratyush Adhikari

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) provides an exhaustive operational and architectural blueprint for the **WorkSafe** platform, an AI-powered parametric income protection system designed exclusively for the Indian gig economy. This document strictly delineates the system's requirements, mathematical actuarial logic, anti-fraud mechanisms, and decoupled Node.js/Python architecture to guide development, integration, and platform scaling for the DEVTrails 2026 hackathon.

### 1.2 Document Conventions
- **MUST / SHALL**: Defines mandatory system requirements.
- **SHOULD**: Defines highly recommended functions, dependent on API rate limits.
- **RESTRICTED**: Marks operations explicitly forbidden within the scope of the project.
- **PostGIS / Geometric References**: Refers to SRID 4326 (WGS 84) for geographical coordinates.
- **Currency**: All financial values assume INR (₹) for simulation and scaling.

### 1.3 Intended Audience
This document is prepared for:
- Development Teams (Node.js/Express, Python/FastAPI, React.js engineers).
- Data Scientists and Actuaries (managing the spatial DB and predictive models).
- B2B Integration Partners (e.g., Zomato, Zepto product teams integrating the B2B2C tab).
- DEVTrails 2026 Judging Panel validating the technical robustness and architectural maturity.

### 1.4 System Scope
**WorkSafe** is a B2B2C integration platform providing parametric insurance for **Loss of Income only**. It serves platform-based delivery partners by monitoring real-time environmental, infrastructural, and social disruptions and executing zero-touch claim settlements.
**Strict Exclusions:** The platform is explicitly restricted from and SHALL NOT process claims for health, medical emergencies, life adjustments, or vehicle repairs. It operates as a Rolling Weekly Subscription model directly tied to the gig worker's financial payout cycle.

### 1.5 Glossary
- **B2B2C**: Business-to-Business-to-Consumer integration.
- **Parametric Insurance**: Insurance that pays out upon the occurrence of a triggering event (index), avoiding traditional claims adjusting.
- **Polygon/Zone**: A PostGIS geometric representation of a delivery sector.
- **DI (Disruption Index)**: A calculated metric (0-100) determining the severity of external events affecting a polygon.
- **Adverse Selection**: The tendency of higher-risk individuals to secure insurance more frequently, heavily mitigated by the Consistency Matrix.
- **Moiré Pattern**: Visual artifacts resulting from taking a digital photograph of a digital screen.

---

## 2. Overall Description

### 2.1 Product Perspective
WorkSafe is not a standalone mobile application. It is strategically architected as a B2B2C micro-frontend (React.js tab) designed to be natively embedded within existing partner delivery ecosystems (e.g., Zomato Partner App). It relies on a decoupled microservices backend (Node.js API gateway, Python ML service) and interacts directly with the partner's internal data ledgers for premium collection and payout distribution.

### 2.2 User Characteristics
**Delivery Partners (End-Users):**
- High operational exposure to external weather/social events.
- Typically utilize lower-to-mid-tier Android mobile devices.
- Operate on a weekly earning/payout schedule.
- Low tolerance for bureaucratic friction; require a "zero-touch" claims experience.

### 2.3 Operating Environment
- **Client Deployment**: Mobile-responsive web view embedded within a host native application (Android/iOS).
- **Backend Deployment**: Containerized Node.js/Express environment capable of robust horizontal scaling and heavy asynchronous API orchestration.
- **Database Environment**: PostgreSQL instance equipped with the PostGIS extension optimized for high-volume `ST_Contains` spatial queries.
- **ML Environment**: Isolated Python/FastAPI container executing GPU-accelerated (or heavily optimized CPU) inference for Hugging Face CLIP and OpenCV.

### 2.4 Assumptions and Dependencies
- **Platform API Availability (Mock Data Required)**: Currently, direct access to partner internal APIs (e.g., Zomato, Swiggy) is unavailable. The project operates under the assumption that **mock APIs** will simulate these endpoints for fetching rider baselines ($E_{avg}$) and executing ledger deductions/credits. Wherever live external API access is restricted during the hackathon, mock services will be actively utilized as fallbacks to ensure unhindered system execution.
- **External Data Reliability**: Relies on the high availability and accuracy of third-party oracles (OpenWeatherMap, Tomorrow.io, TomTom, PredictHQ).
- **Device Capabilities**: Assumes target devices have functional cameras and GPS sensors compliant with HTML5 `navigator.geolocation` and `MediaDevices.getUserMedia()`.

---

## 3. System Features (Functional Requirements)

The system is categorized into 5 core automated stages.

### 3.1 Stage 1: Frictionless Onboarding & Data Sync
**Description:** The automated ingestion of a delivery partner into the risk pool via the B2B2C integration.
- **Primary Flow:**
  1. User navigates to the embedded "Income Protection" tab.
  2. Node.js backend executes an OAuth-secured call to the partner API to fetch rider metrics: Primary Hub (GeoJSON), Average Hours, and Financial Baseline ($E_{avg}$).
  3. Frontend renders the metrics and a mandated consent dialog emphasizing "Loss of Income Only" scope.
  4. User accepts the Rolling Weekly Subscription.
- **Alternate Flow:** Partner API fails or returns incomplete data. The system alerts the user and prompts a manual hub selection via Mapbox GL JS.

### 3.2 Stage 2: Financial Engine (Premium Calculation)
**Description:** The weekly calculation and deduction of dynamic premiums.
- **Primary Flow:**
  1. A `node-cron` job triggers routinely (e.g., Saturday 11:00 PM).
  2. Node.js assesses upcoming 7-day weather/social APIs (Tomorrow.io, PredictHQ) and computes the premium utilizing **Model 1**.
  3. The backend calculates the $C_{factor}$ based on the rider's subscription streak to penalize adverse selection.
  4. An asynchronous push notification is queued. If the user does not opt-out within 24 hours, the premium is committed to the PostgreSQL ledger and deducted from the platform payout.

### 3.3 Stage 3: Concurrent Active Polygon Monitoring
**Description:** Real-time polling of all geographic zones.
- **Primary Flow:**
  1. A 15-minute `node-cron` loop initiates.
  2. The Express.js orchestrator fetches localized data from OpenWeatherMap and TomTom Traffic for all active SRID 4326 polygons.
  3. The system maps severity to a 0-100 scale, executing **Model 3** to establish the Live Disruption Index (DI).
  4. If $DI \geq 75$, Stage 4 is triggered for that specific polygon.

### 3.4 Stage 4: Disruption Event & AI Fallback (Fraud Defense)
**Description:** The validation of disruption events and crowdsourced reporting mechanisms.
- **Primary Flow (API Trigger):**
  1. Real-time DI hits $\geq 75$.
  2. Express.js triggers a PostGIS spatial query (`ST_Contains`) isolating all active riders within the affected polygon.
  3. The impacted cohort is passed to the Settlement queue.
- **Alternate Flow (Crowdsourced Fallback / Zero API Reporting):**
  1. APIs fail to detect a localized disruption (e.g., sudden undocumented protest).
  2. Rider initiates a "Report Disruption" via the React app.
  3. **Fraud Gate 1:** The app enforces `getUserMedia()` preventing gallery uploads.
  4. **Fraud Gate 2:** The Node.js server executes **Model 5** (Haversine Speed Trap) ensuring the coordinates do not indicate GPS spoofing.
  5. **Fraud Gate 3:** Image is routed to the Python FastAPI microservice. CLIP verifies context (e.g., "flood", "barricade"); OpenCV scans for Moiré artifacts.
  6. **Fraud Gate 4:** The system applies **Model 2** (Logarithmic Thresholding). If verified reports reach $U_{min}$, the entire zone's DI is overridden to 100.

### 3.5 Stage 5: Automated Payout Settlement
**Description:** Zero-touch computation and distribution of claims.
- **Primary Flow:**
  1. Polygon enters verified disruption state.
  2. Node.js backend pushes a "Safety Halt Directive" to riders.
  3. System executes **Model 4** substituting the rider's baseline $E_{avg}$, remaining shift hours ($H_{lost}$), and the coverage ratio ($C_{ratio}$).
  4. Payout is dispatched via the Razorpay Sandbox API.
  5. PostgreSQL status for the shift is marked as "Settled".

---

## 4. Actuarial & Mathematical Specifications

The architecture mandates the strict execution of these 5 mathematical models located primarily in the Node.js backend.

### 4.1 Model 1: Predictive Pricing & Consistency Matrix
Calculates the dynamic weekly premium.
**Formula:**
`Premium% = [ P_base + (\alpha * H_risk) + (\beta * W_risk) + (\gamma * S_risk) ] * R_geo * C_factor`
- **Variables:**
  - `P_base`: Static minimum operational fee.
  - `H_risk`: Rider's operational exposure vector.
  - `W_risk`, `S_risk`: Disruption probabilities scaled from Tomorrow.io/PredictHQ.
  - `R_geo`: Geographic risk multiplier based on historical payload claims.
  - `C_factor`: Consistency Matrix Penalty. If streak > 12 weeks, $C_{factor} = 0.85$. If adverse dropping/re-adding detected, $C_{factor} \geq 2.5$.

### 4.2 Model 2: Dynamic Logarithmic Thresholding
Dictates the required number of crowdsourced reports to trigger a payout independently of external APIs.
**Formula:**
`U_min = max( U_base, ceil(k * ln(N + 1)) )`
- **Variables:**
  - `U_base`: Hardcoded minimum validation count.
  - `k`: Tunable scaling constant.
  - `N`: Live density of active premium-holding riders dynamically queried via PostGIS.

### 4.3 Model 3: Live Disruption Index (DI) Calculator
Normalizes telemetry into a unified 0-100 index.
**Formula:**
`DI = (w1 * I_weather) + (w2 * I_traffic) + (w3 * min(100, U_ratio * 100))`
- **Variables:**
  - `I_weather`, `I_traffic`: Normalized API metrics (0-100).
  - `U_ratio`: Verified crowdsource count divided by `U_min`.
  - `w1, w2, w3`: Configurable weight parameters totaling 1.0.

### 4.4 Model 4: Payout Compensation Formula
Calculates actual liability payouts.
**Formula:**
`Payout = E_avg * H_lost * C_ratio`
- **Variables:**
  - `E_avg`: Rider's average hourly network earnings.
  - `H_lost`: Pro-rated remaining hours of the rider's standard shift configuration.
  - `C_ratio`: Coverage Ratio to prevent moral hazard (ensuring payout is marginally less than working, e.g., 0.85).

### 4.5 Model 5: Haversine Velocity Calculation (The Speed Trap)
Establishes geographical viability of successive claims to prevent VPN/Mock Location spoofing.
**Formula:**
`Velocity = Haversine(lat1, lon1, lat2, lon2) / (t2 - t1)`
- **Execution:** Node.js executes this physics engine. If `Velocity` exceeds urban maximal transport speeds (e.g., > 80 km/h), the request is rejected as fraudulent.

---

## 5. External Interface Requirements

### 5.1 User Interfaces
- **Framework:** React.js paired with Tailwind CSS.
- **Component Requirements:** A mobile-first, B2B2C modal encapsulating Onboarding, Premium Ledger, Active Monitoring (Mapbox GL JS rendering active GeoJSON target zones), and the Disruption Reporting camera interface.

### 5.2 Hardware Interfaces
- **Camera:** HTML5 MediaDevices API locked to environmental capture; strict disabling of filesystem file-pickers.
- **GPS:** HTML5 Geolocation API with high-accuracy parameters enforced to feed the Haversine Speed Trap.

### 5.3 Software Interfaces
- **Database:** PostgreSQL (v13+) optimized with PostGIS for native processing of `ST_Contains`, `ST_Intersects`, and `ST_Distance`.
- **Python ML Microservice:** RESTful FastAPI layer exposing `/validate-img` consuming base64/binary image payloads, returning CLIP classifications and Moiré confidence scores.
- **External Data Providers:**
  - **OpenWeatherMap / Tomorrow.io**: Standard weather ingestion.
  - **NASA EONET / USGS**: Absolute disaster failsafes triggering auto DI=100.
  - **TomTom Traffic API**: Secondary marker for unmapped social disruption.
  - **PredictHQ / NewsAPI**: Social disruption forecasting algorithms.
  - **Razorpay Sandbox API**: Financial settlement execution.
  - **Delivery Partner API (Mocked)**: Because direct access to platforms like Zomato/Swiggy is unavailable, a suite of robust mock APIs will purposefully simulate B2B endpoints for fetching onboarding rider metrics and initiating payroll ledger deductions.

### 5.4 Communications Interfaces
- **HTTPS/TLS 1.2+**: Mandatory for all node-to-node and client-to-node traffic.
- **JSON REST APIs**: Standardized communication medium internally and externally.

---

## 6. Non-Functional Requirements

### 6.1 Performance and Scalability
- **Node.js Concurrency:** The 15-minute polling loop (`node-cron`) SHALL utilize `Promise.all` and asynchronous streaming architectures to concurrently parse hundreds of discrete API requests without thread blocking.
- **Spatial Offloading:** Node.js MUST NOT perform memory-intensive spatial geometry checks; all geometric validations must be pushed directly to PostGIS via optimized query formulations.

### 6.2 Security Requirements
- **JWT Authentication:** Strict token issuance verifying the rider's identity passed natively from the parent application ecosystem.
- **Anti-Fraud Protocols:** Multi-tier validation via OS mock-location checks, Haversine checks, OpenCV Moiré pattern checks, and the Consistency Matrix penalty. Total repudiation of spoofed payloads must occur within < 1200ms.

### 6.3 Reliability & Availability
- Designed for high availability during extreme weather events. The use of decoupled crowdsourced fallbacks ensures that API downtime (e.g., Weather API outages) does not suspend the system's ability to trigger disruption events based on localized uploads.

### 6.4 Maintainability
- The separation of the Express.js business gateway from the computationally heavy Python ML layer ensures modular updates. Machine learning models can be subbed or retrained without risking the integrity of the transactional database or financial payout loops.

---

## 7. System Architecture & Tech Stack Details

The WorkSafe platform adopts a decoupled, event-driven microservices pattern highly suitable for transactional scale:

1. **Frontend Presentation (React.js + Tailwind + Mapbox):**
   - Embedded natively. Manages state and securely proxies hardware constraints (Camera/GPS).
2. **Business & Financial Gateway (Node.js + Express.js):**
   - Acts as the central orchestrator. Houses the execution logic for Math Models 1, 3, 4, and 5.
   - Manages asynchronous event loops utilizing `node-cron` for periodic fetching and triggers.
3. **Geospatial Ledger (PostgreSQL + PostGIS):**
   - Stores operational profiles, financial transaction states, and topological polygon parameters representing operational zones.
4. **AI/Vision Microservice (Python + FastAPI):**
   - Utilitarian container hosting the Hugging Face `CLIP` inference engine and `OpenCV` filters specifically tailored for fraudulent imagery assessment.
