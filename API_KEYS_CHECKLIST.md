# WorkSafe — API Keys Acquisition Checklist
**Team:** UnderDogs | **Project:** DEVTrails 2026
> Use this checklist to divide account creation tasks across team members and populate the `.env` file.
> Mark each checkbox as you complete signup and add the key to `.env`.

---

## 🌦️ Weather & Environmental Data

---

### ☐ 1. OpenWeatherMap
- **Purpose:** Fetches real-time rainfall, temperature, and severe weather alert data per city zone during the 15-minute DI polling loop.
- **Key Type:** Single API Key
- **Direct Link:** https://home.openweathermap.org/users/sign_up
- **`.env` Variable:**
```
OPENWEATHERMAP_API_KEY=your_key_here
```

---

### ☐ 2. Tomorrow.io
- **Purpose:** Provides hyper-local, 7-day predictive weather forecasts used in the Saturday `node-cron` premium calculation cycle (Model 1).
- **Key Type:** Single API Key
- **Direct Link:** https://app.tomorrow.io/signup
- **`.env` Variable:**
```
TOMORROW_IO_API_KEY=your_key_here
```

---

## 🚗 Traffic & Infrastructure Data

---

### ☐ 3. TomTom Traffic API
- **Purpose:** Tracks real-time traffic speed and flow per zone as a proxy for unmapped social disruptions (protests, curfews) within the Live Disruption Index (Model 3).
- **Key Type:** Single API Key
- **Direct Link:** https://developer.tomtom.com/user/register
- **`.env` Variable:**
```
TOMTOM_API_KEY=your_key_here
```

---

## 📅 Social & Event Disruption Intelligence

---

### ☐ 4. PredictHQ
- **Purpose:** Supplies structured data on scheduled events (political rallies, planned protests) to pre-inform Model 1's `S_risk` component during weekly premium calculations.
- **Key Type:** Access Token (Bearer Token in Authorization header)
- **Direct Link:** https://www.predicthq.com/signup
- **`.env` Variable:**
```
PREDICTHQ_ACCESS_TOKEN=your_token_here
```

---

### ☐ 5. NewsAPI
- **Purpose:** Scrapes real-time news headlines for disruption keywords ("Strike," "Protest," "Curfew") across Indian metro cities to update the Live Disruption Index when structured APIs miss an event.
- **Key Type:** Single API Key
- **Direct Link:** https://newsapi.org/register
- **`.env` Variable:**
```
NEWSAPI_KEY=your_key_here
```

---

## 🌋 Macro Disaster Failsafes

---

### ☐ 6. NASA EONET (Earth Observatory Natural Event Tracker)
- **Purpose:** Tracks large-scale natural events (wildfires, volcanic activity) that may intersect city polygons and auto-spike the Disruption Index to 100.
- **Key Type:** ✅ **No API Key Required** — Publicly available REST API.
- **Direct Link:** https://eonet.gsfc.nasa.gov/docs/v3
- **`.env` Variable:**
```
# No key needed. Endpoint: https://eonet.gsfc.nasa.gov/api/v3/events
NASA_EONET_BASE_URL=https://eonet.gsfc.nasa.gov/api/v3/events
```

---

### ☐ 7. USGS Earthquake Hazards API
- **Purpose:** Provides real-time earthquake magnitude and location data; any detected earthquake intersecting an active polygon automatically overrides that zone's DI to 100.
- **Key Type:** ✅ **No API Key Required** — Publicly available REST API.
- **Direct Link:** https://earthquake.usgs.gov/fdsnws/event/1/
- **`.env` Variable:**
```
# No key needed. Endpoint: https://earthquake.usgs.gov/fdsnws/event/1/query
USGS_BASE_URL=https://earthquake.usgs.gov/fdsnws/event/1/query
```

---

## 🗺️ Maps & Geospatial Rendering

---

### ☐ 8. Mapbox GL JS
- **Purpose:** Renders the interactive zone heatmap in the React frontend, displays polygon boundaries, and provides the manual zone-selection fallback for onboarding when the partner API is unavailable.
- **Key Type:** Public Access Token (safe to expose in frontend)
- **Direct Link:** https://account.mapbox.com/auth/signup/
- **`.env` Variable:**
```
REACT_APP_MAPBOX_TOKEN=pk.your_public_token_here
```
> ⚠️ Mapbox tokens are **public-facing** — add URL restrictions in the Mapbox console to limit usage to your domain only.

---

## 💳 Payment Simulation

---

### ☐ 9. Razorpay (Sandbox / Test Mode)
- **Purpose:** Simulates zero-touch instant fund disbursement to the rider's platform wallet following a confirmed disruption payout (Model 4), using Razorpay's test environment with no real funds transferred.
- **Key Type:** Key ID + Key Secret pair (use **Test Mode** keys only)
- **Direct Link:** https://dashboard.razorpay.com/signin
- **`.env` Variables:**
```
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```
> ⚠️ Ensure you are on the **Test Mode** toggle in the Razorpay dashboard — **never** use live keys in the hackathon build.

---

## 🤖 AI / Machine Learning

---

### ☐ 10. Hugging Face API (CLIP Model)
- **Purpose:** Powers the zero-shot image classification gate in the Python/FastAPI microservice, verifying that a rider-submitted photo contains genuine disruption content (flood, protest, heavy traffic) before crowdsourced claim validation proceeds.
- **Key Type:** User Access Token (used as Bearer token in the Python service)
- **Direct Link:** https://huggingface.co/join
  - After signup → Settings → Access Tokens → New Token
- **`.env` Variable (in Python service):**
```
HUGGINGFACE_API_TOKEN=hf_your_token_here
```
> 💡 The CLIP model (`openai/clip-vit-base-patch32`) can be run **locally** via `transformers` library to avoid rate limits. The HF token is only needed if calling the Inference API remotely.

---

## 🔧 Internal / Mock Integrations (No Signup Required)

---

### ☐ 11. Delivery Partner API (Mock — No External Key)
- **Purpose:** Simulates the internal Zomato/Swiggy partner endpoints for fetching rider baseline data (`E_avg`, shift patterns, primary zone) and executing ledger deductions/credits, since live B2B platform access is unavailable during the hackathon.
- **Key Type:** ✅ **No external key required.** Built internally as an Express.js mock server.
- **`.env` Variables (mock server config):**
```
MOCK_PARTNER_API_URL=http://localhost:4001
MOCK_PARTNER_API_SECRET=mock_secret_key_for_local_auth
```

---

## 📋 Complete `.env` Template

Copy this into your backend `.env` file and fill in each value:

```env
# ── Weather & Environmental ──────────────────────────────
OPENWEATHERMAP_API_KEY=
TOMORROW_IO_API_KEY=

# ── Traffic & Infrastructure ─────────────────────────────
TOMTOM_API_KEY=

# ── Social & Event Disruption ────────────────────────────
PREDICTHQ_ACCESS_TOKEN=
NEWSAPI_KEY=

# ── Macro Disaster Failsafes (No keys required) ──────────
NASA_EONET_BASE_URL=https://eonet.gsfc.nasa.gov/api/v3/events
USGS_BASE_URL=https://earthquake.usgs.gov/fdsnws/event/1/query

# ── Maps / Geospatial (Frontend) ─────────────────────────
REACT_APP_MAPBOX_TOKEN=

# ── Payment Simulation (Test Mode Only) ──────────────────
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# ── AI / ML Microservice (Python FastAPI) ────────────────
HUGGINGFACE_API_TOKEN=

# ── Internal Mock Partner API ────────────────────────────
MOCK_PARTNER_API_URL=http://localhost:4001
MOCK_PARTNER_API_SECRET=
```

---

## ⚠️ Security Reminders

- **NEVER commit `.env` to Git.** Ensure `.env` is in your `.gitignore`.
- **Razorpay:** Use **Test Mode** keys only. Live keys must never be used in the demo.
- **Mapbox:** Set token URL restrictions in the Mapbox console to your localhost/deployment domain.
- **HuggingFace:** If CLIP is run locally, the token is optional. Keep it secret if used.
- **NASA EONET & USGS:** Public APIs — no rate-limit concerns for hackathon-scale usage.
