# Marchetti's Apartment

> **Proximity-Based Housing Intelligence Platform**
> Evaluate housing locations by what you can realistically reach within your daily travel budget.

Inspired by Marchetti's constant — the empirical observation that humans tolerate ~30 minutes of travel time per trip — this platform quantifies lifestyle accessibility as a composite **Proximity Score** backed by real isochrone data and live points-of-interest counts.

---

## Features

- **Drop a pin or search** any address worldwide
- **Travel-time isochrone** drawn on an interactive dark map (walk / cycle / drive / transit)
- **Configurable time budget** (5–60 min slider)
- **6 POI categories** with per-category subcounts from OpenStreetMap
  - 🍽️ Food & Dining · 💪 Health & Fitness · 🚇 Transit · 📚 Education · 🎭 Entertainment · 🏪 Daily Services
- **Weighted Proximity Score** (0–100, letter grade A–F) with live recalculation as you adjust priorities
- **Radar chart** + animated score ring
- **Multi-location comparison** (up to 4) with a grouped bar chart
- **POI layer toggles** to show/hide categories on the map

---

## Tech Stack

| Layer | Tech |
|---|---|
| Maps | [Leaflet.js](https://leafletjs.com/) + CartoDB Dark Matter tiles |
| Charts | [Chart.js](https://www.chartjs.org/) |
| Isochrones | [Geoapify Isoline API](https://www.geoapify.com/) (free tier) |
| Geocoding | Geoapify Geocoding + Autocomplete |
| POI Data | [OpenStreetMap Overpass API](https://overpass-api.de/) |
| Frontend | Vanilla HTML / CSS / JavaScript — no build step required |

---

## Setup

### 1. Get a free Geoapify API key

Sign up at [geoapify.com](https://www.geoapify.com/) — no credit card required.  
Free tier: **3,000 requests/day**.

### 2. Create your local key file

```bash
cp js/config.local.TEMPLATE.js js/config.local.js
```

Open `js/config.local.js` and replace `PASTE_YOUR_KEY_HERE` with your key:

```js
window.GEOAPIFY_KEY_OVERRIDE = 'your-key-here';
```

> `js/config.local.js` is listed in `.gitignore` and will never be committed.

### 3. Run locally

```bash
# Python 3
python3 -m http.server 8765

# Then open:
# http://127.0.0.1:8765
```

> Opening `index.html` directly via `file://` will trigger CORS errors from the APIs.  
> A local HTTP server is required.

---

## Project Structure

```
Apartments.com/
├── index.html                     # SPA shell
├── css/
│   └── main.css                   # Design system (dark mode, glassmorphism)
├── js/
│   ├── config.local.TEMPLATE.js   # Copy → config.local.js, add your key
│   ├── config.local.js            # ← YOUR KEY HERE (gitignored)
│   ├── config.js                  # App config + category definitions
│   ├── geocoder.js                # Geoapify geocoding + autocomplete + reverse
│   ├── isochrone.js               # Isochrone fetch + bbox extraction
│   ├── overpass.js                # OSM POI batch query + categorization
│   ├── scorer.js                  # Weighted proximity score engine
│   ├── map.js                     # Leaflet map controller (markers, layers)
│   ├── ui.js                      # DOM, Chart.js, animations
│   ├── compare.js                 # Multi-location comparison modal
│   └── app.js                     # Main controller + AppState
└── .gitignore
```

---

## Scoring Algorithm

1. **Subcategory score**: `min(count / benchmark, 1.0) × 100`
2. **Category score**: average across subcategories
3. **Composite score**: `Σ(category_score × weight) / Σ(weights)`

Grades: A ≥ 80 · B ≥ 65 · C ≥ 50 · D ≥ 35 · F < 35

---

## Background

This project operationalizes **Marchetti's constant** — the anthropological finding that across cultures and transport modes, people budget roughly 30 minutes per trip for their daily travel. Rather than evaluating homes by price and square footage alone, this platform asks: *what kind of life can you realistically live from this address?*
