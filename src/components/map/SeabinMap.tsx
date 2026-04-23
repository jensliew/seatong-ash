import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from 'react-router-dom'
import type { Seabin } from '../../types'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  seabins: Seabin[]
}

const statusColor: Record<Seabin['status'], string> = {
  active: '#0f766e',
  paused: '#f59e0b',
  inactive: '#94a3b8',
}

const riskColor: Record<Seabin['contamination_risk'], string> = {
  low: '#059669',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#dc2626',
}

// Port Klang bounding box for spawning new hotspots
const BOUNDS = { latMin: 2.975, latMax: 3.055, lngMin: 101.35, lngMax: 101.43 }

function randInBounds() {
  const lat = BOUNDS.latMin + Math.random() * (BOUNDS.latMax - BOUNDS.latMin)
  const lng = BOUNDS.lngMin + Math.random() * (BOUNDS.lngMax - BOUNDS.lngMin)
  const intensity = 0.45 + Math.random() * 0.55
  return [lat, lng, intensity] as [number, number, number]
}

export default function SeabinMap({ seabins }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  // store the heat layer and its live data so we can update it
  const heatRef = useRef<{ layer: L.Layer; data: [number, number, number][] } | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [3.0089, 101.3928],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      className: 'map-tiles',
      attribution: '© OpenStreetMap · © CARTO',
    }).addTo(map)

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19, pane: 'shadowPane' },
    ).addTo(map)

    const heatGradient = {
      0.15: '#14b8a6',
      0.35: '#fde68a',
      0.55: '#fb923c',
      0.75: '#ef4444',
      1.0: '#b91c1c',
    }

    const layerGroup = L.layerGroup().addTo(map)

    // Seed initial heat data from seabins
    const initialData: [number, number, number][] = seabins.map(
      (sb) => [sb.lat, sb.lng, Math.max(0.25, sb.debris_intensity)],
    )

    import('leaflet.heat').then(() => {
      // @ts-expect-error leaflet.heat extends L
      const hLayer = L.heatLayer(initialData, {
        radius: 70,
        blur: 45,
        maxZoom: 17,
        minOpacity: 0.35,
        gradient: heatGradient,
      }).addTo(map)

      heatRef.current = { layer: hLayer, data: [...initialData] }

      // ── Spawn a new hotspot every 6 s ──────────────────────────────────
      const hotspotTimer = window.setInterval(() => {
        if (!heatRef.current) return
        const newPt = randInBounds()
        const newData = [...heatRef.current.data, newPt]
        // keep max 30 points so the map doesn't get overloaded
        const trimmed: [number, number, number][] = newData.slice(-30)
        heatRef.current.data = trimmed
        // @ts-expect-error setLatLngs is the leaflet.heat API
        heatRef.current.layer.setLatLngs(trimmed)

        // Brief flash ring at the new point
        const ring = L.circleMarker([newPt[0], newPt[1]], {
          radius: 6,
          color: '#ef4444',
          weight: 2,
          fillColor: '#ef444430',
          fillOpacity: 0.5,
          className: 'hotspot-ring',
        }).addTo(map)
        // remove after animation
        setTimeout(() => map.removeLayer(ring), 2000)
      }, 6000)

      // cleanup timer on unmount
      map.once('remove', () => window.clearInterval(hotspotTimer))
    })

    // ── Seabin markers ────────────────────────────────────────────────────
    seabins.forEach((sb) => {
      const color = statusColor[sb.status]
      const haloColor = sb.contamination_risk === 'critical' ? '#dc2626' : color
      const icon = L.divIcon({
        className: 'seabin-marker',
        html: `<div class="seabin-marker-dot" style="
          --marker-color:${color};
          width:18px;height:18px;border-radius:50%;
          background:${color};
          border:3px solid #fff;
          box-shadow:0 0 0 2px ${haloColor}33, 0 4px 12px ${haloColor}55;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor:pointer;position:relative;
        ">
          ${
            sb.status === 'active'
              ? `<div style="
                  position:absolute;top:-7px;left:-7px;
                  width:32px;height:32px;border-radius:50%;
                  border:2px solid ${haloColor}66;
                  animation: marker-pulse 2.2s ease-out infinite;
                  pointer-events:none;
                "></div>`
              : ''
          }
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })

      const marker = L.marker([sb.lat, sb.lng], { icon })
        .addTo(layerGroup)
        .bindTooltip(
          `<div style="font-size:12px;line-height:1.6;min-width:180px;font-family:inherit;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px;">
              <strong style="color:#0f172a;font-size:13px;">${sb.name}</strong>
              <span style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">${sb.area}</span>
            </div>
            <div style="display:flex;gap:6px;margin:4px 0 6px;">
              <span style="padding:1px 8px;border-radius:999px;background:${color}15;color:${color};font-weight:600;font-size:11px;">${sb.status}</span>
              <span style="padding:1px 8px;border-radius:999px;background:${riskColor[sb.contamination_risk]}15;color:${riskColor[sb.contamination_risk]};font-weight:600;font-size:11px;">${sb.contamination_risk} risk</span>
            </div>
            <div style="color:#475569;">Capacity <strong style="color:#0f172a;">${sb.capacity}%</strong> · pH <strong style="color:#0f172a;">${sb.ph.toFixed(1)}</strong></div>
          </div>`,
          { direction: 'top', offset: [0, -12], className: 'seabin-tooltip' },
        )

      marker.on('click', () => navigate(`/seabin/${sb.id}`))

      marker.on('mouseover', () => {
        const el = marker.getElement()
        if (!el) return
        const dot = el.querySelector('.seabin-marker-dot') as HTMLElement | null
        if (dot) {
          dot.style.transform = 'scale(1.35)'
          dot.style.boxShadow = `0 0 0 3px ${haloColor}44, 0 6px 18px ${haloColor}66`
        }
      })

      marker.on('mouseout', () => {
        const el = marker.getElement()
        if (!el) return
        const dot = el.querySelector('.seabin-marker-dot') as HTMLElement | null
        if (dot) {
          dot.style.transform = 'scale(1)'
          dot.style.boxShadow = `0 0 0 2px ${haloColor}33, 0 4px 12px ${haloColor}55`
        }
      })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      heatRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}
