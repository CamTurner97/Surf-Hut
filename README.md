# Surf Hut

> **Where's it firing?**

A mobile-first surf spot finder for Sydney. Open the app and instantly see a map of Sydney's coastline with 20 beach pins colour-coded by current surf quality. Tap a pin to get a full surf and weather report.

Built for the Sydney surfing community — all ages, all skill levels.

---

## Screenshots

_Coming soon — Android build in progress._

---

## Features

- **Live map** — 20 Sydney beaches, pins coloured by surf score (Epic / Good / Fair / Poor)
- **Beach detail screen** — wave height & period, wind speed & direction, air & water temp, sea level
- **Surf scoring** — 1–10 score computed server-side from Open-Meteo data, tuneable per beach
- **Illustrated hero images** — custom artwork for every beach
- **Free surf data** — powered by [Open-Meteo](https://open-meteo.com/) (no API key required)

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Mobile | React Native + Expo |
| Map | Leaflet via react-native-webview (Expo Go compatible) |
| Mobile state | TanStack Query |
| Backend | Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| API contract | OpenAPI + Orval codegen |
| Validation | Zod |
| Surf & weather data | Open-Meteo Marine + Forecast APIs |

---

## Architecture

```
Expo mobile app
   │ HTTPS
   ▼
Express API  (artifacts/api-server)
   │
   ├── PostgreSQL  (beach catalogue + report cache)
   └── Open-Meteo  (marine + forecast, 30-min cache)
```

The backend caches Open-Meteo responses with a 30-minute TTL and computes a surf score so the algorithm can be tuned server-side without shipping an app update.

---

## Beaches (20 spots)

**Northern Beaches** — Palm Beach, Avalon, Newport, North Narrabeen, Collaroy, Long Reef, Dee Why, North Curl Curl, South Curl Curl, Freshwater, Queenscliff, North Steyne, South Steyne

**Eastern Suburbs** — Bondi, Tamarama, Bronte, Maroubra

**Cronulla** — Wanda, North Cronulla, Cronulla Point

---

## Surf Score Formula (v1)

| Factor | Weight |
|---|---|
| Wave height in beach's ideal range | 40% |
| Wind direction matches beach's offshore wind | 30% |
| Wind speed below 25 km/h | 20% |
| Swell period ≥ 8 s | 10% |

Each beach has its own `ideal_conditions` profile so the score reflects that specific break.

---

## Getting Started

### Prerequisites

- Node 24+
- pnpm 9+
- PostgreSQL database (connection string in `DATABASE_URL`)

### Install

```bash
pnpm install
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session signing |
| `EXPO_PUBLIC_DOMAIN` | Your dev domain (set automatically on Replit) |

### Run the API server

```bash
pnpm --filter @workspace/api-server run dev
```

### Run the Expo app

```bash
pnpm --filter @workspace/surf-hut run dev
```

Scan the QR code with Expo Go on Android or iOS.

### Database setup

```bash
pnpm --filter @workspace/api-server run db:migrate
pnpm --filter @workspace/api-server run db:seed
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/beaches` | All beaches with current surf score |
| GET | `/api/beaches/:id` | Single beach with full report |
| GET | `/api/beaches/:id/report` | Surf & weather report for one beach |
| GET | `/api/map` | Map HTML shell (served into WebView) |
| GET | `/api/healthz` | Health check |

---

## Roadmap

- [ ] List view as alternative to the map
- [ ] Search / filter beaches by name
- [ ] Favourites (local, AsyncStorage)
- [ ] Settings (units, about, credits)
- [ ] Pull-to-refresh
- [ ] Offline cache with stale-data indicator
- [ ] iOS build
- [ ] Web build
- [ ] Push notifications when favourite beaches fire

---

## Build Order

1. Android (primary — in progress)
2. iOS
3. Web

All three from a single Expo codebase.

---

## Licence

MIT
