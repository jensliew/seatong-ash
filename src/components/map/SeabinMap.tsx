import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from 'react-router-dom'
import type { Seabin } from '../../types'
import { hash01 } from '../../lib/series'

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

/** Heat layer lat/lng/intensity — core + halo from debris_intensity only. */
function debrisHeatPoints(seabins: Seabin[]): [number, number, number][] {
  const points: [number, number, number][] = []
  for (const sb of seabins) {
    let idHash = 0
    for (let i = 0; i < sb.id.length; i++) idHash = idHash * 31 + sb.id.charCodeAt(i)
    const base = Math.max(0.18, Math.min(1, sb.debris_intensity))
    points.push([sb.lat, sb.lng, base])
    for (let k = 0; k < 6; k++) {
      const angle = (k / 6) * Math.PI * 2 + hash01(idHash + k) * 0.35
      const dist = (0.00085 + hash01(idHash + k * 7) * 0.0014) * (0.85 + base * 0.35)
      points.push([
        sb.lat + Math.cos(angle) * dist,
        sb.lng + Math.sin(angle) * dist,
        base * (0.32 + hash01(idHash + 100 + k) * 0.28),
      ])
    }
  }
  return points
}

export default function SeabinMap({ seabins }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const heatLayerRef = useRef<{ setLatLngs: (pts: [number, number, number][]) => void } | null>(null)
  const seabinsRef = useRef(seabins)
  const navigate = useNavigate()

  useEffect(() => {
    seabinsRef.current = seabins
  }, [seabins])

  const syncHeat = useCallback((list: Seabin[]) => {
    const layer = heatLayerRef.current
    if (!layer) return
    layer.setLatLngs(debrisHeatPoints(list))
  }, [])

  const syncMarkers = useCallback(
    (list: Seabin[]) => {
      const layer = markersLayerRef.current
      if (!layer) return
      layer.clearLayers()

      list.forEach((sb) => {
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
          .addTo(layer)
          .bindTooltip(
            `<div style="font-size:12px;line-height:1.6;min-width:200px;font-family:inherit;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px;">
              <strong style="color:#0f172a;font-size:13px;">${sb.name}</strong>
              <span style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">${sb.area}</span>
            </div>
            <div style="display:flex;gap:6px;margin:4px 0 6px;">
              <span style="padding:1px 8px;border-radius:999px;background:${color}15;color:${color};font-weight:600;font-size:11px;">${sb.status}</span>
              <span style="padding:1px 8px;border-radius:999px;background:${riskColor[sb.contamination_risk]}15;color:${riskColor[sb.contamination_risk]};font-weight:600;font-size:11px;">${sb.contamination_risk} risk</span>
            </div>
            <div style="color:#475569;">Debris intensity <strong style="color:#0f172a;">${(sb.debris_intensity * 100).toFixed(0)}%</strong> · Capacity <strong style="color:#0f172a;">${sb.capacity}%</strong></div>
          </div>`,
            {
              direction: 'top',
              offset: [0, -12],
              className: 'seabin-tooltip',
            },
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
    },
    [navigate],
  )

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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      pane: 'shadowPane',
    }).addTo(map)

    const heatGradient = {
      0.15: '#14b8a6',
      0.35: '#fde68a',
      0.55: '#fb923c',
      0.75: '#ef4444',
      1.0: '#b91c1c',
    }

    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer

    import('leaflet.heat').then(() => {
      const initial = debrisHeatPoints(seabinsRef.current)
      // @ts-expect-error leaflet.heat extends L
      const hLayer = L.heatLayer(initial, {
        radius: 72,
        blur: 46,
        maxZoom: 17,
        minOpacity: 0.32,
        gradient: heatGradient,
      }).addTo(map)
      heatLayerRef.current = hLayer
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersLayerRef.current = null
      heatLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!markersLayerRef.current) return
    syncMarkers(seabins)
    syncHeat(seabins)
  }, [seabins, syncMarkers, syncHeat])

  return <div ref={containerRef} className="h-full w-full" />
}
