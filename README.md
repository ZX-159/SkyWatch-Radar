# SkyWatch-Radar
CORE: 
Tactical Global Flight Intelligence Platform • Open Source OSINT

A production-grade, real-time worldwide tactical flight intelligence platform designed for high-performance

geospatial monitoring. Built with a client-first architecture using GPU-accelerated rendering and a military-
inspired design language.

1. CORE TECH STACK

Frontend & Viz
Engine: React + TypeScript + Vite
3D Globe: OpenGlobus (GPU)
2D Maps: MapLibre GL JS
Layers: deck.gl (High-density GPU)
UI: Tailwind CSS + Framer Motion

Infrastructure
Edge Compute: Cloudflare Workers
Persistence: IndexedDB (Dexie.js)
State: Zustand + TanStack Query
Spatial: RBush / kdbush

2. SYSTEM ARCHITECTURE
The platform adheres to a modular, service-oriented architecture ensuring provider-agnostic data flow.

3. PERFORMANCE OPTIMIZATIONS
Multithreading: All aircraft filtering, military classification, and trail geometry processing are handled in Web
Workers to prevent UI jank.
Spatial Indexing: Real-time viewport querying using RBush for O(log n) aircraft lookups.
Adaptive LOD: Global Dots only. Regional 2D Icons + Labels. Close-up Full glTF 3D Aircraft Models.
GPU Batching: Thousands of instances rendered in a single draw call via deck.gl.
•
•
•
•
•

•
•
•
•

src/
├── app/ # Core providers & global wrappers
├── components/ # Atomic UI (Shadcn-like tactical components)
├── features/ # Logic for Aircraft, Airports, Weather
├── services/ # Abstracted API layers (ADSB-Hub, GeoData)
├── workers/ # Off-thread processing (Spatial indexing, Filtering)
├── layers/ # deck.gl & OpenGlobus custom layer definitions
└── stores/ # Zustand state slices (UI, Map, FlightData)

•

•
•
•

Tactical Military Heuristics
The system uses an autonomous scoring engine to identify non-civilian assets based on:
Known ICAO hex blocks (RCAF, USAF, RAF).
Callsign pattern matching (e.g., FORTE , RCH , LAGR ).
Behavioral analysis: Orbiting patterns (Tankers/AWACS) and airbase departure correlation.

4. APPLICATION MODES
3D Strategic: Global situational awareness using OpenGlobus.
2D Tactical: High-precision vector mapping for dense airspace.
Split-Intelligence: Synchronized dual-view for simultaneous broad/local monitoring.
5. DEPLOYMENT & COST
Engineered for Zero-Cost Scalability:
Hosting: Cloudflare Pages (Free Tier).
API Proxy: Cloudflare Workers (Edge Caching).
Maps: OpenFreeMap / MapTiler (Free Tier).
Data: Airplanes.live / OpenSky Network integration.
