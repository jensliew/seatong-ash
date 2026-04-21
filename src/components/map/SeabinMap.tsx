import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from 'react-router-dom'
import type { Seabin } from '../../types'

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  seabins: Seabin[]
}

export default function SeabinMap({ seabins }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [3.0089, 101.3928],
      zoom: 13,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      className: 'map-tiles',
    }).addTo(map)

    // Heatmap data
    const heatData = seabins.map((sb) => [sb.lat, sb.lng, sb.debris_intensity] as [number, number, number])

    // Dynamically import leaflet.heat
    import('leaflet.heat').then(() => {
      // @ts-expect-error leaflet.heat extends L
      L.heatLayer(heatData, {
        radius: 40,
        blur: 25,
        maxZoom: 17,
        gradient: { 0.2: '#0d9488', 0.5: '#f59e0b', 0.8: '#ef4444', 1.0: '#dc2626' },
      }).addTo(map)
    })

    // Markers
    seabins.forEach((sb) => {
      const color = sb.status === 'active' ? '#14b8a6' : sb.status === 'paused' ? '#f59e0b' : '#64748b'
      const icon = L.divIcon({
        className: 'seabin-marker',
        html: `<div class="seabin-marker-dot" style="
          --marker-color:${color};
          width:20px;height:20px;border-radius:50%;
          background:${color};border:3px solid white;
          box-shadow:0 0 12px ${color}, 0 0 24px ${color}40;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor:pointer;
          position:relative;
        ">
          <div style="
            position:absolute;top:-6px;left:-6px;
            width:32px;height:32px;border-radius:50%;
            border:2px solid ${color}60;
            animation: marker-pulse 2s ease-out infinite;
          "></div>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const riskColors: Record<string, string> = {
        low: '#0d9488',
        medium: '#f59e0b',
        high: '#f97316',
        critical: '#ef4444',
      }

      const marker = L.marker([sb.lat, sb.lng], { icon })
        .addTo(map)
        .bindTooltip(
          `<div style="font-size:12px;line-height:1.6;min-width:160px;">
            <strong style="color:#0d9488;font-size:13px;">${sb.name}</strong><br/>
            <span style="color:#64748b;">Status:</span> <span style="color:${color};font-weight:600;">${sb.status}</span><br/>
            <span style="color:#64748b;">Capacity:</span> <span style="font-weight:600;">${sb.capacity}%</span><br/>
            <span style="color:#64748b;">Contamination Risk:</span> <span style="color:${riskColors[sb.contamination_risk]};font-weight:600;">${sb.contamination_risk.toUpperCase()}</span>
          </div>`,
          { direction: 'top', offset: [0, -10], className: 'seabin-tooltip' }
        )
        .bindPopup(
          `<div style="padding:4px;min-width:140px;">
            <strong style="color:#0d9488">${sb.name}</strong><br/>
            <span style="color:#64748b;font-size:12px;">Click to view details →</span>
          </div>`,
          { className: 'custom-popup' }
        )

      marker.on('click', () => navigate(`/seabin/${sb.id}`))

      marker.on('mouseover', () => {
        const el = marker.getElement()
        if (el) {
          const dot = el.querySelector('.seabin-marker-dot') as HTMLElement
          if (dot) {
            dot.style.transform = 'scale(1.6)'
            dot.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}60`
          }
        }
      })

      marker.on('mouseout', () => {
        const el = marker.getElement()
        if (el) {
          const dot = el.querySelector('.seabin-marker-dot') as HTMLElement
          if (dot) {
            dot.style.transform = 'scale(1)'
            dot.style.boxShadow = `0 0 12px ${color}, 0 0 24px ${color}40`
          }
        }
      })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full rounded-xl" />
}
