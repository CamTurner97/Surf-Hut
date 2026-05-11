# Surf Hut

## Overview

A mobile-first surf spot finder for Sydney. Users open the app and immediately see a map of Sydney's coastline with ~20 beach pins colour-coded by current surf quality. Tapping a pin reveals a full surf and weather report. Designed for the Sydney surfing community of all ages, with a minimalist, efficient feel.

**Tagline (working):** "Where's it firing?"

**Brand vibe:** Efficient and minimalistic. Restrained palette of sunset orange and teal with cream and deep navy accents. Not overly colourful.

## Build Order

1. Android (primary)
2. iOS
3. Web

All three from a single React Native / Expo codebase.

## MVP Scope (v1)

- Map of Sydney with ~20 beach pins, colour-coded by surf score
- Tap pin → bottom sheet quick summary
- Full beach detail screen: surf report, weather, tide, 24h forecast
- List view as alternative to the map
- Search/filter beaches by name
- Favourites (local-only, AsyncStorage)
- Settings (units, about, credits)
- Pull-to-refresh
- Offline cache of last fetched report per beach
- 70% unit-test coverage on backend and mobile

## Out of Scope (v2+)

- User accounts (Clerk)
- Reviews of beaches, cafés, surfboard hire
- Push notifications when favourite beaches hit good conditions
- Webcam integration
- Crowd reports / social sharing

## Architecture

```
Expo mobile app
   │ HTTPS
   ▼
Express API (artifacts/api-server)
   │
   ├── PostgreSQL (beach catalogue + report cache)
   └── Open-Meteo Marine + Forecast APIs (no key required)
```

The backend caches Open-Meteo responses (30-min TTL) and computes a 1–10 surf "score" per beach so the algorithm can be tuned without app updates.

## Stack

| Layer | Tool |
|---|---|
| Monorepo | pnpm workspaces |
| Mobile | React Native via Expo |
| Map | Leaflet via react-native-webview (Expo Go compatible; Mapbox for future dev builds) |
| Mobile state | TanStack Query |
| Local storage | AsyncStorage |
| Backend | Express 5 + TypeScript (existing `artifacts/api-server`) |
| Database | PostgreSQL + Drizzle ORM |
| API contract | OpenAPI + Orval codegen → `@workspace/api-client-react` |
| Validation | Zod |
| Surf data | Open-Meteo Marine API (free, no key) |
| Weather data | Open-Meteo Forecast API (free, no key) |
| Backend tests | Vitest, ≥70% coverage gate |
| Mobile tests | Jest + React Native Testing Library, ≥70% coverage gate |

## Data Model

### `beaches`
- `id` (string, PK) — slug, e.g. `bondi`
- `name`, `region`, `latitude`, `longitude`
- `facing_direction` — N/NE/E/SE/S; used by scoring
- `description`, `hero_image_url`
- `ideal_conditions` (json) — preferred swell direction, wind direction, wave-height range

### `surf_reports` (cache)
- `beach_id` (FK), `fetched_at`, `payload` (raw Open-Meteo), `score` (1–10)

## API Endpoints (v1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/beaches` | All beaches with current score |
| GET | `/api/beaches/:id` | Single beach with full report |
| GET | `/api/healthz` | Health check |

## Surf Score (v1, simple weighted formula)

- 40% wave height in beach's ideal range
- 30% wind direction matches beach's offshore wind
- 20% wind speed below 25 km/h
- 10% swell period ≥ 8s

Tuneable per beach via `ideal_conditions`.

## Seed Beach List (20 spots)

**Northern Beaches:** Palm Beach, Avalon, Newport, North Narrabeen, Collaroy, Long Reef, Dee Why, North Curl Curl, South Curl Curl, Freshwater, Queenscliff, North Steyne (Manly), South Steyne (Manly).
**Eastern Suburbs:** Bondi, Tamarama, Bronte, Maroubra.
**Cronulla:** Wanda, North Cronulla, Cronulla Point.

Hero images stored in `attached_assets/beach_images/<slug>.png`.

## Build Process

The user wants to review and tweak after every task. Each task ends with a preview/screenshot and a pause for feedback before the next task begins.

## Task Plan

### Phase 0 — Setup & Data
- T01 Scaffold Expo mobile app with navigation, theme, base screens
- T02 Curate seed beach list with coordinates, ideal conditions (drafted; ready)
- T03 Generate hero images per beach (done; in `attached_assets/beach_images/`)

### Phase 1 — Backend
- T04 OpenAPI spec for `/api/beaches` and `/api/beaches/:id`
- T05 DB schema (`beaches`, `surf_reports`) and seed
- T06 Open-Meteo client wrapper with 30-min cache
- T07 Surf scoring algorithm
- T08 Endpoint handlers with Zod validation

### Phase 2 — Mobile Core
- T09 Map screen with colour-coded pins — COMPLETE (Leaflet via WebView, injectedJavaScript approach)
  - Key finding: Android Expo Go WebView blocks inline `<script>` tags; `injectedJavaScript` prop works.
  - HTML shell + beach JSON served from /api/map; Leaflet fetched inside WebView from /api/static/leaflet.min.js
- T10 Beach detail screen (hero, surf, weather, tide, 24h strip)
- T11 List view + map/list toggle
- T12 Pull-to-refresh
- T13 Search/filter

### Phase 3 — Local Features
- T15 Favourites screen + AsyncStorage — COMPLETE
  - Heart button on beach detail screen (hero top-right)
  - Favourites tab: flat list of saved beaches with score badges, region subtitle, empty state
- T15b Map favourites filter toggle — COMPLETE
  - "My spots" pill (top-left, below status bar) appears only when ≥1 beach is saved
  - Pill inactive: cream card with orange outline heart + "My spots" label
  - Pill active: solid orange with white heart + label
  - Toggles via injectJavaScript → window.filterBeaches(ids) in the Leaflet WebView
  - Markers stored in window.MARKERS by beach ID; show/hide without reloading the map
- T16 Settings screen (units, about, credits)
- T17 Offline cache with stale-data indicator

### Phase 4 — Polish & Ship
- T18 Empty / error / loading states
- T19 Accessibility pass (contrast, touch targets, screen-reader labels)
- T20 App icon, splash, metadata
- T21 Android APK build and on-device test
- T22 Deploy backend; dry run on real device

### Tests (alongside each phase)
- Backend Vitest setup, 70% gate enforced in CI
- Mobile Jest + RNTL setup, 70% gate enforced in CI

## External Accounts Needed

- **Mapbox** — public access token (free tier). Will prompt the user during T09.
- Open-Meteo: no account/key required.

## Notes

- pnpm workspace monorepo using TypeScript (Node 24, TS 5.9, Express 5, Drizzle, Zod, Orval).
- Existing artifacts: `api-server` (Express), `mockup-sandbox` (design playground).
- See the `pnpm-workspace` skill for workspace structure.

## Git Workflow Rules (GitHub-connected project)

**Hard rules — follow on every task:**

- Never commit or push directly to `main`.
- Every task starts on a fresh feature branch named `feature/<short-task-name>` (e.g. `feature/t06-image-route`).
- Only implement the specific requested task. No drive-by refactors, no unrelated style/structural changes.
- Before any commit: run the project's checks. Tests must pass.
  - **Project mapping (pnpm monorepo):**
    - `npm test` → `pnpm run test` once test scripts exist (Vitest backend, Jest mobile). Until then, `pnpm run typecheck`.
    - `npm run lint` → not yet configured; treat as no-op until a lint script is added.
- Commit messages: clear, specific, present tense. Example: `Add static image route for beach hero photos`.
- Commit frequently in logical steps; keep PRs small, focused, and reviewable.
- After pushing: open a PR on GitHub. Base = `main`, compare = the feature branch. PR description includes what changed and how it was tested.
- Never commit secrets or API keys. (Replit Secrets and `.env` are gitignored — keep it that way.)
- Never force-push unless the user explicitly asks for it.
- Ask for clarification when requirements are unclear.
- Prioritise correctness, safety, and maintainability over speed.

**How this maps to Replit's environment:**

- Git pane (left sidebar → Tools → Git) is the canonical place to create branches, switch branches, push, and pull.
- Replit auto-commits at the end of every task. Those commits land on whatever branch is currently checked out, so the feature branch must be created **before** task work begins.
- Agent does not push directly; the user clicks **Push** in the Git pane after a task is reviewed.
- PRs are opened on github.com (or via the Git pane's PR shortcut).
