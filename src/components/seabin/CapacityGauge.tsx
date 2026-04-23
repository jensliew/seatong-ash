import { useEffect, useRef } from 'react'

interface Props {
  capacity: number   // 0–100
  size?: number      // SVG canvas size in px
}

const RADIUS = 52
const STROKE = 10
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function capacityColor(v: number) {
  if (v < 50) return { stroke: '#14b8a6', text: '#0d9488', bg: '#ccfbf1' }
  if (v < 75) return { stroke: '#f59e0b', text: '#b45309', bg: '#fef3c7' }
  if (v < 90) return { stroke: '#f97316', text: '#c2410c', bg: '#ffedd5' }
  return { stroke: '#ef4444', text: '#dc2626', bg: '#fee2e2' }
}

export default function CapacityGauge({ capacity, size = 140 }: Props) {
  const circleRef = useRef<SVGCircleElement>(null)
  const labelRef  = useRef<SVGTextElement>(null)
  const prev      = useRef(0)
  const colors    = capacityColor(capacity)

  useEffect(() => {
    const start     = prev.current
    const end       = capacity
    const duration  = 900
    let startTime: number | null = null

    function step(ts: number) {
      if (!startTime) startTime = ts
      const elapsed  = ts - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = start + (end - start) * eased

      if (circleRef.current) {
        const offset = CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE
        circleRef.current.style.strokeDashoffset = String(offset)
      }
      if (labelRef.current) {
        labelRef.current.textContent = `${Math.round(value)}%`
      }

      if (progress < 1) requestAnimationFrame(step)
      else prev.current = end
    }

    requestAnimationFrame(step)
  }, [capacity])

  const center = size / 2
  const offset = CIRCUMFERENCE - (capacity / 100) * CIRCUMFERENCE

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* track */}
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={STROKE}
        />
        {/* animated fill arc */}
        <circle
          ref={circleRef}
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke 0.4s ease' }}
        />
        {/* center label */}
        <text
          ref={labelRef}
          x={center}
          y={center + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colors.text}
          fontSize={size * 0.17}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
        >
          {capacity}%
        </text>
        {/* sub-label */}
        <text
          x={center}
          y={center + size * 0.155}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#94a3b8"
          fontSize={size * 0.09}
          fontFamily="system-ui, sans-serif"
        >
          capacity
        </text>
      </svg>
      <span
        className="rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium"
        style={{ background: colors.bg, color: colors.text }}
      >
        {capacity >= 90 ? 'Near full — empty soon' :
         capacity >= 75 ? 'High — schedule pickup' :
         capacity >= 50 ? 'Moderate' : 'Normal'}
      </span>
    </div>
  )
}
