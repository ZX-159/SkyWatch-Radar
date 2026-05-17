### Monitored Indicators
* **Tactical Callsign Matches:** Instant tracking vectors for priority prefixes including `FORTE`, `RCH`, `REACH`, `NATO`, `ASCOT`, `SHUCK`, `HKY`, and `DUKE`.
* **Spatial Airbase Tracking:** Intersects flight paths initiating from military airbases or restricted tactical zones.
* **Flight Geometry Ingestion:** Analyzes flight profiles for distinctive operational signatures like continuous orbit tracks (typical of aerial refueling tankers and AWACS assets).

---

## 🎛 Application Modes & Map Overlays

SkyWatch Radar features a unified visual ecosystem with three fluid operational configurations:

### 1. Unified Operating Modes
* **3D Globe Mode:** Global strategic awareness map built with `OpenGlobus`.
* **2D Tactical Mode:** High-precision map projection utilizing flat `MapLibre` vectors.
* **Split View Mode:** Synchronized side-by-side display for simultaneous broad tracking and target-specific visual analysis.

### 2. Deep Structural Map Overlays
* **Airspace Ingestion Engine:** Automated parsing architectures for Flight Information Regions (FIR), restricted target ranges, and danger areas.
* **Airfield Graphics:** Renders control towers, precision runway vectors, and localized traffic flow loops.
* **Environmental Assets:** Dynamic weather overlays, barometric pressure models, and cloud-density tracking maps.

---

## 🎨 Design System & UI Components

The visual layer is engineered as a clean, low-fatigue layout inspired by real-world defense operations rooms. **Oversaturated cyberpunk neon themes are strictly excluded.**

* **Surfaces:** Dark matte background blocks complemented by sleek glassmorphism dashboard side panels (`backdrop-blur`).
* **Accents:** Subtle tactical grids, soft indicators, low-saturation threat profiles, and smooth radar sweep sweeps across active target groups.
* **Desktop Layout:** Comprehensive control layout featuring dual sidebars, a flight telemetry tracker, active search command bars, and a diagnostic minimap.
* **Mobile/Tablet Layout:** Gesture-optimized, responsive viewports equipped with collapsible control tabs and thumb-friendly interaction clusters.

---

## 💾 Caching Strategy & Low-Cost Infrastructure

The platform is designed to operate seamlessly on entirely free or budget edge tiers without running up database or server costs.

* **Edge Compute Layer:** A Cloudflare Worker proxy manages third-party aircraft feeds, aggregates disparate data payloads, and handles high-speed caching with a custom `stale-while-revalidate` caching header template.
* **Local Buffer Layer:** Flight trails and metadata are managed locally through `Dexie.js` in client-side IndexedDB, bypassing the need for an expensive centralized geospatial database until enterprise expansion is required.

---
