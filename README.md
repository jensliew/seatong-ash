# SeaTong — AI-Powered Ocean Cleanup Dashboard

An intelligent monitoring dashboard for SeaBin devices deployed in Port Klang, Malaysia. The system integrates AI vision detection and probe sensors to enable eco-safe, efficient ocean cleanup.

## Prerequisites

- **Node.js** v18 or above
- **npm** v9 or above
- **Python** 3.8 or above
- **pip** (Python package manager)

## Getting Started

Frontend + Backend (AI Detection)

#### Terminal 1 — Start Backend (Flask + YOLO)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start Flask server
python app.py

# Server will run on http://localhost:5000
# You should see: "Model loaded successfully" and "Running on http://127.0.0.1:5000"
```

#### Terminal 2 — Start Frontend (React + Vite)

```bash
# 1. From project root, install dependencies (if not already done)
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

#### Testing AI Detection

1. Navigate to **SB-002** (AI Test Mode seabin)
2. Click on **AI Stream** tab
3. Upload an image from `demo_image/demo_image/` folder:
   - `aluminiumcan.JPG`
   - `fishes.jpg`
   - `fishingnet.jpg`
   - `plasticbag&bottle.jpg`
   - `plasticbags.jpg`
4. The AI model will detect objects and draw bounding boxes on the image
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
| Icons | Lucide React |

### Backend (Optional)
| Component | Tool |
|---|---|
| Language | Python 3.8+ |
| Framework | Flask |
| AI Model | YOLOv8 (Ultralytics) |
| CORS | Flask-CORS |
| Image Processing | Pillow |
| GPU Support | PyTorch (CUDA optional) |

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

- **Frontend**: Runs entirely in the browser with mock data by default
- **Backend**: Optional Flask server for real AI vision detection via YOLO
- **API Endpoint**: Frontend calls `http://localhost:5000/api/detect` when backend is running
- **Mock Data**: Structured for easy API replacement when backend is available
- **Map**: Uses OpenStreetMap (free, no API key needed)
- **AI Model**: YOLOv8 model (`best.pt`) is loaded on backend startup
- **GPU**: Backend will use CUDA if available, falls back to CPU

## Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed: `python --version`
- Install dependencies: `pip install -r backend/requirements.txt`
- Check if port 5000 is available: `netstat -an | grep 5000`

### Frontend can't reach backend
- Verify backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Ensure both are running on the correct ports

### AI detection not working
- Check backend console for model loading errors
- Verify `backend/best.pt` model file exists
- Try uploading a different image format (JPG, PNG)

### Port conflicts
- Frontend default: `http://localhost:5173`
- Backend default: `http://localhost:5000`
- Change ports in `vite.config.ts` or `backend/app.py` if needed
