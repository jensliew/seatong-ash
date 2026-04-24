# SeaTong — AI-Powered Ocean Cleanup Dashboard

An intelligent monitoring dashboard for SeaBin devices deployed in Port Klang, Malaysia. The system integrates AI vision detection and probe sensors to enable eco-safe, efficient ocean cleanup.

## Prerequisites

- **Node.js** v18 or above
- **npm** v9 or above
- **Python** 3.8 or above (for AI backend)

## Getting Started

### Terminal 1 — Start Backend (Flask + YOLO)

```bash
cd seabin-dashboard/backend

# macOS
pip3 install -r requirements.txt
python3 app.py

# Windows
pip install -r requirements.txt
python app.py

# Server runs on http://localhost:5001
# You should see: "Model loaded successfully"
```

> **macOS note:** Port 5000 is used by AirPlay Receiver. The backend runs on port **5001** instead. If you still get a port conflict, disable AirPlay Receiver in System Settings → General → AirDrop & Handoff.

### Terminal 2 — Start Frontend (React + Vite)

```bash
cd seabin-dashboard

# macOS / Windows
npm install
npm run dev

# Open http://localhost:5173
```

The frontend proxies `/api/*` requests to the backend via Vite config — no CORS issues.

### Testing AI Detection

1. Navigate to **SB-002** (AI Test Mode seabin)
2. Click on **AI Stream** tab
3. Upload an image from `demo_image/demo_image/` folder
4. The AI model detects objects and draws bounding boxes
5. Detection results appear in the table below
6. If fish is detected, the system pauses and shows an alert

## Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

### Frontend
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
| 3D | Three.js (React Three Fiber) |
| Icons | Lucide React |

### Backend
| Component | Tool |
|---|---|
| Language | Python 3.8+ |
| Framework | Flask |
| AI Model | YOLOv8 (Ultralytics) |
| CORS | Flask-CORS |
| Image Processing | Pillow |
| GPU Support | PyTorch (CUDA optional, falls back to CPU) |

## System Architecture

```
seabin-dashboard/
├── backend/
│   ├── app.py              # Flask API server (port 5001)
│   ├── best.pt             # YOLOv8 trained model
│   └── requirements.txt    # Python dependencies
│
├── src/
│   ├── pages/
│   │   ├── Dashboard       # Overview: map, stats, risk chart, live feed, detection table
│   │   ├── Fleet           # Fleet overview of all seabins
│   │   ├── SeabinDetail    # Per-seabin: 3D model, AI stream, status, alerts, insights
│   │   ├── Alerts          # All alerts grouped by seabin equipment / river condition
│   │   ├── WaterQuality    # Water quality monitoring data
│   │   ├── PlasticCredits  # Plastic credit tracking & impact
│   │   └── Contact         # Partnership & sponsorship inquiry form
│   │
│   ├── components/
│   │   ├── map/            # Leaflet heatmap with seabin markers
│   │   ├── dashboard/      # Stat cards, contamination chart, live feed, debris table, impact row
│   │   ├── fleet/          # Fleet header, seabin cards
│   │   ├── seabin/         # 3D model, AI stream, system status, capacity gauge, alerts, image upload
│   │   ├── insights/       # Accuracy metrics, detection log, predictions, collection rate chart
│   │   └── alerts/         # Alert config, alert list items
│   │
│   ├── layouts/            # Sidebar + main content wrapper
│   ├── store/              # Zustand global state
│   ├── hooks/              # Custom hooks (live counter)
│   ├── lib/                # Utilities (series generation, stream scenario mapping)
│   ├── data/               # Mock data (seabins, alerts, detections, impact, partners)
│   ├── types/              # Shared TypeScript interfaces
│   └── assets/             # Brand logos
│
└── vite.config.ts          # Vite config with API proxy to backend
```

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — heatmap, river health, contamination risk by area, live feed, detection table |
| `/fleet` | Fleet — overview of all seabin units |
| `/seabin/:id` | Seabin detail — 3D model, AI stream, system status, capacity, alerts, AI insights |
| `/alerts` | Alert list — grouped by seabin equipment alerts and river condition alerts |
| `/water-quality` | Water quality — monitoring data from probe sensors |
| `/plastic-credits` | Plastic credits — tracking collection impact |
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

## Troubleshooting

### macOS: Port 5000 conflict
Port 5000 is used by AirPlay Receiver on macOS. The backend uses port **5001** to avoid this. If you still have issues:
- System Settings → General → AirDrop & Handoff → disable "AirPlay Receiver"
- Or change the port in `backend/app.py` and `vite.config.ts`

### macOS: `pip` not found
Use `pip3` instead of `pip`, and `python3` instead of `python`.

### Backend won't start
- Ensure Python 3.8+ is installed: `python3 --version`
- Install dependencies: `pip3 install -r backend/requirements.txt`
- Verify `backend/best.pt` model file exists

### Frontend can't reach backend
- Verify backend is running on `http://localhost:5001`
- Restart the Vite dev server after any `vite.config.ts` changes
- The Vite proxy handles CORS — no need for browser extensions

### AI detection not working
- Check backend terminal for model loading errors
- Verify `backend/best.pt` exists
- Try a different image format (JPG, PNG)

## Notes

- Frontend runs with mock data by default — backend only needed for real AI detection (SB-002)
- Vite proxies `/api/*` to the backend — no CORS configuration needed
- Map uses OpenStreetMap (free, no API key needed)
- Backend uses CUDA if available, falls back to CPU
- Splash screen shows on app load with SeaTong branding
