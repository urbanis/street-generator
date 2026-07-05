# Street Generator

> Design, evaluate, and export urban street cross-sections — from scratch, from real OpenStreetMap data, or from a natural language description.

**Live:** [streetgenerator.com](https://streetgenerator.com) · Available in **English** and **German**

---

## Overview

Street Generator is a browser-based tool for urban planners, architects, and transport engineers. It replaces time-consuming CAD workflows for quick street cross-section sketches with a live, shareable, exportable web application.

Core capabilities:
- **Design** a street profile manually or from a template
- **Import** real street data from OpenStreetMap by clicking on the map
- **Generate** a layout from a plain-language description using an LLM
- **Validate** the design against Berlin's RASt planning guidelines
- **Export** as PNG, SVG, or JSON

---

## Architecture

Fully client-side SPA — no backend, no database. All state lives in the browser. The build is deployed as a static bundle on Vercel's CDN edge network, which means zero infrastructure overhead and global availability without scaling concerns.

```
User Input
    │
    ├── Manual Editor (DesignTab)
    ├── OSM Import ──► Overpass API ──► interpreter.ts ──► mapper.ts
    └── AI Generate ──► Groq API ──► JSON validation
              │
              ▼
        StreetConfig          ← single typed model, the contract across all layers
              │
              ├── renderer.ts          (layout computation — pure TS, no DOM)
              │        │
              │   CrossSectionView     (SVG rendering — React)
              │        │
              │   ┌────┴────────────┐
              │  Export          Evaluate
              │ (PNG/SVG/JSON)  (rules engine)
              │
              └── URL serialization   (shareable link, no auth required)
```

### Core data model

The entire application is built around a single typed model:

```ts
interface StreetConfig {
  id:       string;
  name:     string;
  subtitle?: string;
  elements: StreetElement[];   // ordered left → right
}

interface StreetElement {
  type:      ElementType;      // SIDEWALK | TRAFFIC_LANE | CYCLE_LANE | PARKING_LANE | ...
  width_m:   number;
  figure?:   FigureConfig;     // pedestrian, car, tree SVG variants
  building?: BuildingData;     // floor-by-floor land use (only for BUILDING_LEFT/RIGHT)
}
```

This model is the contract between every layer — editor, renderer, validator, and exporter all consume the same structure. Swapping any layer doesn't require changes to the others.

---

## Integrations

### Overpass API — Real street data from OpenStreetMap

When a user clicks a street on the map, the app sends a bounding-box query to the public Overpass API:

```
[out:json][timeout:10];
way["highway"](bbox);
out tags 1;
```

The raw OSM tags (`lanes`, `cycleway:left`, `parking:lane:right`, `width`, etc.) go through a two-stage pipeline:

1. **`interpreter.ts`** — normalises tag variants and edge cases into a clean `InterpretedTags` struct. OSM tagging is inconsistent across contributors; this layer absorbs that inconsistency.
2. **`mapper.ts`** — converts interpreted tags into a `StreetConfig`. Lane width is computed from measured road width ÷ lane count where available, defaulting to 3.25 m. Bicycle roads, one-way streets, and separated cycle tracks are handled as distinct cases.

This two-stage separation keeps the mapping logic fully testable without a live API call.

### Groq API — Natural language to street layout

Users can describe a street in plain text and receive a full `StreetConfig` JSON back.

| Decision | Rationale |
|---|---|
| Model: `llama-3.1-8b-instant` | Sub-second inference — latency matters in an interactive design tool |
| Temperature: 0.3 | Deterministic structured output over creativity |
| Output: JSON-only | System prompt constrains the model to emit raw JSON, no markdown |
| Validation layer | Response is filtered against a strict `VALID_TYPES` allowlist before touching the UI — hallucinations cannot corrupt the data model |
| Rate limiting | localStorage gate (1 free generation per browser) — no auth server required |

The Groq endpoint is OpenAI-compatible, making provider swaps a one-line change.

### Client-side export pipeline

All exports happen in the browser — no server-side rendering:

- **SVG**: clone the live SVG element → inline external image assets as base64 → serialize. Dark-mode palette colors are remapped to light-mode equivalents so exports are always print-ready on white.
- **PNG**: SVG → Blob URL → `<img>` → Canvas API at 3× resolution → `toBlob()`. The custom font (ITC Avant Garde) is embedded as base64 so typography is preserved when the file is opened offline.
- **JSON**: `JSON.stringify(streetConfig)` — the model is the file format.

### URL-based state sharing

The full `StreetConfig` is serialized and encoded into the URL hash. Sharing a design requires no account, no backend, and no session — one link contains the entire design state.

---

## Rendering engine

`renderer.ts` computes a pixel layout from the street model at runtime. Key decisions:

- **Scale** is derived from total street width, constrained to a max canvas width of 900 px (min 20 px/m, max 60 px/m)
- **`skyH`** (vertical space above the ground band) accounts for building floor heights, tree heights, and figure heights — each figure variant declares its real-world height in meters, and the renderer calculates the required space dynamically
- **Road offset**: road-level elements (`TRAFFIC_LANE`, `PARKING_LANE`, etc.) sit 0.20 m below sidewalk level, reflecting real kerb geometry

The renderer is pure TypeScript — no React, no DOM dependency. `CrossSectionView` consumes its output and maps it to SVG elements, keeping layout logic fully separated from rendering.

---

## Compliance validation

`rules/engine.ts` runs a declarative set of checks against a `StreetConfig` and returns `PASS | WARN | FAIL` results with affected element IDs highlighted in the UI. Rules are based on Berlin's **RASt** (Richtlinien für die Anlage von Stadtstraßen) guidelines.

| Rule | Element | Requirement |
|---|---|---|
| R01 | Sidewalk | ≥ 2.5 m |
| R02 | Cycle lane | ≥ 1.85 m |
| R03 | Traffic lane | 2.75 – 3.75 m |
| R04 | Parking lane | 2.0 – 2.5 m |
| R05 | Bus lane | ≥ 3.0 m |
| R06 | Buffer | ≥ 0.75 m between cycle lane and traffic/parking |
| R07 | Median | ≥ 1.0 m |
| R08 | Planting strip | ≥ 1.5 m |
| R09 | Total carriageway | ≤ 13.0 m |
| R10 | Total street width | ≤ 30.0 m recommended |

Each rule is independently testable and exposes bilingual messages (DE/EN).

---

## Analytics

Anonymous usage analytics via **PostHog** (EU servers, GDPR-compliant). No personal data, no street content, no location data is collected. See [docs/analytics.md](docs/analytics.md) for the full list of tracked events and opt-out instructions.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Map | Leaflet + OpenStreetMap tiles |
| LLM inference | Groq API — `llama-3.1-8b-instant` |
| Street data | OpenStreetMap via Overpass API |
| Analytics | PostHog (EU) |
| Deployment | Vercel (static, CDN edge) |
| i18n | Custom typed translation registry (DE / EN) |

---

## Local development

```bash
npm install
echo "VITE_GROQ_TOKEN=your_key_here" > .env
npm run dev
```

The app is fully functional without the Groq token — the AI generation feature is disabled but all other features work.

```bash
npm run build   # production build
npm test        # OSM interpreter unit tests
```
