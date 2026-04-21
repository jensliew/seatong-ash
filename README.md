# SeaTong — AI-Powered Ocean Cleanup Dashboard

An intelligent monitoring dashboard for SeaBin devices deployed in Port Klang, Malaysia. The system integrates AI vision detection and probe sensors to enable eco-safe, efficient ocean cleanup.

## Prerequisites

- **Node.js** v18 or above
- **npm** v9 or above

## Getting Started

```bash
# 1. Install dependencies
cd seabin-dashboard
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:5173 (or the port shown in terminal)
```

## Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

| Layer | Tool |
|---|---|
| Language | TypeScript |
| Framework | React 18 |
| Build | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| State | Zustand |
| Map | Leaflet + leaflet.heat |
| Charts | Recharts |
| Icons | Lucide React |

## System Architecture

```
src/
├── pages/              # Route-level pages
│   ├── Dashboard       # Overview: map, health score, risk chart, detection table
│   ├── SeabinDetail    # Per-seabin: live stream, system status, quick stats, alerts, AI insights
│   ├── Alerts          # All alerts grouped by seabin equipment / river condition
│   └── Contact         # Partnership & sponsorship inquiry form
│
├── components/
│   ├── map/            # Leaflet heatmap with seabin markers
│   ├── dashboard/      # Stat cards, contamination chart, debris table
│   ├── seabin/         # Live stream, system status, quick stats, alerts, image upload (AI test)
│   ├── insights/       # Accuracy metrics, detection log, predictions
│   └── alerts/         # Alert groups by type
│
├── layouts/            # Sidebar + main content wrapper
├── store/              # Zustand global state
├── data/               # Mock data (seabins, alerts, detections)
└── types/              # Shared TypeScript interfaces
```

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — heatmap, river health, contamination risk by area, dead fish count, detection table |
| `/seabin/:id` | Seabin detail — live stream (simulated AI vision), system status, quick stats, alerts, AI insights |
| `/alerts` | Alert list — grouped by seabin equipment alerts and river condition alerts |
| `/contact` | Contact form — partnership, sponsorship, general inquiries |

## Seabin Scenarios

Each seabin has a unique simulated live stream matching its alert profile:

| Seabin | Scenario | What You See |
|---|---|---|
| SB-001 | pH anomaly + dead fish | Flickering pH sensor HUD, occasional dead fish with red detection boxes |
| SB-002 | AI test mode | Image upload to test AI vision model, detection results displayed |
| SB-003 | Fish haven (paused) | Clean water, many fish swimming, green detection boxes, marine life monitor |
| SB-004 | Heavy pollution | Murky water, heavy debris, dead fish, sensor HUD showing critical pH & turbidity |
| SB-005 | Offline | Stream unavailable, offline banner |

## Detection Sources

| Source | Detects |
|---|---|
| AI Vision (camera) | Debris classification, fish population, dead fish, overflow estimation |
| pH Probe | pH level, pH anomaly alerts |
| Turbidity Probe | Turbidity level, water quality alerts |
| System Monitoring | Camera feed issues, connection status |

## Alert Categories

**Seabin Equipment:** Debris overflow, debris surge, sensor anomaly, camera feed issue

**River Condition:** High fish population, dead fish detected, high turbidity, pH anomaly

## Notes

- All data is mocked for prototype/demo purposes
- Mock data layer is structured for easy API replacement
- No backend required — runs entirely in the browser
- Map uses OpenStreetMap (free, no API key needed)
